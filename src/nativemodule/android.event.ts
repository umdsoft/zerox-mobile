import {NativeEventEmitter, NativeModules, Platform} from 'react-native';
let androidFace, iosFace;
let eimzo: any, smsListener, AppInfoInstalled, eventIos;
if (Platform.OS === 'android') {
  const {startMyId} = NativeModules?.MyIdModule;
  // const {AppInstalled} = NativeModules?.Eimzo;
  androidFace = startMyId;
  // eimzo = OpenEimzo;
  // AppInfoInstalled = AppInstalled;
}
if (Platform.OS === 'ios') {
  const {startMyId} = NativeModules?.MyIdModule;
  eventIos = new NativeEventEmitter(NativeModules?.MyIdModule);
  iosFace = startMyId;
}

export {androidFace, eimzo, smsListener, AppInfoInstalled, iosFace, eventIos};
