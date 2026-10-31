//
//  DeviceIntegrity.m — jailbreak belgilarini tekshirish (iOS). Faqat Foundation.
//
//  JS: NativeModules.DeviceIntegrity.check() -> Promise<"ok" | "compromised">
//  Bu HEURISTIKA: yashirish vositalari (Shadow, Liberty) uni aldashi mumkin — natija faqat
//  signal sifatida ishlatiladi (ilova bloklanmaydi). Simulyatorda har doim "ok".
//

#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>

@interface DeviceIntegrity : NSObject <RCTBridgeModule>
@end

@implementation DeviceIntegrity

RCT_EXPORT_MODULE(DeviceIntegrity);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (BOOL)hasJailbreakFiles
{
  NSArray<NSString *> *paths = @[
    @"/Applications/Cydia.app",
    @"/Applications/Sileo.app",
    @"/Library/MobileSubstrate/MobileSubstrate.dylib",
    @"/bin/bash",
    @"/usr/sbin/sshd",
    @"/etc/apt",
    @"/private/var/lib/apt/",
    @"/usr/bin/ssh",
    @"/var/jb"
  ];
  NSFileManager *fm = [NSFileManager defaultManager];
  for (NSString *p in paths) {
    if ([fm fileExistsAtPath:p]) {
      return YES;
    }
  }
  return NO;
}

- (BOOL)canWriteOutsideSandbox
{
  NSString *path = @"/private/zx_integrity_probe.txt";
  NSError *err = nil;
  [@"x" writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:&err];
  if (err == nil) {
    [[NSFileManager defaultManager] removeItemAtPath:path error:nil];
    return YES;
  }
  return NO;
}

RCT_EXPORT_METHOD(check:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
#if TARGET_OS_SIMULATOR
  resolve(@"ok");
#else
  BOOL bad = [self hasJailbreakFiles] || [self canWriteOutsideSandbox];
  resolve(bad ? @"compromised" : @"ok");
#endif
}

@end
