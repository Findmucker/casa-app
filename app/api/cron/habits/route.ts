import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * Habit reminder cron — runs every 10 minutes.
 * Sends push notifications for unchecked habits when:
 * - Current time >= reminderTime
 * - Current time <= reminderTime + 2 hours (avoid spam all night)
 * - Today is an active day for the habit
 * - Habit is not yet checked today
 */
export async function GET(request: NextRequest) {
  // Auth check — require CRON_SECRET for external callers
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adm = await getFirebaseAdmin();
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
        const membersSnap = await db.collection("houses").doc(houseId).get();
        const members: Array<{ uid?: string; name: string }> = membersSnap.data()?.members || [];
        const targets: Array<{ uid?: string; name: string }> = [];

        if (!assignee || assignee === "ambos") {
          // Send to all house members
          targets.push(...members);
        } else {
          const member = members.find((item) => item.name.toLowerCase() === assignee.toLowerCase());
          if (member) targets.push(member);
        }

        for (const target of targets) {
          let tokenDoc = await db.collection("fcm_tokens").doc(target.uid || target.name.toLowerCase()).get();
          if (!tokenDoc.exists && target.uid) {
            tokenDoc = await db.collection("fcm_tokens").doc(target.name.toLowerCase()).get();
          }
          if (!tokenDoc.exists) continue;

          const { token } = tokenDoc.data()!;

          try {
            await adm.messaging().send({
              token,
              data: {
                title: `${habit.emoji || "💊"} ${habit.name}`,
                body: "Não te esqueças da tua rotina! 🏡",
                tag: `habit-${habitDoc.id}`,
              },
              webpush: {
                headers: { Urgency: "high" },
              },
            });
            sent++;
          } catch (e) {
            console.error(`Failed to send habit reminder to ${target.name}:`, e);
          }
        }
      }
    }

    // ─── Event reminders (tomorrow's events) ───
    // Only run around 8am (between 7:50 and 8:10)
    if (currentMinutes >= 470 && currentMinutes <= 490) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      for (const houseDoc of housesSnap.docs) {
        const houseId = houseDoc.id;
        const houseMembers: Array<{ uid?: string; name: string }> = houseDoc.data().members || [];

        try {
          const eventsSnap = await db.collection("houses").doc(houseId).collection("events")
            .where("date", "==", tomorrowStr).get();

          for (const eventDoc of eventsSnap.docs) {
            const event = eventDoc.data();
            for (const member of houseMembers) {
              let tokenDoc = await db.collection("fcm_tokens").doc(member.uid || member.name.toLowerCase()).get();
              if (!tokenDoc.exists && member.uid) {
                tokenDoc = await db.collection("fcm_tokens").doc(member.name.toLowerCase()).get();
              }
              if (!tokenDoc.exists) continue;
              try {
                await adm.messaging().send({
                  token: tokenDoc.data()!.token,
                  data: { title: `📅 Evento amanhã!`, body: `"${event.title}" é amanhã`, tag: `event-reminder-${eventDoc.id}` },
                  webpush: { headers: { Urgency: "high" } },
                });
                sent++;
              } catch { /* skip */ }
            }
          }
        } catch { /* skip house */ }
      }

      // ─── Birthday notifications (today) ───
      const todayMmDd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      for (const houseDoc of housesSnap.docs) {
        const houseMembers: Array<{ name: string; uid?: string }> = houseDoc.data().members || [];

        for (const member of houseMembers) {
          if (!member.uid) continue;
          try {
            const userDoc = await db.collection("users").doc(member.uid).get();
            if (!userDoc.exists) continue;
            const birthDate: string | undefined = userDoc.data()?.birthDate;
            if (!birthDate) continue;
            const parts = birthDate.split("-");
            const mmdd = parts.length === 3 ? `${parts[1]}-${parts[2]}` : birthDate;
            if (mmdd !== todayMmDd) continue;

            // Notify all OTHER members of the same house
            for (const other of houseMembers) {
              if (other.name === member.name) continue;
              let tokenDoc = await db.collection("fcm_tokens").doc(other.uid || other.name.toLowerCase()).get();
              if (!tokenDoc.exists && other.uid) {
                tokenDoc = await db.collection("fcm_tokens").doc(other.name.toLowerCase()).get();
              }
              if (!tokenDoc.exists) continue;
              try {
                await adm.messaging().send({
                  token: tokenDoc.data()!.token,
                  data: { title: `🎂 Parabéns!`, body: `Hoje é o aniversário de ${member.name}!`, tag: `birthday-${member.name}` },
                  webpush: { headers: { Urgency: "high" } },
                });
                sent++;
              } catch { /* skip */ }
            }
          } catch { /* skip */ }
        }
      }
    }

    return NextResponse.json({ ok: true, sent, timestamp: now.toISOString() });
  } catch (e) {
    console.error("Habit cron error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
