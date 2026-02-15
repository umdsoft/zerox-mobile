//
//  MyIdModule.m
//  zerox
//
//  Created by AlisherRakhimov on 31/08/24.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(MyIdModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startMyId)

RCT_EXTERN_METHOD(startMyId:
  (NSString *) sessionId
  (NSString *) lang
//  (NSString *) dateOfBirth
)

@end
