/**
 * cardBin.ts — plastik karta BIN tekshiruvi (2026-09-15, SS15).
 *
 * MUAMMO: ilgari faqat `8600` (Uzcard) va `9860` (Humo) bilan boshlanadigan
 * kartalar qabul qilinardi. Ammo Uzcard/Humo emitentlarida boshqa BIN'lar ham
 * bor (masalan `5614`), va ular kiritib bo'lmasdi.
 *
 * YECHIM: "ruxsat ro'yxati" o'rniga "RAD ETISH ro'yxati" — talab aynan shunday:
 * «Tizim faqat Visa, Mastercard va boshqa xalqaro kartalarni qabul qilmasligi
 * kerak». Ya'ni mahalliy BIN'larni to'liq sanab chiqish shart emas (ular
 * vaqti-vaqti bilan qo'shiladi), xalqaro sxemalar diapazoni esa barqaror.
 *
 * ⚠️ DIAPAZONLAR KESISHMASLIGI (maxsus tekshirilgan):
 *   Mastercard 51–55  vs Uzcard 5614 (56…) — kesishmaydi
 *   Discover  65, 644–649 vs Uzcard 6262 (62…) — kesishmaydi
 *   UnionPay 62 ataylab RO'YXATGA KIRITILMADI — u Uzcard 6262 bilan to'qnashardi.
 */

/** Faqat raqamlar. */
export const cardDigits = (raw: string | null | undefined): string =>
  String(raw || '').replace(/\D/g, '').slice(0, 16);

/** Xalqaro to'lov sxemalari (mahalliy kartalarga tegmaydigan diapazonlar). */
const INTERNATIONAL: { name: string; test: (d: string) => boolean }[] = [
  { name: 'Visa', test: d => d.startsWith('4') },
  {
    name: 'Mastercard',
    test: d => {
      const p2 = Number(d.slice(0, 2));
      const p4 = Number(d.slice(0, 4));
      return (p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720);
    },
  },
  { name: 'American Express', test: d => d.startsWith('34') || d.startsWith('37') },
  {
    name: 'Diners Club',
    test: d => {
      const p3 = Number(d.slice(0, 3));
      return (p3 >= 300 && p3 <= 305) || d.startsWith('36') || d.startsWith('38');
    },
  },
  {
    name: 'JCB',
    test: d => {
      const p4 = Number(d.slice(0, 4));
      return p4 >= 3528 && p4 <= 3589;
    },
  },
  {
    name: 'Discover',
    test: d => {
      const p3 = Number(d.slice(0, 3));
      return d.startsWith('6011') || (p3 >= 644 && p3 <= 649) || d.startsWith('65');
    },
  },
];

/** Karta xalqaro sxemaga tegishlimi? Tegishli bo'lsa — nomi, aks holda null. */
/**
 * SS7 (2026-09-18): karta raqamini 4 xonadan GURUHLAB ko'rsatish.
 *
 * 🔴 NEGA KERAK: raqam bazaga bo'shliqlari bilan saqlanadi va ekranda XOM
 * holda chiqarilardi. Agar u boshqa joyda (sayt, eski versiya, qo'lda tahrir)
 * boshqacha bo'linib yozilgan bo'lsa, xuddi shu buzuq ko'rinish chiqaverardi:
 *   "9860  350 1 46 83 9 245"
 * Endi ko'rsatishdan oldin RAQAMLARGA ajratib, qaytadan guruhlanadi — saqlangan
 * qiymat qanday bo'lishidan qat'i nazar natija doim to'g'ri.
 */
export const fmtCard4 = (raw: string | null | undefined): string => {
  const d = cardDigits(raw);
  if (!d) return String(raw == null ? '' : raw);
  return d.replace(/(.{4})(?=.)/g, '$1 ');
};

export const internationalScheme = (raw: string): string | null => {
  const d = cardDigits(raw);
  if (d.length < 2) return null; // hali yozilmoqda — hukm chiqarmaymiz
  const hit = INTERNATIONAL.find(s => s.test(d));
  return hit ? hit.name : null;
};

/** Mahalliy (O'zbekiston) kartami — ya'ni xalqaro sxemaga kirmaydimi. */
export const isLocalCard = (raw: string): boolean => {
  const d = cardDigits(raw);
  if (!d) return true; // bo'sh — rekvizitni O'CHIRISH holati, taqiqlanmaydi
  return internationalScheme(d) === null;
};

/** Ko'rsatish uchun tizim nomi (bilinsa). Bilinmasa bo'sh satr. */
export const localBrand = (raw: string): string => {
  const d = cardDigits(raw);
  if (d.startsWith('9860')) return 'Humo';
  if (d.startsWith('8600') || d.startsWith('5614') || d.startsWith('6262')) return 'Uzcard';
  return '';
};
