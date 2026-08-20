package com.findmucker.casa

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class CasinhaMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.data["title"] ?: message.notification?.title ?: return
        val body = message.data["body"] ?: message.notification?.body.orEmpty()
        val tag = message.data["tag"] ?: "general"
        CasinhaNotifications.show(this, title, body, tag, habit = tag.startsWith("habit-"))
    }

    override fun onNewToken(token: String) {
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return
        FirebaseFirestore.getInstance().collection("fcm_tokens").document(uid).set(
            mapOf("uid" to uid, "token" to token, "platform" to "android", "updatedAt" to FieldValue.serverTimestamp()),
        )
    }
}
