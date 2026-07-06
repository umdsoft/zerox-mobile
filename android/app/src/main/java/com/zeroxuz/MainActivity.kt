package com.zeroxuz

import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.margelo.nitro.nitromyid.NitroMyid

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ZeroX"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // MyID SDK (uz.myid.sdk.capture 3.1.x) `myIdClient.startActivityForResult(REQUEST_CODE_MY_ID)`
  // bilan ishlaydi — natija host Activity'ning onActivityResult'iga qaytadi. Uni NitroMyid'ga
  // UZATMASAK, SDK pending start() oqimini yakunlamaydi -> onSuccess/onError/onUserExited
  // HECH QACHON ishlamaydi -> MyID kamera yopilgach ilova "loading"da qotib qoladi.
  // (Bu glue avval olib tashlangan edi -> parol-tiklash MyID'dan keyin o'tmasdi.)
  @Suppress("DEPRECATION")
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode == NitroMyid.REQUEST_CODE_MY_ID) {
      NitroMyid.handleActivityResult(resultCode)
    }
  }
}
