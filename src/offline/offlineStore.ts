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
import { KV, OutboxOp } from './types';
import { uuidv4 } from './uuid';

const OUTBOX_MMKV_ID = 'offline-outbox';
/** 24.10: kesh bor bo'lganda tarmoq yangilanishi uchun qisqa kutish (ms) — useQarzFetch / qarzGet. */
export const CACHED_REFRESH_TIMEOUT_MS = 5000;

let outbox: Outbox | null = null;

export function getOutbox(): Outbox {
  if (!outbox) {
    const kv: KV = openSecureMMKV(OUTBOX_MMKV_ID);
    outbox = new Outbox({ kv, uuid: uuidv4 });
    // 24.10: har yangi `done` amal (sinxron dvigatel, onlayn submit, bog'lash) — undan oldingi kesh
    // yozuvlari eskirgan deb belgilanadi (done amal 24 soatda o'chgach eski qoldiq qaytib chiqmasin).
    const seen = new Set<string>();
    outbox.subscribe(st => {
      st.ops.forEach(op => {
        if (op.status !== 'done' || !op.doneAt || seen.has(op.id)) return;
        seen.add(op.id);
        onOpsSynced(op.actor, op.doneAt);
      });
    });
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
 * 23.10 / 24.10: keshdagi javob; bo'lmasa — saqlangan "qardosh" javoblardan hosil qilingani (`derive.ts`:
 * tarix <- qarzlar ro'yxatlari, yopish-info <- tarix, qarz <- tarix/ro'yxat, kvitansiya <- qarz).
 * `savedAt` — manba(lar)ning eng eskisi, shu sababli proyeksiya undan keyingi amallarni to'g'ri qo'yadi.
 * Avval outbox'dagi `done` amallarning sinxron vaqti qayd qilinadi (eskirgan keshni aniqlash — item 3;
 * sinxron dvigateli `onOpsSynced` ni chaqirmagan holat uchun zaxira).
 */
export function cachedOrDerived(actor: string, url: string): { data: unknown; savedAt: number } | null {
  recordSyncedOps(actor);
  const hit = responseCache.get(actor, url);
  if (hit) return hit;
  // Aylanma import bo'lmasligi uchun kech olinadi (derive -> projection -> responseCache).
  const { deriveCached } = require('./derive');
  return deriveCached(url, {
    get: (u: string) => responseCache.get(actor, u),
    scan: (re: RegExp) => responseCache.scan(actor, re),
    ownerName: currentOwnerName(),
  });
}

/** Outbox'dagi `done` amallar vaqtini keshga qayd qilish (idempotent, arzon). */
function recordSyncedOps(actor: string): void {
  try {
    getOutbox()
      .list(actor)
      .forEach(o => {
        if (o.status === 'done' && o.doneAt) responseCache.markSynced(actor, o.doneAt);
      });
  } catch {
    /* outbox o'qilmasa — sinxron dvigateli chaqiruvi yetarli */
  }
}

/**
 * 24.10 (item 3): amal(lar) serverga yetgach sinxron dvigateli chaqiradi. Vaqt qayd qilinadi; amal outbox'dan
 * tozalanishiga ~1 soat qolganda undan OLDIN saqlangan kesh yozuvlari eskirgan hisoblanadi va o'chiriladi
 * (shu paytgacha `done` amal proyeksiyasi ularni to'g'rilab turadi). Eskirib bo'lganlar darhol tozalanadi.
 */
export function onOpsSynced(actor: string, doneAt: number): void {
  if (!actor) return;
  responseCache.markSynced(actor, doneAt);
  responseCache.invalidateOlderThan(actor, responseCache.staleBefore(actor));
}

/** 24.10: oldindan yuklash (prefetch) uchun — javobni JORIY aktor keshiga yozish. */
export function cacheResponse(url: string, data: unknown): void {
  const actor = currentActor()?.key;
  if (actor) responseCache.set(actor, url, data);
}

/**
 * 24.10: proyeksiya uchun keshdagi qardosh javob (qardosh qarzlar, do'konlar ro'yxati, yopish-info):
 * body + vaqti + SHU javobga qo'yiladigan amallar (`allOps` dan, javob vaqtiga ko'ra). Bitta proyeksiya
 * davomida takror o'qilmasligi uchun natija yodda saqlanadi.
 */
export function cachedLookup(
  actor: string,
  allOps: OutboxOp[],
): (path: string) => { data: unknown; savedAt: number; ops: OutboxOp[] } | null {
  const memo = new Map<string, { data: unknown; savedAt: number; ops: OutboxOp[] } | null>();
  const { opsForProjection } = require('./projection');
  return (path: string) => {
    if (memo.has(path)) return memo.get(path) ?? null;
    const hit = actor ? cachedOrDerived(actor, path) : null;
    const out = hit ? { ...hit, ops: opsForProjection(allOps, hit.savedAt) as OutboxOp[] } : null;
    memo.set(path, out);
    return out;
  };
}
