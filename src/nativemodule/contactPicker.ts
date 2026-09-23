import { NativeModules, Platform } from 'react-native';

const ContactPicker = NativeModules?.ContactPicker;

export type PickedContact = {
  name: string;
  /** +998 dan keyingi 9 raqam (masalan "937524411"). Bo'sh bo'lishi mumkin. */
  phone9: string;
  /** Kontaktdagi asl (formatlanmagan) raqam. */
  rawPhone: string;
};

/**
 * Kontakt raqamini O'zbekiston mobil formatiga keltiradi: faqat +998 dan
 * keyingi 9 raqam. "+998 93 752 44 11", "998937524411", "937524411" —
 * hammasi "937524411" ga aylanadi.
 */
export const normalizeUzPhone = (raw: string): string => {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  if (d.length > 9) d = d.slice(-9); // xalqaro prefiks qolsa — oxirgi 9 raqam
  return d.slice(0, 9);
};

/**
 * Tizim kontakt-tanlagichini ochadi. Foydalanuvchi bitta raqamni tanlaydi.
 * Bekor qilinsa yoki mavjud bo'lmasa — null qaytadi (xato tashlamaydi).
 */
export const pickContact = async (): Promise<PickedContact | null> => {
  if (Platform.OS !== 'android' || !ContactPicker?.pickContact) {
    return null;
  }
  try {
    const res = await ContactPicker.pickContact();
    if (!res || !res.phone) return null;
    return {
      name: res.name || '',
      phone9: normalizeUzPhone(res.phone),
      rawPhone: res.phone,
    };
  } catch (e) {
    return null;
  }
};

export const isContactPickerAvailable = (): boolean =>
  Platform.OS === 'android' && !!ContactPicker?.pickContact;
