/**
 * Oflayn qatlam singleton'lari (RN tomoni): outbox (alohida shifrlangan MMKV) va o'qish keshi
 * (asosiy shifrlangan `storage` — logout'da o'chadi), joriy aktor.
 *
 * Outbox `offline-outbox` MMKV'da: `forceLogout` dagi `storage.clearAll()` uni O'CHIRMAYDI —
 * sinxronlanmagan amallar jim yo'qolmaydi; o'sha aktor qayta kirganda yuboriladi.
 * `storage` init'dan (index.js `initSecureStorage`) keyin birinchi chaqiruvda yaratiladi.
 */
import { openSecureMMKV, storage } from '../store/api/token/getToken';
import { ActorInfo, actorFromToken } from './actor';
import { Outbox } from './outbox';
import { ResponseCache } from './responseCache';
import { KV } from './types';
import { uuidv4 } from './uuid';

const OUTBOX_MMKV_ID = 'offline-outbox';

let outbox: Outbox | null = null;

export function getOutbox(): Outbox {
  if (!outbox) {
    const kv: KV = openSecureMMKV(OUTBOX_MMKV_ID);
    outbox = new Outbox({ kv, uuid: uuidv4 });
  }
  return outbox;
}

export const responseCache = new ResponseCache(() => (storage ? (storage as unknown as KV) : undefined));

export function currentActor(): ActorInfo | null {
  try {
    return actorFromToken(storage?.getString('token'));
  } catch {
    return null;
  }
}

/** Kvitansiya sintezi uchun do'kon egasi FISH (xodim sessiyasida — bo'sh: ega boshqa odam). */
export function currentOwnerName(): string {
  try {
    const actor = currentActor();
    if (!actor || actor.xodimId) return '';
    // Aylanma import bo'lmasligi uchun kech olinadi.
    const { Store } = require('../store/store/Store');
    const u = Store.getState()?.HomeReducer?.user || {};
    return `${u.last_name || ''} ${u.first_name || ''}`.trim();
  } catch {
    return '';
  }
}

/**
 * 23.10: keshdagi javob; bo'lmasa — saqlangan "qardosh" javobdan hosil qilingani (masalan mijozni
 * oflaynda yopish: yopish-info hech ochilmagan, lekin mijoz tarixi keshda). `savedAt` — manba vaqti,
 * shu sababli proyeksiya undan keyingi amallarni to'g'ri qo'yadi.
 */
export function cachedOrDerived(actor: string, url: string): { data: unknown; savedAt: number } | null {
  const hit = responseCache.get(actor, url);
  if (hit) return hit;
  // Aylanma import bo'lmasligi uchun kech olinadi (projection -> responseCache).
  const { derivableFrom } = require('./projection');
  const rel = derivableFrom(url);
  if (!rel) return null;
  const src = responseCache.get(actor, rel.source);
  const data = src ? rel.derive(src.data) : null;
  return data ? { data, savedAt: src!.savedAt } : null;
}
