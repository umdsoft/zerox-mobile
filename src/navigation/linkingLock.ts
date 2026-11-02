/**
 * linkingLock.ts — SEC (2026-11-02): deep-link PIN qulfini chetlab o'tmasin. Qulfda URL
 * tashlanmaydi, KEYINGA qoldiriladi (appLockState.deferDeepLink) va qulf ochilgach
 * useUnlockNavigation orqali ochiladi.
 */
import { Linking } from 'react-native';
import { deferDeepLink, isAppLocked } from '../helper/appLockState';

export const getInitialURLGuarded = async (): Promise<string | null | undefined> => {
  const url = await Linking.getInitialURL();
  if (url && isAppLocked()) {
    deferDeepLink(url);
    return null;
  }
  return url;
};

export const subscribeGuarded = (listener: (url: string) => void): (() => void) => {
  const sub = Linking.addEventListener('url', ({ url }) => {
    if (isAppLocked()) deferDeepLink(url);
    else listener(url);
  });
  return () => sub.remove();
};
