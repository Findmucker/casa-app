import { NextResponse } from "next/server";

// Initialize Firebase Admin (singleton) - only if env vars are configured
async function getAdmin() {
  const admin = (await import("firebase-admin")).default;
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin;
}

export async function GET() {
  const adm = await getAdmin();
  if (!adm) {
    return NextResponse.json(
      { error: "Firebase Admin not configured", hasProjectId: !!process.env.FIREBASE_PROJECT_ID, hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL, hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY },
      { status: 503 }
    );
  }

  const db = adm.firestore();

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
          await adm.messaging().send({
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
                icon: "/icon-192.png",
                badge: "/icon-192.png",
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
