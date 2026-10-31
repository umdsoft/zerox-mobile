/**
 * SEC (2026-10-31): root/jailbreak signali. Ilova BLOKLANMAYDI: 'compromised' bo'lsa bir
 * martalik ogohlantirish ko'rsatiladi va API so'rovlariga `X-Device-Integrity: compromised`
 * sarlavhasi qo'shiladi (backend keyinroq cheklay oladi). Native modul yo'q bo'lsa 'unknown'.
 * Bu heuristika — yashirish vositalari (Magisk Hide, Shadow) uni aldashi mumkin.
 */
import { NativeModules } from 'react-native';
import axios from 'axios';
import { prefsStorage } from '../store/api/token/getToken';

export type DeviceIntegrity = 'ok' | 'compromised' | 'unknown';

export const INTEGRITY_HEADER = 'X-Device-Integrity';
const WARNED_KEY = 'deviceIntegrityWarned';

let status: DeviceIntegrity = 'unknown';
let pending: Promise<DeviceIntegrity> | null = null;

/** Oxirgi ma'lum natija (sinxron; tekshiruv tugaguncha 'unknown'). */
export const getDeviceIntegrity = (): DeviceIntegrity => status;

export const checkDeviceIntegrity = (): Promise<DeviceIntegrity> => {
  if (pending) return pending;
  pending = (async (): Promise<DeviceIntegrity> => {
    try {
      const mod = (NativeModules as any)?.DeviceIntegrity;
      if (!mod?.check) return 'unknown';
      const res = await mod.check();
      return res === 'compromised' ? 'compromised' : res === 'ok' ? 'ok' : 'unknown';
    } catch {
      return 'unknown';
    }
  })().then(r => {
    status = r;
    if (r === 'compromised') {
      // Default axios (ko'pchilik xom chaqiruvlar) uchun; apiClient o'z interceptor'ida o'qiydi.
      axios.defaults.headers.common[INTEGRITY_HEADER] = 'compromised';
    }
    return r;
  });
  return pending;
};

export const shouldShowIntegrityWarning = (): boolean => {
  try {
    return prefsStorage.getBoolean(WARNED_KEY) !== true;
  } catch {
    return true;
  }
};

export const markIntegrityWarningShown = (): void => {
  try {
    prefsStorage.set(WARNED_KEY, true);
  } catch {}
};
