/**
 * customerLookup — oflaynda "Yangi mijoz" formasida telefon DUBLIKATINI aniqlash (24.10).
 *
 * Onlaynda server 409 phone-exists qaytaradi. Oflaynda esa foydalanuvchi mavjud mijozni bilmay
 * qayta yaratib qo'yardi (sinxronda avtomatik bog'lanadi, lekin oflayn davomida ikki nusxa
 * ko'rinadi va qarz noto'g'ri "yangi" mijozga yoziladi). Endi saqlangan mijozlar ro'yxatlari
 * (berish + olish) va navbatdagi `mijoz.create` amallaridan qidiriladi.
 */
import { cachedOrDerived, currentActor, getOutbox } from './offlineStore';
import { mijozlarUrl } from './prefetchPlan';
import { ACTIVE_STATUSES } from './types';

export interface FoundCustomer {
  id: number;
  fish: string;
  telefon: string;
  qoldiq_uzs: number;
  qoldiq_usd: number;
  savdo_faoliyat_id?: number;
}

/** Telefonning oxirgi 9 raqami (+998 / bo'shliqlarsiz) — solishtirish kaliti. */
export const phoneKey = (phone: unknown): string => String(phone ?? '').replace(/\D/g, '').slice(-9);

/** Sof: ro'yxatlardan telefon bo'yicha birinchi mos mijoz. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findByPhone(lists: any[][], phone9: string): FoundCustomer | null {
  const key = phoneKey(phone9);
  if (key.length !== 9) return null;
  for (const list of lists) {
    for (const c of Array.isArray(list) ? list : []) {
      if (c?.id == null || phoneKey(c?.telefon) !== key) continue;
      return {
        id: Number(c.id),
        fish: String(c?.fish || ''),
        telefon: String(c?.telefon || ''),
        qoldiq_uzs: Number(c?.qoldiq_uzs || 0),
        qoldiq_usd: Number(c?.qoldiq_usd || 0),
        savdo_faoliyat_id: c?.savdo_faoliyat_id != null ? Number(c.savdo_faoliyat_id) : undefined,
      };
    }
  }
  return null;
}

/** Keshdagi (va navbatdagi) mijozlardan telefon bo'yicha qidirish. Hech qachon tashlamaydi. */
export function findCachedCustomerByPhone(base: string, faoliyatId: number | string, phone9: string): FoundCustomer | null {
  try {
    const actor = currentActor()?.key;
    if (!actor || phoneKey(phone9).length !== 9) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lists: any[][] = [];
    for (const turi of ['berish', 'olish'] as const) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hit = cachedOrDerived(actor, mijozlarUrl(base, faoliyatId, turi)) as { data: any } | null;
      if (Array.isArray(hit?.data?.data)) lists.push(hit!.data.data);
    }
    // Oflayn qo'shilgan, hali sinxronlanmagan mijozlar (temp id).
    const queued = getOutbox()
      .list(actor)
      .filter(o => o.kind === 'mijoz.create' && ACTIVE_STATUSES.has(o.status) && o.tempId != null)
      .filter(o => String((o.payload as { faoliyatId?: number }).faoliyatId) === String(faoliyatId))
      .map(o => {
        const p = o.payload as { fish?: string; telefon?: string };
        return { id: o.tempId, fish: p.fish, telefon: p.telefon, savdo_faoliyat_id: Number(faoliyatId) };
      });
    lists.push(queued);
    return findByPhone(lists, phone9);
  } catch {
    return null;
  }
}
