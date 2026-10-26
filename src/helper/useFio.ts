/**
 * useFio.ts — identifikatsiyadan o'tgan (MyID) foydalanuvchi FISh'ini ilova tilida ko'rsatish.
 *
 * Baza o'zbek LOTINida saqlaydi; ko'rsatish tilga qarab o'zgaradi (nameTranslit.ts):
 *   ru -> rus kirilligi, kr -> o'zbek kirilligi, kaa -> qoraqalpoq lotini, uz/en -> o'zgarishsiz.
 *
 * ⚠️ FAQAT KO'RSATISH uchun. So'rov bodysi, qidiruv paramlari (API), PDF/eksport (CSV), SMS
 * va do'kon egasi qo'lda yozgan ismlar (Qarz daftari mijozlari, shaxsiy qarz kontragentlari)
 * UCHUN ISHLATMANG.
 *
 * Til kodi: i18n.language aynan 'uz' | 'kr' | 'kaa' | 'ru' | 'en' (Language.tsx /
 * SelectLanguageScreen.tsx shularni beradi, prefsStorage'da ham shu). Baribir himoya uchun
 * variantlar (oz, uz-Latn, uz-Cyrl, ru-RU, qq, ...) normallashtiriladi.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import translitName from './nameTranslit';

export type FioLang = 'uz' | 'ru' | 'kr' | 'en' | 'kaa';

export const normalizeFioLang = (raw?: string | null): FioLang => {
  const l = String(raw || '').toLowerCase();
  if (l === 'ru' || l.startsWith('ru-')) return 'ru';
  if (l === 'kr' || l === 'oz' || l === 'uz-cyrl' || l === 'uz_cyrl' || l === 'uz-cyrillic') return 'kr';
  if (l === 'kaa' || l === 'qq' || l.startsWith('kaa-') || l === 'kk-kaa') return 'kaa';
  if (l === 'en' || l.startsWith('en-')) return 'en';
  return 'uz';
};

/** Sof funksiya: berilgan tilda FISh. */
export const fioIn = (name: string | null | undefined, lang?: string | null): string =>
  translitName(name, normalizeFioLang(lang));

/** Hook BO'LMAGAN joylar (helper/format funksiyalari) uchun — joriy tilni o'qiydi. */
export const fioNow = (name: string | null | undefined): string => fioIn(name, i18n.language);

/**
 * Qidiruv: so'rov ASL (lotin) ham, KO'RSATILAYOTGAN (translit) matn bilan ham mos kelsin.
 * Qidiruv matni apostrof variantlariga befarq.
 */
const fold = (s: string) => s.toLowerCase().replace(/[ʻʼ‘’`´]/g, "'").trim();
export const fioMatches = (name: string | null | undefined, query: string, lang?: string | null): boolean => {
  const q = fold(query || '');
  if (!q) return true;
  const raw = fold(String(name || ''));
  if (raw.includes(q)) return true;
  return fold(fioIn(name, lang)).includes(q);
};

/** Komponent ichida: til o'zgarsa qayta chiziladi. */
export const useFio = () => {
  const { i18n: inst } = useTranslation();
  const lang = inst.language;
  const fio = useCallback((name: string | null | undefined) => fioIn(name, lang), [lang]);
  const matches = useCallback(
    (name: string | null | undefined, query: string) => fioMatches(name, query, lang),
    [lang],
  );
  return { fio, matches, lang: normalizeFioLang(lang) };
};

export default useFio;
