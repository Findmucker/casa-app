import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Firebase Admin (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export async function GET(request: Request) {
  // Verify this is called by Vercel Cron (or allow in dev)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Check alarms within the last 1 minute window
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const alarmsSnap = await db
      .collection("alarms")
      .where("active", "==", true)
      .get();

    let sent = 0;

    for (const alarmDoc of alarmsSnap.docs) {
      const alarm = alarmDoc.data();
      const alarmTime = new Date(alarm.datetime);

      // Check if alarm should fire in this window
      if (alarmTime > oneMinuteAgo && alarmTime <= now) {
        // Get the token for this alarm's owner
        const tokenDoc = await db.collection("fcm_tokens").doc(alarm.owner).get();
        if (!tokenDoc.exists) continue;

        const { token } = tokenDoc.data()!;

        // Send push notification
        try {
          await admin.messaging().send({
            token,
            notification: {
              title: `⏰ ${alarm.title}`,
              body: `Alarme para ${alarm.owner === "eduardo" ? "Eduardo" : "Moniquinha"}`,
            },
            android: {
              priority: "high",
              notification: {
                sound: "default",
                channelId: "alarms",
                priority: "max",
                vibrateTimingsMillis: [300, 100, 300, 100, 300],
              },
            },
            webpush: {
              headers: { Urgency: "high" },
              notification: {
                icon: "/icon.svg",
                badge: "/icon.svg",
                vibrate: [300, 100, 300, 100, 300],
                requireInteraction: true,
              },
            },
          });
          sent++;
        } catch (e) {
          console.error(`Failed to send to ${alarm.owner}:`, e);
        }

        // Handle repeat logic
        if (alarm.repeat === "daily") {
          const next = new Date(alarmTime);
          next.setDate(next.getDate() + 1);
          await alarmDoc.ref.update({ datetime: next.toISOString() });
        } else if (alarm.repeat === "weekly") {
          const next = new Date(alarmTime);
          next.setDate(next.getDate() + 7);
          await alarmDoc.ref.update({ datetime: next.toISOString() });
        } else {
          // One-time alarm: deactivate
          await alarmDoc.ref.update({ active: false });
        }
      }
    }

    return NextResponse.json({ ok: true, sent, checked: alarmsSnap.size });
  } catch (e) {
    console.error("Alarm check error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
