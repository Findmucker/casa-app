import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import {
  DEFAULT_REMINDER_TIME_ZONE,
  DEFAULT_REMINDER_WINDOW_MINUTES,
  getLocalClock,
  getReminderOccurrence,
} from "@/lib/habit-reminder-time";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const timeZone = process.env.REMINDER_TIME_ZONE || DEFAULT_REMINDER_TIME_ZONE;
  const configuredWindow = Number(process.env.REMINDER_WINDOW_MINUTES);
  const reminderWindowMinutes = Number.isFinite(configuredWindow) && configuredWindow > 0
    ? configuredWindow
    : DEFAULT_REMINDER_WINDOW_MINUTES;
  const localClock = getLocalClock(now, timeZone);
  const currentMinutes = localClock.minutes;
  let sent = 0;
  let deduplicated = 0;
  let missingTokens = 0;
  let invalidTokens = 0;
  let failed = 0;
  const unmatchedAssignees: Array<{ houseId: string; habitId: string; assignee: string }> = [];

  try {
    const housesSnap = await db.collection("houses").get();

    for (const houseDoc of housesSnap.docs) {
      const houseId = houseDoc.id;

      // Get habits with reminder times
      const habitsSnap = await db.collection("houses").doc(houseId).collection("habits").get();
      if (habitsSnap.empty) continue;

      const checksByDate = new Map<string, Set<string>>();
      const getCheckedHabitIds = async (date: string) => {
        const cached = checksByDate.get(date);
        if (cached) return cached;
        const checksSnap = await db
          .collection("houses")
          .doc(houseId)
          .collection("habit_checks")
          .where("date", "==", date)
          .get();
        const checked = new Set<string>(checksSnap.docs.map((document) => document.data().habitId));
        checksByDate.set(date, checked);
        return checked;
      };

      for (const habitDoc of habitsSnap.docs) {
        const habit = habitDoc.data();

        // Skip habits without reminder time
        if (!habit.reminderTime) continue;

        const occurrence = getReminderOccurrence(now, habit.reminderTime, timeZone, reminderWindowMinutes);
        if (!occurrence) continue;

        if ((await getCheckedHabitIds(occurrence.date)).has(habitDoc.id)) continue;

        // Check if today is an active day
        const days: number[] | undefined = habit.days;
        if (days && days.length > 0 && !days.includes(occurrence.day)) continue;

        // Determine who to notify
        const assignee = habit.assignee;
        const membersSnap = await db.collection("houses").doc(houseId).get();
        const members: Array<{ uid?: string; name: string }> = membersSnap.data()?.members || [];
        const targets: Array<{ uid?: string; name: string }> = [];

        if (!assignee || assignee === "ambos") {
          // Send to all house members
          targets.push(...members);
        } else {
          const normalizedAssignee = String(assignee).trim().toLocaleLowerCase("pt-PT");
          const member = members.find((item) => item.name.trim().toLocaleLowerCase("pt-PT") === normalizedAssignee);
          if (member) {
            targets.push(member);
          } else {
            unmatchedAssignees.push({ houseId, habitId: habitDoc.id, assignee: String(assignee) });
          }
        }

        for (const target of targets) {
          let tokenDoc = await db.collection("fcm_tokens").doc(target.uid || target.name.toLowerCase()).get();
          if (!tokenDoc.exists && target.uid) {
            tokenDoc = await db.collection("fcm_tokens").doc(target.name.toLowerCase()).get();
          }
          if (!tokenDoc.exists) {
            missingTokens++;
            continue;
          }

          const { token } = tokenDoc.data()!;
          const deliveryId = `${occurrence.date}_${houseId}_${habitDoc.id}_${target.uid || target.name.toLowerCase()}`;
          const deliveryRef = db.collection("notification_deliveries").doc(deliveryId);
          const leaseUntil = adm.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000);
          const claimed = await db.runTransaction(async (transaction) => {
            const existing = await transaction.get(deliveryRef);
            const data = existing.data();
            if (data?.status === "sent") return false;
            if (data?.status === "sending" && data.lockedUntil?.toMillis?.() > Date.now()) return false;
            transaction.set(deliveryRef, {
              status: "sending",
              lockedUntil: leaseUntil,
              attempts: (data?.attempts || 0) + 1,
              houseId,
              habitId: habitDoc.id,
              uid: target.uid || null,
              reminderDate: occurrence.date,
              updatedAt: adm.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            return true;
          });
          if (!claimed) {
            deduplicated++;
            continue;
          }

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
            await deliveryRef.set({
              status: "sent",
              sentAt: adm.firestore.FieldValue.serverTimestamp(),
              lockedUntil: adm.firestore.FieldValue.delete(),
            }, { merge: true });
            sent++;
          } catch (e) {
            const code = typeof e === "object" && e !== null && "code" in e ? String(e.code) : "unknown";
            if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
              await tokenDoc.ref.delete();
              invalidTokens++;
            } else {
              failed++;
            }
            await deliveryRef.delete().catch(() => {});
            console.error(`Failed to send habit reminder to ${target.name} (${code}):`, e);
          }
        }
      }
    }

    // ─── Event reminders (tomorrow's events) ───
    // Only run around 8am (between 7:50 and 8:10)
    if (currentMinutes >= 470 && currentMinutes <= 490) {
      const tomorrow = new Date(`${localClock.date}T12:00:00Z`);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
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
      const todayMmDd = localClock.date.slice(5);

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

    return NextResponse.json({
      ok: failed === 0,
      sent,
      deduplicated,
      missingTokens,
      invalidTokens,
      failed,
      unmatchedAssignees,
      timestamp: now.toISOString(),
      localTime: `${localClock.date}T${localClock.time}`,
      timeZone,
      reminderWindowMinutes,
    });
  } catch (e) {
    console.error("Habit cron error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
