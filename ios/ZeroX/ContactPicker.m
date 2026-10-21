//
//  ContactPicker.m — telefon kontaktlaridan BITTA raqamni tanlash (iOS).
//
//  Android'dagi ContactPickerModule.kt bilan bir xil JS interfeysi:
//    NativeModules.ContactPicker.pickContact() -> Promise<{name, phone} | null>
//    null = foydalanuvchi bekor qildi.
//
//  MAXFIYLIK: CNContactPickerViewController ilova jarayonidan TASHQARIDA ishlaydi va faqat
//  foydalanuvchi tanlagan yozuvni qaytaradi — Contacts ruxsati (CNContactStore
//  requestAccess) KERAK EMAS, ruxsat oynasi chiqmaydi; "rad etish" holati ham bo'lmaydi.
//  (21.10: ilgari iOS'da bu modul yo'q edi — kontakt tugmasi iPhone'da ko'rinmasdi.)
//

#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>

@interface ContactPicker : NSObject <RCTBridgeModule, CNContactPickerDelegate>
@property (nonatomic, copy) RCTPromiseResolveBlock pendingResolve;
@property (nonatomic, strong) CNContactPickerViewController *picker;
@end

@implementation ContactPicker

RCT_EXPORT_MODULE(ContactPicker);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  // UIKit — faqat main thread.
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(pickContact:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIViewController *presenter = RCTPresentedViewController();
  if (presenter == nil) {
    reject(@"activity_null", @"No view controller available", nil);
    return;
  }

  // Avvalgi kutayotgan so'rov bo'lsa — bekor deb yakunlaymiz (Android bilan bir xil).
  [self finishWith:nil];
  self.pendingResolve = resolve;

  CNContactPickerViewController *picker = [CNContactPickerViewController new];
  picker.delegate = self;
  picker.displayedPropertyKeys = @[ CNContactPhoneNumbersKey ];
  // Raqamsiz kontaktlar tanlanmaydi; bitta raqamli kontakt darhol qaytadi,
  // bir nechta raqamli kontaktda foydalanuvchi aniq raqamni tanlaydi.
  picker.predicateForEnablingContact = [NSPredicate predicateWithFormat:@"phoneNumbers.@count > 0"];
  picker.predicateForSelectionOfContact = [NSPredicate predicateWithFormat:@"phoneNumbers.@count == 1"];
  self.picker = picker;

  [presenter presentViewController:picker animated:YES completion:nil];
}

#pragma mark - CNContactPickerDelegate

- (void)contactPickerDidCancel:(CNContactPickerViewController *)picker
{
  [self finishWith:nil];
}

- (void)contactPicker:(CNContactPickerViewController *)picker didSelectContact:(CNContact *)contact
{
  NSString *phone = @"";
  if ([contact isKeyAvailable:CNContactPhoneNumbersKey] && contact.phoneNumbers.count > 0) {
    phone = contact.phoneNumbers.firstObject.value.stringValue ?: @"";
  }
  [self finishWith:@{ @"name" : [self displayNameOf:contact], @"phone" : phone }];
}

- (void)contactPicker:(CNContactPickerViewController *)picker
    didSelectContactProperty:(CNContactProperty *)contactProperty
{
  NSString *phone = @"";
  if ([contactProperty.value isKindOfClass:[CNPhoneNumber class]]) {
    phone = ((CNPhoneNumber *)contactProperty.value).stringValue ?: @"";
  }
  [self finishWith:@{ @"name" : [self displayNameOf:contactProperty.contact], @"phone" : phone }];
}

#pragma mark - Helpers

- (NSString *)displayNameOf:(CNContact *)contact
{
  if (contact == nil) {
    return @"";
  }
  NSString *full = nil;
  @try {
    full = [CNContactFormatter stringFromContact:contact style:CNContactFormatterStyleFullName];
  } @catch (NSException *e) {
    full = nil; // kerakli kalitlar yuklanmagan bo'lsa — qo'lda yig'amiz
  }
  if (full.length > 0) {
    return full;
  }
  NSMutableArray<NSString *> *parts = [NSMutableArray array];
  if ([contact isKeyAvailable:CNContactGivenNameKey] && contact.givenName.length > 0) {
    [parts addObject:contact.givenName];
  }
  if ([contact isKeyAvailable:CNContactFamilyNameKey] && contact.familyName.length > 0) {
    [parts addObject:contact.familyName];
  }
  if (parts.count == 0 && [contact isKeyAvailable:CNContactOrganizationNameKey]) {
    return contact.organizationName ?: @"";
  }
  return [parts componentsJoinedByString:@" "];
}

- (void)finishWith:(id)result
{
  RCTPromiseResolveBlock resolve = self.pendingResolve;
  self.pendingResolve = nil;
  self.picker = nil;
  if (resolve != nil) {
    resolve(result ?: [NSNull null]);
  }
}

@end
