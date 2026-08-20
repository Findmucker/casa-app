package com.findmucker.casa

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        publishNotificationTarget(intent)
        enableEdgeToEdge()
        setContent {
            CasinhaTheme {
                CasaApp()
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        publishNotificationTarget(intent)
    }

    private fun publishNotificationTarget(intent: Intent?) {
        NotificationNavigation.publish(intent?.getStringExtra(NOTIFICATION_TAG_EXTRA))
    }
}
