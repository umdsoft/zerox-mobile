/**
 * forceUpdate.ts — majburiy yangilanish (SS-DEV 2026-10-04, 04.10 hujjat 6-band).
 *
 * Backend: GET /version/check?platform=android|ios&current=X (PUBLIC) →
 *   { min_version, latest_version, store_url, store_web_url }.
 * Ilova versiyasi (react-native-device-info getVersion) < min_version → bloklanadi.
 * Tarmoq/server xatosida BLOKLAMAYDI (null qaytadi).
 */
import axios from 'axios';
import { Linking, Platform } from 'react-native';
import { getVersion } from 'react-native-device-info';
import { URL } from '../screens/constants';

/** iOS App Store ID — loyihadagi mavjud havoladan (apps.apple.com/uz/app/zerox/id6446497826). */
export const IOS_APP_STORE_ID = '6446497826';
export const ANDROID_PACKAGE = 'com.zeroxuz';

const DEFAULT_STORE = Platform.select({
  ios: {
    store_url: `itms-apps://apps.apple.com/app/id${IOS_APP_STORE_ID}`,
    store_web_url: `https://apps.apple.com/app/id${IOS_APP_STORE_ID}`,
  },
  default: {
    store_url: `market://details?id=${ANDROID_PACKAGE}`,
    store_web_url: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
  },
});

export type VersionPolicy = {
  min_version: string;
  latest_version: string;
  store_url: string;
  store_web_url: string;
};

/** "1.10" > "1.9"; yetishmagan qismlar 0. */
export const compareVersions = (a: string, b: string): number => {
  const pa = String(a).split('.').map(x => parseInt(x, 10) || 0);
  const pb = String(b).split('.').map(x => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
};

const VERSION_RE = /^\d+(\.\d+){0,3}$/;

/** Siyosatni oladi; xato/noto'g'ri javobda `null` (bloklamaslik). */
export const fetchVersionPolicy = async (): Promise<VersionPolicy | null> => {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const res = await axios.get(`${URL}/version/check`, {
      params: { platform, current: getVersion() },
      timeout: 8000,
    });
    const d = res?.data?.data;
    const min = String(d?.min_version || '');
    if (!VERSION_RE.test(min)) return null;
    return {
      min_version: min,
      latest_version: String(d?.latest_version || min),
      store_url: String(d?.store_url || DEFAULT_STORE.store_url),
      store_web_url: String(d?.store_web_url || DEFAULT_STORE.store_web_url),
    };
  } catch {
    return null;
  }
};

/** Joriy ilova versiyasi min_version dan pastmi. */
export const isUpdateRequired = (policy: VersionPolicy | null): boolean => {
  if (!policy) return false;
  return compareVersions(getVersion(), policy.min_version) < 0;
};

/** Do'kon sahifasini ochadi: native (market:// / itms-apps://), bo'lmasa https. */
export const openStore = async (policy?: VersionPolicy | null) => {
  const native = policy?.store_url || DEFAULT_STORE.store_url;
  const web = policy?.store_web_url || DEFAULT_STORE.store_web_url;
  try {
    await Linking.openURL(native);
  } catch {
    try {
      await Linking.openURL(web);
    } catch {
      // ochib bo'lmadi — oyna baribir ochiq qoladi
    }
  }
};
