//
//  MyIdModule.swift
//  ZeroX
//
//  Created by AlisherRakhimov on 06/10/2025.
//

import Foundation
import MyIdSDK
import React

@objc(MyIdModule)
class MyIdModule: RCTEventEmitter {
  @objc
  static func constantsToExport() -> [String: Any] {
    return ["initialCount": 0]
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  override func supportedEvents() -> [String]! {
    return ["onSuccess", "onError", "onUserExited"]
  }

  @objc
  func startMyId() {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
      
      let config = MyIdConfig()
      config.clientId = "zerox_sdk-FQEPbkzGnIZrejYj6AHdXRsWIywt9lcRiDZDhXJC"
      config.clientHash = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsw3Ad+h8EgEjt+5sdTxveshhapa+Q0anEajGtEGt6KLJgOfk54AU/RwBIvBPFJRUQqOAbngtFFS6SCWt26AtG8QtRRVL+xWF//2u/66bXVjrHlCKuBQNVoISJ+YyfVLpOhQYlrRyLP23sKrJdB2PBYlovP1HCWFP56KUn5T1dSluBy5h81ZSfmsUJO5U1lKLli2WMOPCFl9K1/6TOuRSv70U/nZX+pRLCIPzrdlf9zCLL49OShztalJOYtXibasqTrNCd0sBzTNbiQ3uGkmK5RH+L2hi4dy1vDEwH7VqMLcogJXnTEYAZ3KCAxmIUXvkhDstWK5uH8Ru0uZskcR5GwIDAQAB"
      config.clientHashId = "7b4507ca-9b70-4e92-8bfe-767db25a0be2"
      config.environment = .production
      config.cameraShape = .circle
      config.locale = .uzbek
      MyIdClient.start(withConfig: config, withDelegate: self)
    }
  }
}

extension MyIdModule: MyIdClientDelegate {
  func onSuccess(result: MyIdSDK.MyIdResult) {
    if let image = result.image {
      if let imageData = image.jpegData(compressionQuality: 1) { // Compression quality can be adjusted
        let base64String = imageData.base64EncodedString(options: .lineLength64Characters)
        sendEvent(withName: "onSuccess", body: ["code": result.code, "comparison": result.comparisonValue, "image": base64String])
      } else {
        // Handle failure to get image data
        sendEvent(withName: "onError", body: ["message": "Failed to convert image to Data", "code": 0])
      }
    } else {
      // Handle the case where there is no image
      sendEvent(withName: "onError", body: ["message": "No image available", "code": 0])
    }
  }

  func onError(exception: MyIdSDK.MyIdException) {
    sendEvent(
      withName: "onError",
      body: [
        "message": exception.message,
        "code": exception.code
      ]
    )
  }

  func onUserExited() {
    sendEvent(
      withName: "onUserExited",
      body: [
        "message": "exited"
      ]
    )
  }
}
