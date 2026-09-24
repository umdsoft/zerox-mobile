/**
 * phone.ts — SS-AUDIT (2026-09-25): O'zbekiston telefon raqami yordamchilari,
 * YAGONA manba. Ilgari aynan shu 3–5 qatorli funksiyalar 9 ta ekranda
 * (FinancePayoutCard, QarzDaftariKarta, QarzDaftariXodimYangi,
 * QarzDaftariMijozYangi, FinanceDebtAdd, FinanceFamily, FinanceGapDetail,
 * FinanceDebtGroup, FinanceDebts) alohida nusxa qilingan edi.
 *
 * Xulq o'zgarmagan: nusxalar qanday ishlagan bo'lsa shunday.
 */

/** Kiritilgan matndan "+998"dan keyingi 9 raqam (BIRINCHI 9 tasi — input uchun). */
export const phoneDigits9 = (raw?: string | null): string => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  return d.slice(0, 9);
};

/** Saqlangan raqamdan OXIRGI 9 raqam (guruhlash kaliti); 9 tadan kam bo'lsa ''. */
export const phoneLast9 = (raw?: string | null): string => {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length >= 9 ? d.slice(-9) : '';
};

/** 9 raqamni "93 752 44 11" (2-3-2-2) ko'rinishida guruhlaydi (qisman kiritilganda ham). */
export const formatPhone9 = (d: string): string =>
  [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');

/** Ixtiyoriy formatdagi raqam -> "93 752 44 11". */
export const fmtPhoneUz = (raw?: string | null): string => formatPhone9(phoneDigits9(raw));

/** "+998 93 752 44 11"; 9 raqam bo'lmasa — asl matn o'zgarishsiz. */
export const fmtPhoneUzFull = (raw?: string | null): string => {
  const d = String(raw || '').replace(/\D/g, '');
  const c = d.length > 9 ? d.slice(-9) : d;
  if (c.length !== 9) return String(raw || '');
  return `+998 ${formatPhone9(c)}`;
};
