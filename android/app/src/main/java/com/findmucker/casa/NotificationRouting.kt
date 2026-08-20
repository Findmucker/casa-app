package com.findmucker.casa

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

const val NOTIFICATION_TAG_EXTRA = "notification_tag"

private const val UPDATES_CHANNEL_ID = "casinha_updates"
private const val HABITS_CHANNEL_ID = "casinha_habits"

fun notificationTabForTag(tag: String): DashboardTab = when {
    tag.startsWith("habit-") -> DashboardTab.HABITS
    tag == "urgent-shopping" -> DashboardTab.SHOPPING
    tag == "new-event" || tag.startsWith("event-reminder") -> DashboardTab.EVENTS
    tag.startsWith("birthday-") -> DashboardTab.CALENDAR
    else -> DashboardTab.HOME
}

object NotificationNavigation {
    private val mutableTarget = MutableStateFlow<DashboardTab?>(null)
    val target = mutableTarget.asStateFlow()

    fun publish(tag: String?) {
        if (!tag.isNullOrBlank()) {
            mutableTarget.value = notificationTabForTag(tag)
        }
    }

    fun consume() {
        mutableTarget.value = null
    }
}

object CasinhaNotifications {
    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannels(
            listOf(
                NotificationChannel(
                    UPDATES_CHANNEL_ID,
                    "Atualizações da casa",
                    NotificationManager.IMPORTANCE_HIGH,
                ).apply {
                    description = "Mensagens, eventos, compras e aniversários"
                    enableVibration(true)
                },
                NotificationChannel(
                    HABITS_CHANNEL_ID,
                    "Lembretes de rotinas",
                    NotificationManager.IMPORTANCE_HIGH,
                ).apply {
                    description = "Lembretes das rotinas ainda por concluir"
                    enableVibration(true)
                },
            ),
        )
    }

    fun show(
        context: Context,
        title: String,
        body: String,
        tag: String,
        habit: Boolean = false,
    ) {
        if (!context.canPostNotifications()) return

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(NOTIFICATION_TAG_EXTRA, tag)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            tag.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val channelId = if (habit) HABITS_CHANNEL_ID else UPDATES_CHANNEL_ID
        val category = if (habit) {
            NotificationCompat.CATEGORY_REMINDER
        } else {
            NotificationCompat.CATEGORY_MESSAGE
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(category)
            .setVibrate(longArrayOf(0, 200, 100, 200))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        try {
            NotificationManagerCompat.from(context).notify(tag, tag.hashCode(), notification)
        } catch (_: SecurityException) {
            return
        }
    }
}

private fun Context.canPostNotifications(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
