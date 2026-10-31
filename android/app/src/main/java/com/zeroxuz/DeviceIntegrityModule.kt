package com.zeroxuz

import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

/**
 * Oddiy root belgilarini tekshiradi (su binarylar, test-keys, ma'lum root ilovalar, yozilishi
 * mumkin /system). Bu HEURISTIKA: Magisk Hide kabi vositalar uni aldashi mumkin — natija
 * faqat signal sifatida ishlatiladi (ilova bloklanmaydi).
 * JS: NativeModules.DeviceIntegrity.check() -> Promise<"ok" | "compromised">
 */
class DeviceIntegrityModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DeviceIntegrity"

    @ReactMethod
    fun check(promise: Promise) {
        try {
            val bad = hasTestKeys() || hasSuBinary() || hasRootPackage() || isSystemWritable()
            promise.resolve(if (bad) "compromised" else "ok")
        } catch (e: Throwable) {
            promise.reject("E_INTEGRITY", e)
        }
    }

    private fun hasTestKeys(): Boolean {
        val tags = Build.TAGS
        return tags != null && tags.contains("test-keys")
    }

    private fun hasSuBinary(): Boolean {
        val paths = arrayOf(
            "/system/bin/su", "/system/xbin/su", "/sbin/su", "/system/su",
            "/system/sd/xbin/su", "/system/bin/failsafe/su", "/data/local/su",
            "/data/local/xbin/su", "/data/local/bin/su", "/su/bin/su",
            "/system/app/Superuser.apk", "/system/app/SuperSU.apk"
        )
        return paths.any { path ->
            try {
                File(path).exists()
            } catch (e: Throwable) {
                false
            }
        }
    }

    private fun hasRootPackage(): Boolean {
        val packages = arrayOf(
            "com.topjohnwu.magisk", "eu.chainfire.supersu", "com.noshufou.android.su",
            "com.koushikdutta.superuser", "com.thirdparty.superuser", "com.yellowes.su",
            "com.kingouser.com", "me.phh.superuser", "com.zachspong.temprootremovejb"
        )
        val pm = reactContext.packageManager
        return packages.any { pkg ->
            try {
                pm.getPackageInfo(pkg, 0)
                true
            } catch (e: PackageManager.NameNotFoundException) {
                false
            } catch (e: Throwable) {
                false
            }
        }
    }

    private fun isSystemWritable(): Boolean {
        return try {
            File("/system").canWrite()
        } catch (e: Throwable) {
            false
        }
    }
}
