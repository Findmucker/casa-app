package com.findmucker.casa

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.time.Duration
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime

private const val HabitIdExtra = "habit_id"
private const val HabitNameExtra = "habit_name"
private const val HabitEmojiExtra = "habit_emoji"
private const val HouseIdExtra = "house_id"
private const val ReminderTimeExtra = "reminder_time"
private const val ReminderDaysExtra = "reminder_days"
private const val ReminderDateExtra = "reminder_date"
private const val WindowEndExtra = "window_end"
private val ReminderZone = ZoneId.of("Europe/Lisbon")

data class HabitReminder(
    val houseId: String,
    val habitId: String,
    val name: String,
    val emoji: String,
    val reminderTime: String,
    val days: List<Int>,
)

object HabitReminderScheduler {
    private const val PreferencesName = "casinha_habit_reminders"
    private const val ScheduledIdsKey = "scheduled_ids"

    fun sync(context: Context, reminders: List<HabitReminder>, checks: List<HabitCheck>) {
        val preferences = context.getSharedPreferences(PreferencesName, Context.MODE_PRIVATE)
        val previousIds = preferences.getStringSet(ScheduledIdsKey, emptySet()).orEmpty()
        val currentIds = reminders.mapTo(mutableSetOf()) { it.habitId }
        (previousIds - currentIds).forEach { cancel(context, it) }
        val today = LocalDate.now(ReminderZone).toString()
        val checkedToday = checks.filter { it.date == today }.mapTo(mutableSetOf()) { it.habitId }
        reminders.forEach { reminder -> scheduleNext(context, reminder, skipDate = today.takeIf { reminder.habitId in checkedToday }) }
        preferences.edit().putStringSet(ScheduledIdsKey, currentIds).apply()
    }

    fun cancel(context: Context, habitId: String) {
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        manager.cancel(pendingIntent(context, habitId, Intent(context, HabitReminderReceiver::class.java)))
    }

    fun scheduleNext(context: Context, reminder: HabitReminder, afterMillis: Long = System.currentTimeMillis(), skipDate: String? = null) {
        val occurrence = nextOccurrence(reminder.reminderTime, reminder.days, afterMillis, skipDate) ?: return
        schedule(context, reminder, occurrence.first, occurrence.second)
    }

    fun scheduleRepeat(context: Context, reminder: HabitReminder, occurrenceDate: String, windowEnd: Long, trigger: Long) {
        schedule(context, reminder, trigger, windowEnd, occurrenceDate)
    }

    private fun schedule(
        context: Context,
        reminder: HabitReminder,
        trigger: Long,
        windowEnd: Long,
        occurrenceDate: String = ZonedDateTime.ofInstant(java.time.Instant.ofEpochMilli(trigger), ReminderZone).toLocalDate().toString(),
    ) {
        val intent = Intent(context, HabitReminderReceiver::class.java).apply {
            putExtra(HouseIdExtra, reminder.houseId)
            putExtra(HabitIdExtra, reminder.habitId)
            putExtra(HabitNameExtra, reminder.name)
            putExtra(HabitEmojiExtra, reminder.emoji)
            putExtra(ReminderTimeExtra, reminder.reminderTime)
            putExtra(ReminderDaysExtra, reminder.days.joinToString(","))
            putExtra(ReminderDateExtra, occurrenceDate)
            putExtra(WindowEndExtra, windowEnd)
        }
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent(context, reminder.habitId, intent))
    }

    private fun pendingIntent(context: Context, habitId: String, intent: Intent): PendingIntent = PendingIntent.getBroadcast(
        context,
        habitId.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
}

class HabitReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pending = goAsync()
        val appContext = context.applicationContext
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            try {
                handleReminder(appContext, intent)
            } finally {
                pending.finish()
            }
        }
    }

    private suspend fun handleReminder(context: Context, intent: Intent) {
        val houseId = intent.getStringExtra(HouseIdExtra) ?: return
        val habitId = intent.getStringExtra(HabitIdExtra) ?: return
        val occurrenceDate = intent.getStringExtra(ReminderDateExtra) ?: return
        val reminder = HabitReminder(
            houseId = houseId,
            habitId = habitId,
            name = intent.getStringExtra(HabitNameExtra) ?: "Rotina",
            emoji = intent.getStringExtra(HabitEmojiExtra) ?: "💊",
            reminderTime = intent.getStringExtra(ReminderTimeExtra) ?: return,
            days = intent.getStringExtra(ReminderDaysExtra).orEmpty().split(',').mapNotNull(String::toIntOrNull),
        )
        val checked = runCatching {
            FirebaseFirestore.getInstance()
                .collection("houses").document(houseId).collection("habit_checks")
                .whereEqualTo("habitId", habitId).get().await().documents
                .any { it.getString("date") == occurrenceDate }
        }.getOrDefault(false)
        if (checked) {
            HabitReminderScheduler.scheduleNext(context, reminder, skipDate = occurrenceDate)
            return
        }

        val now = System.currentTimeMillis()
        val windowEnd = intent.getLongExtra(WindowEndExtra, now)
        if (now <= windowEnd) {
            CasinhaNotifications.show(
                context,
                "${reminder.emoji} ${reminder.name}",
                "Não te esqueças da tua rotina! 🏡",
                "habit-$habitId",
                habit = true,
            )
        }
        val repeatAt = now + Duration.ofMinutes(10).toMillis()
        if (repeatAt <= windowEnd) {
            HabitReminderScheduler.scheduleRepeat(context, reminder, occurrenceDate, windowEnd, repeatAt)
        } else {
            HabitReminderScheduler.scheduleNext(context, reminder, afterMillis = now, skipDate = occurrenceDate)
        }
    }
}

private fun nextOccurrence(
    reminderTime: String,
    days: List<Int>,
    afterMillis: Long,
    skipDate: String?,
): Pair<Long, Long>? {
    val time = runCatching { LocalTime.parse(reminderTime) }.getOrNull() ?: return null
    val after = ZonedDateTime.ofInstant(java.time.Instant.ofEpochMilli(afterMillis), ReminderZone)
    for (offset in 0..8) {
        val date = after.toLocalDate().plusDays(offset.toLong())
        if (date.toString() == skipDate) continue
        val javascriptDay = date.dayOfWeek.value % 7
        if (days.isNotEmpty() && javascriptDay !in days) continue
        val target = ZonedDateTime.of(date, time, ReminderZone)
        if (target.toInstant().toEpochMilli() <= afterMillis) continue
        return target.toInstant().toEpochMilli() to target.plusHours(2).toInstant().toEpochMilli()
    }
    return null
}
