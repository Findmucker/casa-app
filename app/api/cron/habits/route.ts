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

/**
 * Habit reminder cron — runs every 10 minutes.
 * Sends push notifications for unchecked habits when:
 * - Current time >= reminderTime
 * - Current time <= reminderTime + 2 hours (avoid spam all night)
 * - Today is an active day for the habit
 * - Habit is not yet checked today
 */
export async function GET() {
  const adm = await getAdmin();
  if (!adm) {
    return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 503 });
  }

  const db = adm.firestore();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDay = now.getDay(); // 0=dom, 1=seg, ..., 6=sáb
  let sent = 0;

  try {
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

        // Skip habits without reminder time
        if (!habit.reminderTime) continue;

        // Skip if already checked today
        if (checkedHabitIds.has(habitDoc.id)) continue;

        // Check if today is an active day
        const days: number[] | undefined = habit.days;
        if (days && days.length > 0 && !days.includes(currentDay)) continue;

        // Parse reminder time
        const [h, m] = habit.reminderTime.split(":").map(Number);
        const reminderMinutes = h * 60 + m;

        // Only send if current time >= reminder time
        if (currentMinutes < reminderMinutes) continue;

        // Stop after 2 hours past reminder time (avoid spam)
        if (currentMinutes > reminderMinutes + 120) continue;

        // Determine who to notify
        const assignee = habit.assignee;
        const targets: string[] = [];

        if (!assignee || assignee === "ambos") {
          // Send to all house members
          const membersSnap = await db.collection("houses").doc(houseId).get();
          const members: Array<{ name: string }> = membersSnap.data()?.members || [];
          for (const member of members) {
            targets.push(member.name.toLowerCase());
          }
        } else {
          targets.push(assignee.toLowerCase());
        }

        for (const target of targets) {
          const tokenDoc = await db.collection("fcm_tokens").doc(target).get();
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
                  tag: `habit-${habitDoc.id}`, // collapses repeated notifications
                  renotify: true as unknown as undefined,
                  vibrate: [200, 100, 200] as unknown as number[],
                },
              },
            });
            sent++;
          } catch (e) {
            console.error(`Failed to send habit reminder to ${target}:`, e);
          }
        }
      }
    }

    return NextResponse.json({ ok: true, sent, timestamp: now.toISOString() });
  } catch (e) {
    console.error("Habit cron error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
