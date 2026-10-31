import { rd } from '../../../../../theme/rd';

// Qarz daftari uslubidagi ikkilamchi (binafsha) urg'u — Premium karta uchun.
export const VIOLET = '#6d5ae6';
export const VIOLET_TINT = '#efe9fd';

// ── Qarz daftari obuna tariflari (saytdagi tariflar sahifasi bilan bir xil). ──
// 01.10 (mobil hujjat, 2-band): "N SMS kiritilgan" endi badge tagida emas — imkoniyatlar
// ro'yxatining BIRINCHI qatori. "Ro'yxatga olish SMS (tizim)" ma'nosiz edi — aslida qarz
// qayd etilganda tizim qarzdorga avtomatik SMS yuboradi; matn shunga moslab yozildi.
// 21.10 (mobil hujjat): ro'yxat sayt shartlariga moslandi (frontend/utils/pricingPlans.js —
// Qarz daftari + Shaxsiy qarz + Shaxsiy moliya), lekin modullarga BO'LINMAGAN — har tarifda
// bitta ixcham ro'yxat (o'xshash bandlar birlashtirildi). Cheklovlar backend PLAN_FEATURES /
// smsPolicy bilan bir xil: Free — qarz/to'lov yuritish, ro'yxatga olish SMS'i, shaxsiy moliya;
// Start+ — avto eslatma, talab va to'lov SMS'i (auto_sms_reminder, manual_sms_send), SMS tarixi;
// Premium — batafsil SMS ro'yxati (sms_list), qarzlar tahlili va Excel (analytics, excel_export).
export type TariffFeature = { label: string; on: boolean };

/** Har tarif uchun yagona tartib; `level` — band qaysi tarifdan boshlab mavjud. */
export const PLAN_LEVEL: Record<string, number> = { free: 0, start: 1, premium: 2 };
export const FEATURE_ROWS: { label: string; level: number }[] = [
  { label: 'Qarz va to‘lovlarni yuritish', level: 0 },
  { label: 'Qarz qayd etilganda qarzdorga avtomatik SMS xabar yuborish', level: 0 },
  { label: 'Shaxsiy moliyani yuritish', level: 0 },
  { label: 'Avtomatik eslatma, talab va to‘lov SMS xabarlari', level: 1 },
  { label: 'SMS xabarlar tarixi va statistika', level: 1 },
  { label: 'SMS xabarlarning batafsil ro‘yxati va qidiruv', level: 2 },
  { label: 'Qarzlar tahlili va Excelga yuklab olish', level: 2 },
];

export function planFeatures(planKey: string, smsLabel: string): TariffFeature[] {
  const level = PLAN_LEVEL[planKey] ?? 0;
  return [
    { label: smsLabel, on: true },
    ...FEATURE_ROWS.map((r) => ({ label: r.label, on: r.level <= level })),
  ];
}

export const DAFTARI_TARIFFS = [
  {
    key: 'free',
    name: 'Free',
    badge: 'FREE',
    price: '0',
    accent: rd.color.textTertiary,
    tint: rd.color.surfaceAlt,
    current: true,
    features: planFeatures('free', '100 SMS kiritilgan'),
  },
  {
    key: 'start',
    name: 'Start',
    // 30.09 (mobil, 4-band): tarif nomi — START ("Ommabop" nomli tarif yo'q); ko'pchilik
    // tanlaydigan tarif ekani alohida "Ommabop" belgisi bilan ko'rsatiladi (popular).
    badge: 'START',
    popular: true,
    price: '99 000',
    accent: rd.color.primary,
    tint: rd.color.primaryTint,
    highlight: true,
    features: planFeatures('start', '500 SMS kiritilgan'),
  },
  {
    key: 'premium',
    name: 'Premium',
    badge: 'PREMIUM',
    price: '199 000',
    accent: VIOLET,
    tint: VIOLET_TINT,
    features: planFeatures('premium', '1 100 SMS kiritilgan'),
  },
];

// ── Qo'shimcha SMS paketlar (name — backend ADDON_SMS_PACKAGES bilan bir xil). ──
export const SMS_PACKETS = [
  { name: 'small', sms: '100', price: '21 000', amount: 21000 },
  { name: 'medium', sms: '200', price: '40 000', amount: 40000 },
  { name: 'large', sms: '300', price: '57 000', amount: 57000 },
];

// Tarif narxlari (UZS, son) — tasdiqlash matni va balans-tekshiruvi uchun.
export const PLAN_AMOUNT: Record<string, number> = { start: 99000, premium: 199000 };
