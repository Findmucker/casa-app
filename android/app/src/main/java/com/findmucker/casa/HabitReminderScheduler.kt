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
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime

private const val HABIT_ID_EXTRA = "habit_id"
private const val HABIT_NAME_EXTRA = "habit_name"
private const val HABIT_EMOJI_EXTRA = "habit_emoji"
private const val HOUSE_ID_EXTRA = "house_id"
private const val REMINDER_TIME_EXTRA = "reminder_time"
private const val REMINDER_DAYS_EXTRA = "reminder_days"
private const val REMINDER_DATE_EXTRA = "reminder_date"
private const val WINDOW_END_EXTRA = "window_end"
private const val PREFERENCES_NAME = "casinha_habit_reminders"
private const val SCHEDULED_IDS_KEY = "scheduled_ids"
private const val REMINDER_REPEAT_MINUTES = 10L
private const val REMINDER_WINDOW_HOURS = 2L
private val REMINDER_ZONE: ZoneId = ZoneId.of("Europe/Lisbon")

data class HabitReminder(
    val houseId: String,
    val habitId: String,
    val name: String,
    val emoji: String,
    val reminderTime: String,
    val days: List<Int>,
)

object HabitReminderScheduler {
    fun sync(context: Context, reminders: List<HabitReminder>, checks: List<HabitCheck>) {
        val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        val previousIds = preferences.getStringSet(SCHEDULED_IDS_KEY, emptySet()).orEmpty()
        val currentIds = reminders.mapTo(mutableSetOf()) { it.habitId }

        (previousIds - currentIds).forEach { cancel(context, it) }

        val today = LocalDate.now(REMINDER_ZONE).toString()
        val checkedToday = checks
            .asSequence()
            .filter { it.date == today }
            .mapTo(mutableSetOf()) { it.habitId }

        reminders.forEach { reminder ->
            scheduleNext(
                context = context,
                reminder = reminder,
                skipDate = today.takeIf { reminder.habitId in checkedToday },
            )
        }

        preferences.edit().putStringSet(SCHEDULED_IDS_KEY, currentIds).apply()
    }

    fun cancel(context: Context, habitId: String) {
        alarmManager(context).cancel(
            reminderPendingIntent(
                context = context,
                habitId = habitId,
                intent = Intent(context, HabitReminderReceiver::class.java),
            ),
        )
    }

    fun scheduleNext(
        context: Context,
        reminder: HabitReminder,
        afterMillis: Long = System.currentTimeMillis(),
        skipDate: String? = null,
    ) {
        val occurrence = nextHabitOccurrence(
            reminderTime = reminder.reminderTime,
            days = reminder.days,
            afterMillis = afterMillis,
            skipDate = skipDate,
        ) ?: return

        schedule(
            context = context,
            reminder = reminder,
            triggerMillis = occurrence.triggerMillis,
            windowEndMillis = occurrence.windowEndMillis,
            occurrenceDate = occurrence.date,
        )
    }

    fun scheduleRepeat(
        context: Context,
        reminder: HabitReminder,
        occurrenceDate: String,
        windowEndMillis: Long,
        triggerMillis: Long,
    ) {
        schedule(context, reminder, triggerMillis, windowEndMillis, occurrenceDate)
    }

    private fun schedule(
        context: Context,
        reminder: HabitReminder,
        triggerMillis: Long,
        windowEndMillis: Long,
        occurrenceDate: String,
    ) {
        val intent = Intent(context, HabitReminderReceiver::class.java).apply {
            putExtra(HOUSE_ID_EXTRA, reminder.houseId)
            putExtra(HABIT_ID_EXTRA, reminder.habitId)
            putExtra(HABIT_NAME_EXTRA, reminder.name)
            putExtra(HABIT_EMOJI_EXTRA, reminder.emoji)
            putExtra(REMINDER_TIME_EXTRA, reminder.reminderTime)
            putExtra(REMINDER_DAYS_EXTRA, reminder.days.joinToString(","))
            putExtra(REMINDER_DATE_EXTRA, occurrenceDate)
            putExtra(WINDOW_END_EXTRA, windowEndMillis)
        }

        alarmManager(context).setAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            triggerMillis,
            reminderPendingIntent(context, reminder.habitId, intent),
        )
    }

    private fun alarmManager(context: Context): AlarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private fun reminderPendingIntent(
        context: Context,
        habitId: String,
        intent: Intent,
    ): PendingIntent = PendingIntent.getBroadcast(
        context,
        habitId.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
}

class HabitReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pendingResult = goAsync()
        val appContext = context.applicationContext

        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            try {
                handleReminder(appContext, intent)
            } finally {
                pendingResult.finish()
            }
        }
    }

    private suspend fun handleReminder(context: Context, intent: Intent) {
        val reminder = intent.toHabitReminder() ?: return
        val occurrenceDate = intent.getStringExtra(REMINDER_DATE_EXTRA) ?: return

        if (wasChecked(reminder.houseId, reminder.habitId, occurrenceDate)) {
            HabitReminderScheduler.scheduleNext(context, reminder, skipDate = occurrenceDate)
            return
        }

        val now = System.currentTimeMillis()
        val windowEndMillis = intent.getLongExtra(WINDOW_END_EXTRA, now)

        if (now <= windowEndMillis) {
            CasinhaNotifications.show(
                context = context,
                title = "${reminder.emoji} ${reminder.name}",
                body = "Não te esqueças da tua rotina! 🏡",
                tag = "habit-${reminder.habitId}",
                habit = true,
            )
        }

        val repeatAt = now + Duration.ofMinutes(REMINDER_REPEAT_MINUTES).toMillis()
        if (repeatAt <= windowEndMillis) {
            HabitReminderScheduler.scheduleRepeat(
                context = context,
                reminder = reminder,
                occurrenceDate = occurrenceDate,
                windowEndMillis = windowEndMillis,
                triggerMillis = repeatAt,
            )
        } else {
            HabitReminderScheduler.scheduleNext(
                context = context,
                reminder = reminder,
                afterMillis = now,
                skipDate = occurrenceDate,
            )
        }
    }

    private suspend fun wasChecked(houseId: String, habitId: String, date: String): Boolean =
        runCatching {
            FirebaseFirestore.getInstance()
                .collection("houses")
                .document(houseId)
                .collection("habit_checks")
                .whereEqualTo("habitId", habitId)
                .get()
                .await()
                .documents
                .any { it.getString("date") == date }
        }.getOrDefault(false)

    private fun Intent.toHabitReminder(): HabitReminder? {
        val houseId = getStringExtra(HOUSE_ID_EXTRA) ?: return null
        val habitId = getStringExtra(HABIT_ID_EXTRA) ?: return null
        val reminderTime = getStringExtra(REMINDER_TIME_EXTRA) ?: return null
        val days = getStringExtra(REMINDER_DAYS_EXTRA)
            .orEmpty()
            .split(',')
            .mapNotNull(String::toIntOrNull)

        return HabitReminder(
            houseId = houseId,
            habitId = habitId,
            name = getStringExtra(HABIT_NAME_EXTRA) ?: "Rotina",
            emoji = getStringExtra(HABIT_EMOJI_EXTRA) ?: "💊",
            reminderTime = reminderTime,
            days = days,
        )
    }
}

internal data class HabitOccurrence(
    val triggerMillis: Long,
    val windowEndMillis: Long,
    val date: String,
)

internal fun nextHabitOccurrence(
    reminderTime: String,
    days: List<Int>,
    afterMillis: Long,
    skipDate: String?,
    zoneId: ZoneId = REMINDER_ZONE,
): HabitOccurrence? {
    val time = runCatching { LocalTime.parse(reminderTime) }.getOrNull() ?: return null
    val after = ZonedDateTime.ofInstant(Instant.ofEpochMilli(afterMillis), zoneId)

    for (offset in 0..8) {
        val date = after.toLocalDate().plusDays(offset.toLong())
        if (date.toString() == skipDate) continue
        if (days.isNotEmpty() && scheduleDayIndex(date) !in days) continue

        val target = ZonedDateTime.of(date, time, zoneId)
        val triggerMillis = target.toInstant().toEpochMilli()
        if (triggerMillis <= afterMillis) continue

        return HabitOccurrence(
            triggerMillis = triggerMillis,
            windowEndMillis = target.plusHours(REMINDER_WINDOW_HOURS).toInstant().toEpochMilli(),
            date = date.toString(),
        )
    }

    return null
}

private fun scheduleDayIndex(date: LocalDate): Int = date.dayOfWeek.value % 7
