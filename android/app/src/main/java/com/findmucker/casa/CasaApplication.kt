package com.findmucker.casa

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions

class CasaApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        if (FirebaseApp.getApps(this).isEmpty()) {
            val options = FirebaseOptions.Builder()
                .setApiKey("AIzaSyDFijQyeFuPj4L2sjrojXaMf4yBoMvApho")
                .setApplicationId("1:776757654663:android:723d4443cad6dd283ff422")
                .setProjectId("casa-66668")
                .setStorageBucket("casa-66668.firebasestorage.app")
                .setGcmSenderId("776757654663")
                .build()

            FirebaseApp.initializeApp(this, options)
        }
        CasinhaNotifications.createChannels(this)
    }
}
