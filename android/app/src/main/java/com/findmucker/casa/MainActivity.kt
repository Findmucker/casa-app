package com.findmucker.casa

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NotificationNavigation.publish(intent?.getStringExtra(NotificationTagExtra))
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
        NotificationNavigation.publish(intent.getStringExtra(NotificationTagExtra))
    }
}
