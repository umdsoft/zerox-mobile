# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# =====================================================================
# V-011: R8/ProGuard keep-rules (release obfuscation + shrinking)
# DIQQAT: R8 yoqilgandan keyin RELEASE build'ni BARCHA funksiyalar bo'yicha
# sinab ko'ring (login, MyID, to'lov, socket, bildirishnoma, biometrika).
# Reflection ishlatadigan biror kutubxona keep-rule'siz qolsa release'da
# (debug'da emas) crash beradi.
# =====================================================================

# ---- Atributlar (signature, annotation, line-number — Crashlytics uchun) ----
-keepattributes *Annotation*,Signature,Exceptions,InnerClasses,EnclosingMethod
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ---- React Native core / bridge ----
-keep,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod *; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.ReactPackage { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-dontwarn com.facebook.react.**

# ---- Hermes / JNI / Fabric (New Architecture) ----
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }

# ---- Enum (R8 enum values()/valueOf'ni buzishi mumkin) ----
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ---- Parcelable ----
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# ---- WebView JS interface (react-native-webview) ----
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ---- Networking: OkHttp / Okio / Retrofit (firebase, axios polling) ----
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# ---- Reanimated / Gesture Handler / SafeArea / Screens ----
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

# ---- Firebase / Crashlytics ----
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# ---- MyID Capture SDK (uz.myid.sdk.capture) + Nitro ko'prik ----
# MUAMMO: keep-rule'siz R8 SDK klass/model'larini obfuscate qiladi -> SDK MyID
# server javoblarini (reflection/serialization) parse qila olmay QAYTA-QAYTA
# urinadi/timeout -> Android RELEASE'da MyID 10-12s KECHIKIB ochiladi. iOS'da
# R8 yo'q -> darhol ochiladi. Keep -> Android'da ham darhol ochiladi.
-keep class uz.myid.** { *; }
-keep interface uz.myid.** { *; }
-keepclassmembers class uz.myid.** { *; }
-dontwarn uz.myid.**
-keep class com.margelo.nitro.nitromyid.** { *; }
-keep class com.margelo.nitro.** { *; }
-dontwarn com.margelo.nitro.**

# ---- R8: kutubxonalardagi ixtiyoriy / Android'da-YO'Q sinflar (missing class xatosi) ----
# Desktop-JVM yoki optional kod yo'llari (pdfbox -> JP2 kodek, ktor -> java.lang.management).
# R8 missing class'ni XATO deb to'xtatadi; -dontwarn uni e'tiborsiz qoldiradi (xavfsiz).
-dontwarn com.gemalto.jp2.**
-dontwarn java.lang.management.**
-dontwarn javax.naming.**
-dontwarn javax.mail.**
-dontwarn org.slf4j.**
-dontwarn org.bouncycastle.**
-dontwarn io.ktor.**
-dontwarn com.tom_roush.pdfbox.**
-dontwarn org.apache.**

# ---- Coil3 (rasm yuklovchi): OkHttp fetcher desktop-only PlatformContext'ga havola ----
# Android'da coil3.PlatformContext yo'q -> R8 "missing class" xatosi. -dontwarn xavfsiz.
-dontwarn coil3.**

# Eslatma: aksariyat RN kutubxonalari o'z `consumer-proguard-rules.pro` bilan keladi
# (R8 ularni avtomatik qo'llaydi). Yuqoridagilar — qo'shimcha xavfsizlik qatlami.

# =====================================================================
# SS-SEC/SS-PERF (2026-09-25): qo'shimcha konservativ keep-rule'lar.
# Kutubxonalarning ko'pchiligi consumer-rules bilan keladi; quyidagilar
# reflection/JNI/annotation orqali ishlaydigan modullar uchun xavfsizlik qatlami.
# =====================================================================

# ---- Nitro Modules (react-native-mmkv 3.x, nitro-myid) — JNI/HybridObject ----
-keep class com.margelo.nitro.** { *; }
-keep class com.mrousavy.mmkv.** { *; }
-dontwarn com.mrousavy.**

# ---- react-native-keychain / biometrics (Android Keystore, BiometricPrompt) ----
-keep class com.oblador.keychain.** { *; }
-keep class com.rnbiometrics.** { *; }
-keep class androidx.biometric.** { *; }
-dontwarn com.oblador.keychain.**

# ---- notifee / react-native-push-notification (bildirishnoma, reflection) ----
-keep class io.invertase.notifee.** { *; }
-keep class app.notifee.core.** { *; }
-keep class com.dieam.reactnativepushnotification.** { *; }
-dontwarn io.invertase.**
-dontwarn app.notifee.**

# ---- react-native-device-info ----
-keep class com.learnium.RNDeviceInfo.** { *; }

# ---- react-native-capture-protection (FLAG_SECURE) ----
-keep class com.captureprotection.** { *; }

# ---- react-native-otp-verify (SMS Retriever) ----
-keep class com.faizal.OtpVerify.** { *; }
-keep class com.google.android.gms.auth.api.phone.** { *; }
-dontwarn com.google.android.gms.**

# ---- react-native-svg ----
-keep class com.horcrux.svg.** { *; }

# ---- react-native-vision-camera (QR/chek skaner) ----
-keep class com.mrousavy.camera.** { *; }
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**

# ---- react-native-pdf / blob-util / fs / share / file-viewer ----
-keep class org.wonday.pdf.** { *; }
-keep class com.github.barteksc.pdfviewer.** { *; }
-keep class com.shockwave.** { *; }
-keep class com.ReactNativeBlobUtil.** { *; }
-keep class com.rnfs.** { *; }
-keep class cl.json.** { *; }
-keep class com.vinzscam.reactnativefileviewer.** { *; }
-dontwarn com.shockwave.**

# ---- Skia / Reanimated worklets / Lottie / Pager / Permissions / NetInfo ----
-keep class com.shopify.reactnative.skia.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class com.airbnb.lottie.** { *; }
-keep class com.reactnativepagerview.** { *; }
-keep class com.zoontek.rnpermissions.** { *; }
-keep class com.reactnativecommunity.netinfo.** { *; }

# ---- react-native-webview (JS interface, allaqachon yuqorida) / background-timer ----
-keep class com.reactnativecommunity.webview.** { *; }
-keep class com.ocetnik.timer.** { *; }

# ---- Ilova native modullari (BiometricModule, NotificationBadgeModule) ----
-keep class com.zeroxuz.** { *; }

# ---- Kotlin metadata (Kotlin reflection/serialization ishlatadigan SDK'lar uchun) ----
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ---- Loglarni olib tashlash (release'da android.util.Log chaqiruvlari) ----
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
