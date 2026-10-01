/**
 * qarzSmsTemplates.ts — Qarz daftari mijoz sahifasidagi SMS ikonkasi uchun
 * TAYYOR SMS SHABLONLARI.
 *
 * SS-DEV (2026-09-29, 29.09 hujjat 3-band): SMS ikonkasi bosilganda telefonning
 * SMS ilovasi DARHOL bitta qat'iy matn bilan ochilib ketardi. Talab: «avval tayyor
 * sms shabloni chiqishi kerak. Shulardan birini tanlaganidan keyingina sms qismiga
 * o'tishi kerak». Bu fayl — sof funksiya (UI'siz, test qilinadi): holatga mos
 * (muddati o'tgan / muddati yaqin / qisman to'langan) muloyim, rasmiy matnlar.
 *
 * Matnlar i18n kalitlari (string-as-key) — ilova tilida tuziladi.
 */

export type QarzSmsInput = {
  /** 'berish' — mijoz bizdan qarzdor; 'olish' — biz mijozdan qarz olganmiz. */
  turi: 'berish' | 'olish' | string;
  /** Mijoz ismi (bo'sh yoki "Noma’lum" bo'lsa murojaatsiz salomlashuv). */
  ism?: string;
  /** Do'kon (savdo faoliyati) nomi. */
  dokon?: string;
  /** Qoldiq qarz matni, masalan "366 668 UZS va 20 USD". Bo'sh — qarz yo'q. */
  summa?: string;
  /** Eng yaqin (yoki muddati o'tgan) qaytarish sanasi, DD.MM.YYYY. */
  sana?: string;
  /** Qaytarish muddati o'tganmi. */
  overdue?: boolean;
  /** Qarzning bir qismi qaytarilganmi (undirilgan > 0 va qoldiq > 0). */
  partlyPaid?: boolean;
};

type T = (key: string, opts?: Record<string, unknown>) => string;

const UNKNOWN_NAMES = new Set(['', 'noma’lum', "noma'lum", 'nomaʼlum']);

/** Salomlashuv + matn + imzo (do'kon nomi bo'lsa). */
const compose = (t: T, ism: string, dokon: string, body: string): string => {
  const greet = UNKNOWN_NAMES.has(ism.trim().toLowerCase())
    ? t('Assalomu alaykum!')
    : t('Assalomu alaykum, {{ism}}!', { ism: ism.trim() });
  const sign = dokon ? ` ${t('Hurmat bilan, {{dokon}}.', { dokon })}` : '';
  return `${greet} ${body}${sign}`;
};

/**
 * Holatga mos SMS shablonlari ro'yxati (birinchisi — eng mos keladigani).
 * Qarz yo'q bo'lsa — faqat minnatdorchilik matni.
 */
export const buildQarzSmsTemplates = (t: T, input: QarzSmsInput): string[] => {
  const ism = String(input.ism || '');
  const summa = String(input.summa || '').trim();
  const sana = String(input.sana || '').trim();
  const dokonRaw = String(input.dokon || '').trim();
  // Matn ichida do'kon nomi bo'lmasa — umumiy "do'konimiz".
  const dokon = dokonRaw || t('do‘konimiz');
  const c = (body: string) => compose(t, ism, dokonRaw, body);

  if (input.turi === 'olish') {
    // Biz QARZDORMIZ — mijozga (qarz beruvchiga) yozamiz.
    if (!summa) return [c(t('Qarzimizni to‘liq qaytarganmiz. Ishonchingiz uchun rahmat!'))];
    const list = [c(t('{{summa}} miqdoridagi qarzimizni yaqin kunlarda qaytaramiz. Sabr-toqatingiz uchun rahmat.', { summa }))];
    if (sana) list.push(c(t('{{summa}} miqdoridagi qarzimizni {{sana}} gacha qaytarishga harakat qilamiz.', { summa, sana })));
    list.push(c(t('Qarzni qaytarish uchun plastik karta raqamingizni yuborsangiz.')));
    list.push(c(t('Qarz to‘lovi bo‘yicha qulay vaqtda gaplashib olsak bo‘ladimi?')));
    return list;
  }

  // Mijoz BIZDAN qarzdor — muloyim eslatmalar.
  if (!summa) return [c(t('Qarzingizni to‘liq qaytarganingiz uchun rahmat! Sizni yana kutib qolamiz.'))];
  const list: string[] = [];
  if (input.overdue && sana) {
    list.push(c(t('{{dokon}}dagi {{summa}} qarzingizni qaytarish muddati ({{sana}}) o‘tib ketdi. Iltimos, qarzni tezroq qaytaring yoki biz bilan bog‘laning.', { dokon, summa, sana })));
  }
  list.push(c(t('{{dokon}}dan {{summa}} miqdorida qarzingiz borligini eslatib o‘tamiz. Imkon qadar tezroq qaytarishingizni so‘raymiz.', { dokon, summa })));
  if (sana && !input.overdue) {
    list.push(c(t('{{dokon}}dagi {{summa}} qarzingizni qaytarish sanasi — {{sana}}. Iltimos, to‘lovni o‘z vaqtida amalga oshiring.', { dokon, summa, sana })));
  }
  if (input.partlyPaid) {
    list.push(c(t('To‘lovingiz uchun rahmat! {{dokon}}dagi qoldiq qarzingiz {{summa}}. Qolgan qismini ham o‘z vaqtida qaytarishingizni so‘raymiz.', { dokon, summa })));
  }
  list.push(c(t('{{dokon}}dagi {{summa}} qarzingizni qachon qaytara olishingizni ma’lum qilsangiz. Oldindan rahmat!', { dokon, summa })));
  // Avvalgi (yagona) matn ham ro'yxatda qoladi — "bugun qaytarish" talabi.
  list.push(c(t('Sizning {{dokon}}dan {{summa}} qarzingiz mavjud. Ushbu qarzni bugun qaytarishingiz talab qilinadi.', { dokon, summa })));
  return list;
};

/**
 * `sms:` havolasi. iOS `&body=`, Android `?body=` kutadi (aks holda iOS'da matn
 * tushmay qolishi mumkin). Matn bo'lmasa — faqat raqam (bo'sh SMS).
 */
export const buildSmsUrl = (phone: string, body: string | undefined, isIos: boolean): string => {
  const to = String(phone || '').replace(/[^\d+]/g, '');
  if (!body) return `sms:${to}`;
  return `sms:${to}${isIos ? '&' : '?'}body=${encodeURIComponent(body)}`;
};
