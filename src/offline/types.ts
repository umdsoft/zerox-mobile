/**
 * Oflayn rejim (Qarz daftari) — umumiy turlar.
 *
 * Bu papkadagi SOF modullar (types, outbox, opSpec, syncEngine, projection, responseCache,
 * actor, uuid) React Native'ga BOG'LIQ EMAS — jest'da node muhitida testlanadi.
 * Native qismlar (MMKV, NetInfo, axios) faqat offlineStore / netStatus / syncManager da.
 */

export type Valyuta = 'UZS' | 'USD';
export type Turi = 'berish' | 'olish';

export type OpKind =
  | 'mijoz.create'
  | 'qarz.create'
  | 'qarz.yopish'
  | 'mijoz.yopish'
  | 'qarz.vozKechish'
  | 'tolov.tolandi';

/**
 * pending  — navbatda, yuborilishi kutilmoqda (yoki backoff)
 * syncing  — hozir yuborilmoqda
 * done     — server qabul qildi (24 soat ko'rsatiladi, so'ng tozalanadi)
 * failed   — server RAD ETDI (4xx) — foydalanuvchi hal qiladi, hech qachon jim tashlanmaydi
 * blocked  — bog'liq amal (masalan oflayn mijoz yaratish) muvaffaqiyatsiz — kutib turibdi
 */
export type OpStatus = 'pending' | 'syncing' | 'done' | 'failed' | 'blocked';

export interface OpError {
  status: number | null;
  code?: string;
  message?: string;
}

export interface MijozCreatePayload {
  faoliyatId: number;
  fish: string;
  telefon: string;
}

export interface QarzCreateBody {
  savdo_faoliyat_id: number;
  mijoz_id: number; // manfiy = oflayn yaratilgan mijoz (temp id)
  turi: Turi;
  valyuta: Valyuta;
  miqdor: number;
  mahsulot_nomi: string;
  berilgan_sana: string; // YYYY-MM-DD — foydalanuvchi tanlagan ASL sana
  bolib_tolash: 0 | 1;
  qaytarish_sanasi: string | null;
  oylar_soni: number | null;
  boshlangich_tolov: number;
}

export interface QarzCreatePayload {
  body: QarzCreateBody;
}

export interface QarzYopishPayload {
  qarzId: number;
  summa: number;
  valyuta: Valyuta;
}

export interface MijozYopishPayload {
  mijozId: number;
  summa: number;
  valyuta: Valyuta;
  turi: Turi;
  faoliyatId?: number | null;
}

export interface VozKechishPayload {
  qarzId: number;
  summa: number;
  valyuta: Valyuta;
  izoh?: string | null;
}

export interface TolovTolandiPayload {
  tolovId: number;
  qarzId: number;
  summa: number | null;
}

/** Ko'rsatish va optimistik proyeksiya uchun kontekst (amal yaratilgan paytdagi ma'lumot). */
export interface OpMeta {
  fish?: string;
  telefon?: string;
  mijozId?: number;
  qarzId?: number;
  faoliyatId?: number;
  faoliyatNomi?: string;
  turi?: Turi;
  valyuta?: Valyuta;
  summa?: number;
}

interface OpBase {
  /** UUID v4 — serverga `Idempotency-Key` sifatida yuboriladi. */
  id: string;
  /** Amalni yaratgan sessiya (JWT id + xodim_id) — faqat shu sessiyada yuboriladi. */
  actor: string;
  createdAt: number;
  /** Yaratish amallari uchun lokal (manfiy) id. */
  tempId?: number;
  /** So'rovda ishlatiladigan temp id'lar (avval ular sinxronlanishi shart). */
  deps: number[];
  status: OpStatus;
  attempts: number;
  nextAttemptAt: number;
  lastError?: OpError;
  serverId?: number;
  doneAt?: number;
  /** 'linked-existing' — telefon band edi, temp mijoz mavjud mijozga bog'landi. */
  note?: string;
  meta: OpMeta;
}

export type OutboxOp =
  | (OpBase & { kind: 'mijoz.create'; payload: MijozCreatePayload })
  | (OpBase & { kind: 'qarz.create'; payload: QarzCreatePayload })
  | (OpBase & { kind: 'qarz.yopish'; payload: QarzYopishPayload })
  | (OpBase & { kind: 'mijoz.yopish'; payload: MijozYopishPayload })
  | (OpBase & { kind: 'qarz.vozKechish'; payload: VozKechishPayload })
  | (OpBase & { kind: 'tolov.tolandi'; payload: TolovTolandiPayload });

/** Navbatga qo'shish uchun kiruvchi ma'lumot (holat maydonlarisiz). */
export type NewOp = OutboxOp extends infer T
  ? T extends OutboxOp
    ? Omit<T, 'id' | 'actor' | 'createdAt' | 'status' | 'attempts' | 'nextAttemptAt' | 'deps'> & {
        deps?: number[];
      }
    : never
  : never;

export interface OpRequest {
  method: 'POST' | 'PUT';
  /** `/qarz-daftari/...` (baseURL'siz). */
  path: string;
  body: Record<string, unknown>;
}

/** Yuborish natijasi: status null — javob kelmadi (tarmoq xatosi / timeout). */
export interface SendResult {
  status: number | null;
  data?: any;
}

/** Simple key-value saqlagich (MMKV yoki testda xotira). */
export interface KV {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys?(): string[];
}

export const ACTIVE_STATUSES: ReadonlySet<OpStatus> = new Set(['pending', 'syncing', 'failed', 'blocked']);
