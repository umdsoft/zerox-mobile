package com.zeroxuz

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.ContactsContract
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * ContactPickerModule — telefon kontaktlaridan BITTA raqamni tanlash.
 *
 * MUHIM (maxfiylik): Intent.ACTION_PICK + Phone.CONTENT_URI ishlatiladi — bu
 * TIZIM tanlagichini ochadi va faqat foydalanuvchi tanlagan yozuvга vaqtinchalik
 * o'qish beradi. Shu sabab READ_CONTACTS ruxsati SHART EMAS (Play Console'да
 * "Permissions Declaration" talab qilinmaydi). Butun kontaktlar ro'yxatiga kirmaymiz.
 *
 * JS: NativeModules.ContactPicker.pickContact() -> Promise<{name, phone} | null>
 *   null = foydalanuvchi bekor qildi.
 */
class ContactPickerModule internal constructor(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    private var pickPromise: Promise? = null

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?,
        ) {
            if (requestCode != REQUEST_PICK_CONTACT) return
            val promise = pickPromise ?: return
            pickPromise = null

            if (resultCode != Activity.RESULT_OK || data?.data == null) {
                promise.resolve(null) // bekor qilindi
                return
            }

            try {
                val contactUri: Uri = data.data!!
                val projection = arrayOf(
                    ContactsContract.CommonDataKinds.Phone.NUMBER,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                )
                reactApplicationContext.contentResolver
                    .query(contactUri, projection, null, null, null)
                    .use { cursor ->
                        if (cursor != null && cursor.moveToFirst()) {
                            val number = cursor.getString(0) ?: ""
                            val name = cursor.getString(1) ?: ""
                            val map = Arguments.createMap()
                            map.putString("phone", number)
                            map.putString("name", name)
                            promise.resolve(map)
                        } else {
                            promise.resolve(null)
                        }
                    }
            } catch (e: Exception) {
                promise.reject("pick_error", e.message)
            }
        }
    }

    init {
        context.addActivityEventListener(activityEventListener)
    }

    @ReactMethod
    fun pickContact(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("activity_null", "No activity available")
            return
        }
        // Avvalgi kutayotgan so'rov bo'lsa — uni bekor deb yakunlaymiz.
        pickPromise?.resolve(null)
        pickPromise = promise
        try {
            val intent = Intent(
                Intent.ACTION_PICK,
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            )
            activity.startActivityForResult(intent, REQUEST_PICK_CONTACT)
        } catch (e: Exception) {
            pickPromise = null
            promise.reject("no_picker", e.message)
        }
    }

    override fun getName(): String = "ContactPicker"

    companion object {
        private const val REQUEST_PICK_CONTACT = 7345
    }
}
