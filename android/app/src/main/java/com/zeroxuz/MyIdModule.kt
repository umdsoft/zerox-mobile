package com.zeroxuz

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.util.Base64
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import uz.myid.android.sdk.capture.MyIdClient
import uz.myid.android.sdk.capture.MyIdConfig
import uz.myid.android.sdk.capture.MyIdException
import uz.myid.android.sdk.capture.MyIdResult
import uz.myid.android.sdk.capture.MyIdResultListener
import uz.myid.android.sdk.capture.model.MyIdCameraShape
import uz.myid.android.sdk.capture.model.MyIdEnvironment
import uz.myid.android.sdk.capture.model.MyIdEvent
import uz.myid.android.sdk.capture.model.MyIdGraphicFieldType
import uz.myid.android.sdk.capture.model.MyIdLocale
import java.io.ByteArrayOutputStream

class MyIdModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
    LifecycleEventListener, ActivityEventListener, MyIdResultListener {
    private val myIdClient = MyIdClient()

    init {
        reactContext.addLifecycleEventListener(this)
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "MyIdModule"
    }

    override fun onHostResume() {
    }

    override fun onHostPause() {
    }

    override fun onHostDestroy() {
    }

    @ReactMethod
    fun addListener(eventName: String?) {
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        intent: Intent?
    ) {
        myIdClient.handleActivityResult(resultCode, this)
    }

    override fun onNewIntent(intent: Intent) {
    }

    override fun onSuccess(result: MyIdResult) {
        val params = Arguments.createMap()
        val bitmap = result.getGraphicFieldImageByType(MyIdGraphicFieldType.FacePortrait)
        val base64Image = bitmap?.let { encodeToBase64(it) }
        params.putString("code", result.code)
        params.putString("image", base64Image)
        sendEvent("onSuccess", params)
    }

    override fun onError(e: MyIdException) {
        val params = Arguments.createMap()
        params.putString("message", e.message)
        params.putInt("code", e.code!!)

        sendEvent("onError", params)
    }

    override fun onEvent(event: MyIdEvent) {
//        TODO("Not yet implemented")
    }

    override fun onUserExited() {
        val params = Arguments.createMap()
        params.putString("message", "User exited")

        sendEvent("onUserExited", params)
    }

    @ReactMethod
    fun startMyId(lang: String) {

        val defaultLang = when (lang) {
            "uz" -> MyIdLocale.Uzbek
            "ru" -> MyIdLocale.Russian
            "en" -> MyIdLocale.English
            else -> MyIdLocale.Uzbek
        }

        val myIdConfig: MyIdConfig =
            MyIdConfig.Builder("zerox_sdk-FQEPbkzGnIZrejYj6AHdXRsWIywt9lcRiDZDhXJC")
                .withClientHash(
                    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsw3Ad+h8EgEjt+5sdTxveshhapa+Q0anEajGtEGt6KLJgOfk54AU/RwBIvBPFJRUQqOAbngtFFS6SCWt26AtG8QtRRVL+xWF//2u/66bXVjrHlCKuBQNVoISJ+YyfVLpOhQYlrRyLP23sKrJdB2PBYlovP1HCWFP56KUn5T1dSluBy5h81ZSfmsUJO5U1lKLli2WMOPCFl9K1/6TOuRSv70U/nZX+pRLCIPzrdlf9zCLL49OShztalJOYtXibasqTrNCd0sBzTNbiQ3uGkmK5RH+L2hi4dy1vDEwH7VqMLcogJXnTEYAZ3KCAxmIUXvkhDstWK5uH8Ru0uZskcR5GwIDAQAB",
                    "7b4507ca-9b70-4e92-8bfe-767db25a0be2",
                )
                .withLocale(defaultLang)
                .withEnvironment(MyIdEnvironment.Production)
                .withCameraShape(MyIdCameraShape.Circle)
                .build()

        if (reactContext.currentActivity != null) {
            myIdClient.startActivityForResult(
                reactContext.currentActivity!!, 1, myIdConfig, this
            )
        }
    }

    private fun sendEvent(
        eventName: String,
        params: WritableMap?
    ) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun encodeToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
    }

}


