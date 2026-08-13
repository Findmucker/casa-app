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

const val NotificationTagExtra = "notification_tag"

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
        if (!tag.isNullOrBlank()) mutableTarget.value = notificationTabForTag(tag)
    }

    fun consume() {
        mutableTarget.value = null
    }
}

object CasinhaNotifications {
    const val UpdatesChannel = "casinha_updates"
    const val HabitsChannel = "casinha_habits"

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannels(
            listOf(
                NotificationChannel(UpdatesChannel, "Atualizações da casa", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Mensagens, eventos, compras e aniversários"
                    enableVibration(true)
                },
                NotificationChannel(HabitsChannel, "Lembretes de rotinas", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Lembretes das rotinas ainda por concluir"
                    enableVibration(true)
                },
            ),
        )
    }

    fun show(context: Context, title: String, body: String, tag: String, habit: Boolean = false) {
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        val openApp = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(NotificationTagExtra, tag)
        }
        val pending = PendingIntent.getActivity(
            context,
            tag.hashCode(),
            openApp,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(context, if (habit) HabitsChannel else UpdatesChannel)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(if (habit) NotificationCompat.CATEGORY_REMINDER else NotificationCompat.CATEGORY_MESSAGE)
            .setVibrate(longArrayOf(0, 200, 100, 200))
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()
        runCatching { NotificationManagerCompat.from(context).notify(tag, tag.hashCode(), notification) }
    }
}
