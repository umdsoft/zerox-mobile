/**
 * gapDetailLogic.ts — FinanceGapDetail'ning SOF mantiqi (React/RN'siz). FinanceGapDetail.tsx dan
 * ko'chirilgan; xulq o'zgarmagan (__tests__/finance_gap_detail.test.tsx + gapDetailLogic.test.ts).
 */
import { localDateKey, parseLocalDate } from '../financeMoney';

type Json = Record<string, any>;

const HOUR_MS = 3600 * 1000;
/** SS3: "To'landi" belgisini bekor qilish oynasi — belgilangandan keyin 24 soat. */
export const UNPAY_WINDOW_MS = 24 * HOUR_MS;

// SS-AUDIT (2026-09-25): financeMoney.parseLocalDate / localDateKey — sana kaliti yagona manba.
export const ymdToDate = (s?: string | null): Date | null => parseLocalDate(s);
export const dateToYmd = (d?: Date | null): string | null => (d ? localDateKey(d) : null);

/** Lokatsiya havolasidan (yoki "lat,lng") koordinatani ajratish. */
export const parseLatLng = (loc?: string): { lat: number; lng: number } | null => {
  if (!loc) return null;
  const s = String(loc);
  const m = s.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/) || s.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  return null;
};

export const mapsLink = (lat: number, lng: number): string => `https://maps.google.com/?q=${lat},${lng}`;

/** Lokatsiya ochish uchun URL: https havola o'zicha, aks holda maps.google.com qidiruviga o'raladi. */
export const locationUrl = (loc: string): string =>
  /^https:\/\//i.test(loc) ? loc : `https://maps.google.com/?q=${encodeURIComponent(loc)}`;

/**
 * SS1: davra muddati o'tganmi. Sana DATE ustunidan keladi (mysql2 +05:00) —
 * shu bois faqat KUN qismi solishtiriladi. `round_expired` bayrog'i bo'lsa o'sha (server vaqti).
 */
export const isRoundOverdue = (r: Json, now: Date = new Date()): boolean => {
  if (typeof r?.round_expired === 'boolean') return r.round_expired;
  const raw = r?.due_date;
  if (!raw) return false;
  const d = new Date(String(raw).replace(' ', 'T'));
  if (isNaN(d.getTime())) return false;
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return day(d) < day(now);
};

/** Barcha to'lovlar to'langanmi (jami > 0 va to'langan >= jami). */
export const isRoundAllPaid = (r: Json): boolean =>
  Number(r?.total_count || 0) > 0 && Number(r?.paid_count || 0) >= Number(r?.total_count || 0);

/** SS3-1: standart ochiq davra — yakunlanmaganlarning birinchisi (hammasi yakunlangan bo'lsa — 0-indeks). */
export const isRoundDefaultOpen = (rounds: Json[], i: number): boolean => {
  const firstPendingIdx = rounds.findIndex(x => x?.status !== 'completed');
  return rounds[i]?.status !== 'completed' && i === (firstPendingIdx === -1 ? 0 : firstPendingIdx);
};

/**
 * Davra ochiq/yopiq almashtirish. MAVJUD XULQ saqlangan: `?? false` — standart-ochiq davrani
 * birinchi bosish uni YOPMAYDI (kalit true bo'ladi), ikkinchisi yopadi.
 */
export const toggleRoundOpen = (open: Record<string, boolean>, key: string): Record<string, boolean> => ({
  ...open,
  [key]: !(open[key] ?? false),
});

/**
 * SS11: qo'lda navbat ro'yxati. `manualOrder` bo'sh bo'lsa a'zolar tartibi; a'zo qo'shilsa/o'chirilsa
 * ro'yxat avtomatik moslashadi (yo'qolganlar chiqadi, yangilari oxiriga qo'shiladi).
 */
export const effectiveMemberOrder = (members: Json[], manualOrder: Json[]): Json[] => {
  if (!manualOrder.length) return members;
  const byId = new Map(members.map(m => [String(m.id), m]));
  const kept = manualOrder.map(m => byId.get(String(m.id))).filter(Boolean) as Json[];
  const keptIds = new Set(kept.map(m => String(m.id)));
  const added = members.filter(m => !keptIds.has(String(m.id)));
  return [...kept, ...added];
};

/** idx dagi elementni dir (-1 yuqori / +1 past) tomonga suradi; chegaradan chiqsa null. Asl ro'yxat o'zgarmaydi. */
export const moveInList = <T>(list: T[], idx: number, dir: -1 | 1): T[] | null => {
  const to = idx + dir;
  if (to < 0 || to >= list.length) return null;
  const next = list.slice();
  [next[idx], next[to]] = [next[to], next[idx]];
  return next;
};

/** Uchrashuv joyini KIM kiritishi mumkin: tashkilotchi YOKI shu davra qabul qiluvchisi. */
export const canSetVenue = (r: Json, g: Json, isOrganizer: boolean): boolean =>
  isOrganizer || r?.recipient_member_id === g.my_member_id;

export type VenueMode = 'venue' | 'card';
export interface VenueForm {
  mode: VenueMode;
  roundId: any;
  venue: string;
  location: string;
  card_number: string;
  card_holder: string;
}

/** Ikkala rejim ham bir endpoint'ga saqlanadi — maydonlar birga yuklanadi, faqat KO'RSATISH bo'linadi. */
export const venueFormFor = (mode: VenueMode, r: Json): VenueForm => ({
  mode,
  roundId: r.id,
  venue: r.venue || '',
  location: r.location || '',
  card_number: r.card_number || '',
  card_holder: r.card_holder || '',
});

/** Manzil FAQAT manzil oynasida majburiy (karta oynasida manzil yuborilmaydi). */
export const isVenueAddressMissing = (f: Json): boolean => f.mode !== 'card' && !String(f.venue || '').trim();

export const buildVenueBody = (f: Json): Json =>
  f.mode === 'card'
    ? {
        card_number: String(f.card_number || '').replace(/[^\d ]/g, '').trim(),
        card_holder: String(f.card_holder || '').trim(), // SS7: karta egasi (ixtiyoriy)
      }
    : {
        venue: String(f.venue).trim(),
        location: String(f.location || '').trim() || '',
      };

/** Karta maydoni: faqat raqamlar, 16 tagacha, 4 tadan guruhlab. */
export const formatCardInput = (v: string): string =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

/** SS11: sozlamalar oynasining boshlang'ich qiymati. */
export const settingsFormFor = (g: Json): Json => ({
  name: g.name || '',
  frequency: g.frequency || 'monthly',
  day_of_month: String(g.day_of_month || 1),
  start_date: ymdToDate(g.start_date), // SS6: bo'sh = bugundan
});

export const buildSettingsBody = (s: Json): Json => ({
  name: String(s.name).trim(),
  frequency: s.frequency,
  day_of_month: Number(s.day_of_month) || 1,
  start_date: dateToYmd(s.start_date),
});

/** Tugma holati: null = ko'rinmaydi; asInvite = "Taklif yuborish" (aks holda "To'lov haqida ogohlantirish"). */
export const inviteButtonState = (
  r: Json,
  ctx: { isOpen: boolean; canSet: boolean },
  now: Date = new Date(),
): { asInvite: boolean } | null => {
  if (!(ctx.isOpen && ctx.canSet && r.status !== 'completed' && !isRoundAllPaid(r))) return null;
  return { asInvite: !!r.venue && !isRoundOverdue(r, now) };
};

/** SS3: bekor qilish oynasi — faqat tashkilotchi/qabul qiluvchida, belgilangandan keyin 24 soat ichida. */
export const canUnpayPayment = (p: Json, mayManage: boolean, nowMs: number = Date.now()): boolean => {
  if (!mayManage || p.status !== 'paid') return false;
  const ms = p.paid_at ? new Date(String(p.paid_at).replace(' ', 'T')).getTime() : 0;
  if (!ms || isNaN(ms)) return true; // sana noma'lum — backend hal qiladi
  return nowMs - ms <= UNPAY_WINDOW_MS;
};

/** Davra to'lovini boshqarish huquqi: tashkilotchi yoki shu davra qabul qiluvchisi. */
export const mayManageRound = (r: Json, g: Json, isOrganizer: boolean): boolean =>
  isOrganizer || r.recipient_member_id === g.my_member_id;

/** a'zo qo'shish tekshiruvi: xato matni yoki null. */
export const validateNewMember = (name: string, phone9: string): string | null => {
  if (!name.trim()) return 'Ism kiriting';
  if (phone9.length !== 9) return 'Telefon raqamini to‘liq kiriting';
  return null;
};
