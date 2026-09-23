/**
 * uzCyrillic.ts — o'zbek LOTIN matnini KIRILLGA o'girish (faqat KO'RSATISH uchun).
 *
 * 🔴 SS5 MUAMMOSI (2026-09-17): tizim tili kirill bo'lsa ham, do'kon manzilidagi
 * viloyat/tuman ro'yxati lotinda chiqardi ("Andijon viloyati", "Bag'dod").
 *
 * ⚠️ NEGA TARJIMA FAYLIGA QO'SHILMADI: `uzbekistanRegions.ts` dagi nomlar
 * backendga AYNAN SHU SATR sifatida yuboriladi va bazada shunday saqlanadi
 * (`savdo_faoliyat.region` / `.district`). Ularni tarjima kalitiga aylantirish
 * ~200 ta qator talab qilardi va bitta xato yozuv saqlangan qiymatni buzardi.
 * Shuning uchun SAQLANADIGAN qiymat lotinda qoladi, o'zgarish faqat EKRANDA.
 *
 * Qoidalar o'zbek lotin-kirill imlosiga mos:
 *   sh→ш, ch→ч, ng→нг, yo→ё, yu→ю, ya→я, ye→е, o'→ў, g'→ғ, x→х, h→ҳ, ts→ц
 * Ko'p harfli birikmalar BIRINCHI tekshiriladi (aks holda "sh" → "сҳ" bo'lardi).
 */

/** Apostrofning barcha ko'rinishlari (U+2018/U+2019/U+02BB/oddiy '). */
const APOS = "['‘’ʻʼ`]";

type Rule = [RegExp, string];

/**
 * Tartib MUHIM: uzunroq birikmalar oldin.
 * Har qoida ikki marta beriladi — bosh harf va kichik harf uchun.
 */
const RULES: Rule[] = [
  // O'zbekcha maxsus harflar (apostrofli)
  [new RegExp(`O${APOS}`, 'g'), 'Ў'],
  [new RegExp(`o${APOS}`, 'g'), 'ў'],
  [new RegExp(`G${APOS}`, 'g'), 'Ғ'],
  [new RegExp(`g${APOS}`, 'g'), 'ғ'],

  // Uch harfli
  [/Sch/g, 'Щ'], [/sch/g, 'щ'],

  // Ikki harfli
  [/Sh/g, 'Ш'], [/SH/g, 'Ш'], [/sh/g, 'ш'],
  [/Ch/g, 'Ч'], [/CH/g, 'Ч'], [/ch/g, 'ч'],
  [/Ng/g, 'Нг'], [/ng/g, 'нг'],
  [/Yo/g, 'Ё'], [/YO/g, 'Ё'], [/yo/g, 'ё'],
  [/Yu/g, 'Ю'], [/YU/g, 'Ю'], [/yu/g, 'ю'],
  [/Ya/g, 'Я'], [/YA/g, 'Я'], [/ya/g, 'я'],
  [/Ye/g, 'Е'], [/ye/g, 'е'],
  [/Ts/g, 'Ц'], [/ts/g, 'ц'],

  // Bir harfli
  [/A/g, 'А'], [/a/g, 'а'],
  [/B/g, 'Б'], [/b/g, 'б'],
  [/D/g, 'Д'], [/d/g, 'д'],
  [/E/g, 'Э'], [/e/g, 'е'],
  [/F/g, 'Ф'], [/f/g, 'ф'],
  [/G/g, 'Г'], [/g/g, 'г'],
  [/H/g, 'Ҳ'], [/h/g, 'ҳ'],
  [/I/g, 'И'], [/i/g, 'и'],
  [/J/g, 'Ж'], [/j/g, 'ж'],
  [/K/g, 'К'], [/k/g, 'к'],
  [/L/g, 'Л'], [/l/g, 'л'],
  [/M/g, 'М'], [/m/g, 'м'],
  [/N/g, 'Н'], [/n/g, 'н'],
  [/O/g, 'О'], [/o/g, 'о'],
  [/P/g, 'П'], [/p/g, 'п'],
  [/Q/g, 'Қ'], [/q/g, 'қ'],
  [/R/g, 'Р'], [/r/g, 'р'],
  [/S/g, 'С'], [/s/g, 'с'],
  [/T/g, 'Т'], [/t/g, 'т'],
  [/U/g, 'У'], [/u/g, 'у'],
  [/V/g, 'В'], [/v/g, 'в'],
  [/X/g, 'Х'], [/x/g, 'х'],
  [/Y/g, 'Й'], [/y/g, 'й'],
  [/Z/g, 'З'], [/z/g, 'з'],
];

/** Lotin matnni kirillga o'giradi. Raqam va tinish belgilari tegilmaydi. */
export function uzLatinToCyrillic(input: string): string {
  let out = String(input == null ? '' : input);
  for (const [re, to] of RULES) out = out.replace(re, to);
  return out;
}

/**
 * Tilga qarab joy nomini ko'rsatish shakli.
 * Kirill (`kr`) va rus (`ru`) tillarida kirill yozuvi ishlatiladi —
 * qolganlarida asl lotin qoladi.
 */
export function localizePlace(name: string, lang?: string): string {
  const l = String(lang || '').toLowerCase();
  if (l === 'kr' || l === 'ru') return uzLatinToCyrillic(name);
  return String(name == null ? '' : name);
}
