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

# Eslatma: aksariyat RN kutubxonalari o'z `consumer-proguard-rules.pro` bilan keladi
# (R8 ularni avtomatik qo'llaydi). Yuqoridagilar — qo'shimcha xavfsizlik qatlami.
