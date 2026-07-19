package com.zeroxuz

import android.content.Intent
import android.os.Bundle
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
   * `react-native-screens` TALABI: Activity qayta yaratilganda (konfiguratsiya
   * o'zgarishi — ekran burilishi, shrift o'lchami, split-screen, buklanadigan
   * telefon ochilishi) Android saqlangan FRAGMENT holatini tiklashga urinadi va
   * ilova quladi:
   *   Unable to instantiate fragment com.swmansion.rnscreens.ScreenFragment
   *
   * `super.onCreate(null)` saqlangan holatni bermaydi -> React Native navigatsiya
   * daraxtini o'zi qaytadan quradi, fragment tiklash urinishi bo'lmaydi.
   * (Emulyatorda ekran o'lchamini o'zgartirganda aynan shu crash aniqlandi.)
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

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
