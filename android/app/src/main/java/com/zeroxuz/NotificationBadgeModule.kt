package com.zeroxuz

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import me.leolin.shortcutbadger.ShortcutBadger

class NotificationBadgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(
        reactContext
    ) {
    override fun getName(): String {
        return "NotificationBadgeModule"
    }

    @ReactMethod
    fun configure(title: String?, text: String?) {
        val sharedPreferences = reactContext.getSharedPreferences(name, Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()

        editor.putString("title", title)
        editor.putString("text", text)
        editor.apply()
    }

    @ReactMethod
    fun setBadgeNumber(count: Int) {
        if (count == 0) {
            ShortcutBadger.removeCount(reactContext);
        } else {
            ShortcutBadger.applyCount(reactContext, count);
        }
    }

    @ReactMethod
    fun setNumber(count: Int, title: String?, message: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val launchIntent = reactContext.packageManager
                .getLaunchIntentForPackage(reactContext.packageName)
            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)

            val pendingIntent = PendingIntent.getActivity(
                reactContext,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val notificationManager =
                reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val notificationChannel = NotificationChannel(
                CHANNEL_ID, "Count", NotificationManager.IMPORTANCE_MIN
            )
            notificationChannel.setShowBadge(true) // Enable badge support
            notificationChannel.description = "Used to show badges on the app icon"
            notificationChannel.enableLights(false) // Disable lights
            notificationChannel.enableVibration(false) // Disable vibration
            notificationChannel.setSound(null, null) // Silent notification
            notificationManager.createNotificationChannel(notificationChannel)

            if (count == 0) {
                notificationManager.cancel(UNIQUE_ID)
                return
            }

            val sharedPreferences = reactContext.getSharedPreferences(name, Context.MODE_PRIVATE)
            val title = sharedPreferences.getString("title", title)!!
            val rawMessage =
                sharedPreferences.getString("text", message) ?: "Sizda %count% bildirishnoma bor"
            val processedMessage = rawMessage.replace("%count%", count.toString())

            val notification = NotificationCompat.Builder(reactContext, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(processedMessage)
                .setNumber(count) // Set badge count
                .setSmallIcon(R.mipmap.ic_launcher) // Ensure this icon exists
                .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL)
                .setPriority(NotificationCompat.PRIORITY_MIN) // Minimize visibility
                .setOnlyAlertOnce(true) // Prevent repeated alerts
                .setSound(null) // Silent
                .setVibrate(null) // No vibration
                .setContentIntent(pendingIntent)
                .setAutoCancel(false)
                .build()

            notificationManager.notify(UNIQUE_ID, notification)
        }
    }

    companion object {
        const val NAME: String = "NotificationBadge"
        private const val UNIQUE_ID = 1
        private const val CHANNEL_ID = "count_channel"
    }
}