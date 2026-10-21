import { NativeModules, Platform } from 'react-native';

/**
 * Tizim kontakt-tanlagichi (Android: Intent.ACTION_PICK, iOS: CNContactPickerViewController).
 * Ikkalasi ham KONTAKTLARGA RUXSAT SO'RAMAYDI — foydalanuvchi tanlagan bitta yozuvgina
 * ilovaga beriladi (butun kontaktlar ro'yxatini o'qimaymiz).
 *
 * 21.10: ilgari faqat Android'da edi (iOS'da native modul yo'q + `Platform.OS === 'android'`
 * sharti) — shu sabab iPhone'da kontakt tugmasi umuman ko'rinmasdi. Endi iOS'da ham
 * ios/ZeroX/ContactPicker.m orqali ishlaydi.
 */
const ContactPicker = NativeModules?.ContactPicker;

export type PickedContact = {
  name: string;
  /** +998 dan keyingi 9 raqam (masalan "937524411"). O'zbek raqami bo'lmasa — ''. */
  phone9: string;
  /** Kontaktdagi asl (formatlanmagan) raqam. */
  rawPhone: string;
  /** Raqam O'zbekiston formatiga mos keldimi (+998 / 998 / 0 / 8 prefiksli yoki 9 raqam). */
  isUzPhone: boolean;
};

export type PickContactResult =
  | { status: 'ok'; contact: PickedContact }
  | { status: 'cancel' }
  | { status: 'unavailable' }
  | { status: 'error'; message?: string };

const UZ_PHONE_LEN = 9;

/**
 * Kontakt raqamini O'zbekiston formatiga keltiradi: +998 dan keyingi 9 raqam.
 * "+998 93 752 44 11", "998937524411", "00998937524411", "0937524411", "8937524411",
 * "937524411" — hammasi "937524411". Boshqa davlat raqami (masalan "+7 999 …") — ''.
 */
export const normalizeUzPhone = (raw: string): string => {
  const text = String(raw || '').trim();
  let d = text.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2); // xalqaro "00" prefiksi
  if (d.startsWith('998') && d.length === UZ_PHONE_LEN + 3) return d.slice(3);
  // "+" bilan boshlanib 998 bo'lmasa — xorijiy raqam.
  if (text.startsWith('+') || text.startsWith('00')) return '';
  if (d.length === UZ_PHONE_LEN) return d;
  // Mahalliy trunk prefiksi: 0 93 … yoki eski 8 93 …
  if (d.length === UZ_PHONE_LEN + 1 && (d.startsWith('0') || d.startsWith('8'))) return d.slice(1);
  return '';
};

const toContact = (res: any): PickedContact | null => {
  if (!res || !res.phone) return null;
  const rawPhone = String(res.phone);
  const phone9 = normalizeUzPhone(rawPhone);
  return {
    name: String(res.name || '').trim(),
    phone9,
    rawPhone,
    isUzPhone: phone9.length === UZ_PHONE_LEN,
  };
};

export const isContactPickerAvailable = (): boolean =>
  (Platform.OS === 'android' || Platform.OS === 'ios') && !!ContactPicker?.pickContact;

/** Tizim tanlagichini ochadi; holatni aniq qaytaradi (xato tashlamaydi). */
export const pickContactResult = async (): Promise<PickContactResult> => {
  if (!isContactPickerAvailable()) return { status: 'unavailable' };
  try {
    const res = await ContactPicker.pickContact();
    const contact = toContact(res);
    return contact ? { status: 'ok', contact } : { status: 'cancel' };
  } catch (e: any) {
    return { status: 'error', message: e?.message };
  }
};

/**
 * Orqaga moslik: bekor qilinsa / mavjud bo'lmasa / xato — null.
 */
export const pickContact = async (): Promise<PickedContact | null> => {
  const r = await pickContactResult();
  return r.status === 'ok' ? r.contact : null;
};
