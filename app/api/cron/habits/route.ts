import { NextResponse } from "next/server";

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
    return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 503 });
  }

  const db = adm.firestore();
  const today = new Date().toISOString().split("T")[0];
  let sent = 0;

  try {
    // Get all houses
    const housesSnap = await db.collection("houses").get();

    for (const houseDoc of housesSnap.docs) {
      const houseId = houseDoc.id;

      // Get habits with reminder times
      const habitsSnap = await db.collection("houses").doc(houseId).collection("habits").get();
      if (habitsSnap.empty) continue;

      // Get today's checks
      const checksSnap = await db
        .collection("houses")
        .doc(houseId)
        .collection("habit_checks")
        .where("date", "==", today)
        .get();

      const checkedHabitIds = new Set(checksSnap.docs.map((d) => d.data().habitId));

      for (const habitDoc of habitsSnap.docs) {
        const habit = habitDoc.data();

        // Skip habits without reminder time or already checked today
        if (!habit.reminderTime || checkedHabitIds.has(habitDoc.id)) continue;

        // Check if it's time to send (within the current hour)
        const [h] = habit.reminderTime.split(":").map(Number);
        const nowHour = new Date().getHours();
        if (h !== nowHour) continue;

        // Determine who to notify
        const owner = habit.assignee || "shared";

        // Get FCM token
        const tokenDoc = await db.collection("fcm_tokens").doc(owner).get();
        if (!tokenDoc.exists) continue;

        const { token } = tokenDoc.data()!;

        try {
          await adm.messaging().send({
            token,
            notification: {
              title: `${habit.emoji || "💊"} ${habit.name}`,
              body: "Não te esqueças da tua rotina! 🏡",
            },
            data: { tag: `habit-${habitDoc.id}` },
            webpush: {
              headers: { Urgency: "high" },
              notification: {
                icon: "/icon-192.png",
                badge: "/icon-192.png",
                vibrate: [200, 100, 200] as unknown as number[],
              },
            },
          });
          sent++;
        } catch (e) {
          console.error(`Failed to send habit reminder to ${owner}:`, e);
        }
      }
    }

    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    console.error("Habit cron error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
