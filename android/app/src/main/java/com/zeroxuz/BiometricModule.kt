package com.zeroxuz

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;


@Suppress("DEPRECATED_IDENTITY_EQUALS")
class BiometricModule internal constructor(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
    private val reactContext: ReactApplicationContext = context


    @ReactMethod
    fun authenticate(errorCallback: Callback, successCallback: Callback) {
        val executor = ContextCompat.getMainExecutor(reactContext)
        val activity: FragmentActivity? = this.reactApplicationContext.currentActivity as? FragmentActivity

        if (activity == null) {
            errorCallback.invoke("activity_null")
            return
        }

        activity.runOnUiThread {
            var callbackInvoked = false // ✅ Prevent multiple invocations

            val biometricPrompt = BiometricPrompt(
                activity, executor, object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        super.onAuthenticationError(errorCode, errString)
                        if (!callbackInvoked) {
                            callbackInvoked = true
                            errorCallback.invoke("error: $errString")
                        }
                    }

                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        super.onAuthenticationSucceeded(result)
                        if (!callbackInvoked) {
                            callbackInvoked = true
                            successCallback.invoke("success")
                        }
                    }

                    override fun onAuthenticationFailed() {
                        super.onAuthenticationFailed()
                        if (!callbackInvoked) {
                            // optional: don't treat "failed" as a final result
                            // just log it or ignore
                        }
                    }
                })

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle("Biometric Authentication")
                .setSubtitle("Log in using your biometric credential")
                .setNegativeButtonText("Cancel")
                .build()

            val biometricManager = BiometricManager.from(reactContext)
            if (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) ==
                BiometricManager.BIOMETRIC_SUCCESS
            ) {
                biometricPrompt.authenticate(promptInfo)
            } else {
                if (!callbackInvoked) {
                    callbackInvoked = true
                    errorCallback.invoke("biometric_not_available")
                }
            }
        }
    }


    override fun getName(): String {
        return "BiometricModule"
    }
}
