/**
 * qarzShop — "Qarz daftari" bo'limi uchun GLOBAL TANLANGAN DO'KON.
 *
 * NEGA KERAK (SS13):
 *   Foydalanuvchining bir nechta do'koni (savdo faoliyati) bo'lishi mumkin.
 *   So'rov: bosh sahifadagi "Barcha do'konlar" cardidan bitta do'kon tanlansa —
 *   ILOVANING QARZ DAFTARI BO'LIMIDAGI BARCHA ma'lumot va funksiyalar FAQAT shu
 *   do'kon bo'yicha ishlashi kerak (dashboard summalari, qarzlar ro'yxati,
 *   qarzga berish/olish, mijozlar ...).
 *
 * TANLOV DOIMIY: MMKV'da saqlanadi — ilova qayta ochilganda ham saqlanib qoladi.
 *
 * 1 TA DO'KON = AVTOMATIK TANLOV: foydalanuvchida bitta do'kon bo'lsa, u
 * avtomatik tanlanadi (so'rov 3-band) — foydalanuvchi hech narsa bosmasligi kerak.
 *
 * ⚠️ XODIM REJIMI (impersonation) bu tanlovdan USTUN: xodim faqat biriktirilgan
 * do'konni ko'radi va backend uni o'zi cheklaydi — shu sabab xodim sessiyasida
 * tanlov E'TIBORGA OLINMAYDI (`effectiveShopId` null qaytaradi).
 */
import React from 'react';
import { storage } from './getToken';
import { isXodimSession } from './xodimSession';

const K_ID = 'qarz_shop_id';
const K_NOMI = 'qarz_shop_nomi';
// SS-F (2026-09-16): tanlangan do'kon BOSHQA egaga tegishli bo'lib, foydalanuvchi
// unda XODIM bo'lsa — shu bayroq yoqiladi. Bosh sahifadagi UMUMIY kartalar
// bunday do'konni hisobga OLMAYDI (talab: "Bosh sahifada faqat foydalanuvchining
// o'z qarzlari va O'ZIGA tegishli do'kon qarzlari qayd etiladi").
const K_XODIM = 'qarz_shop_is_xodim';

export type QarzShop = { id: number; nomi: string; isXodim?: boolean } | null;

// Oddiy kuzatuvchi ro'yxati — ekranlar tanlov o'zgarganda qayta render bo'ladi.
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => { try { fn(); } catch (_) {} });

/** Saqlangan tanlov (xodim rejimi hisobga OLINMAGAN xom qiymat). */
export function getQarzShop(): QarzShop {
  try {
    const id = storage.getString(K_ID);
    if (!id) return null;
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return null;
    return {
      id: n,
      nomi: storage.getString(K_NOMI) || '',
      isXodim: storage.getString(K_XODIM) === '1',
    };
  } catch {
    return null;
  }
}

export function setQarzShop(shop: {
  id: number | string;
  nomi?: string;
  isXodim?: boolean;
}) {
  try {
    storage.set(K_ID, String(shop.id));
    storage.set(K_NOMI, String(shop.nomi || ''));
    storage.set(K_XODIM, shop.isXodim ? '1' : '0');
  } catch (_) {}
  emit();
}

export function clearQarzShop() {
  try {
    storage.delete(K_ID);
    storage.delete(K_NOMI);
    storage.delete(K_XODIM);
  } catch (_) {}
  emit();
}

/** Tanlangan do'kon — foydalanuvchi XODIM bo'lgan begona do'konmi? */
export function isXodimShopSelected(): boolean {
  const s = getQarzShop();
  return !!s?.isXodim;
}

/**
 * So'rovlarga qo'shiladigan do'kon filtri. Xodim rejimida null — backend
 * xodimni o'z do'koniga o'zi cheklaydi (qo'shimcha filtr keraksiz va xato beradi).
 */
export function effectiveShopId(): number | null {
  if (isXodimSession()) return null;
  const s = getQarzShop();
  return s ? s.id : null;
}

/**
 * `?faoliyat_id=5` / `&faoliyat_id=5` / `faoliyat_id=5` bo'lagi.
 * Tanlov yo'q bo'lsa BO'SH satr (URL o'zgarmaydi).
 */
export function shopQuery(prefix: '?' | '&' | '' = '?'): string {
  const id = effectiveShopId();
  return id ? `${prefix}faoliyat_id=${id}` : '';
}

/**
 * SS-F: BOSH SAHIFA uchun filtr. Farqi — XODIM bo'lgan begona do'kon
 * INKOR ETILADI: bosh sahifadagi umumiy "Berilgan/Olingan qarz" va "Qarz
 * daftari" kartalari faqat foydalanuvchining O'Z ma'lumotlarini ko'rsatishi
 * kerak. (Qarz daftari bo'limi esa tanlangan do'kon bo'yicha ishlaydi.)
 */
export function ownShopQuery(prefix: '?' | '&' | '' = '?'): string {
  if (isXodimShopSelected()) return '';
  return shopQuery(prefix);
}

/** Ekranlarda ishlatish uchun — tanlov o'zgarganda avtomatik qayta render. */
export function useQarzShop(): QarzShop {
  const [shop, setShop] = React.useState<QarzShop>(getQarzShop);
  React.useEffect(() => {
    const fn = () => setShop(getQarzShop());
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return shop;
}

/**
 * Do'konlar ro'yxati kelgach tanlovni MUVOFIQLASHTIRISH:
 *   - ro'yxat bo'sh          -> tanlov tozalanadi
 *   - aynan 1 ta do'kon      -> o'sha avtomatik tanlanadi (so'rov 3-band)
 *   - tanlangan do'kon yo'q  -> tanlov tozalanadi (o'chirilgan do'kon)
 * Faqat HAQIQATAN o'zgargandagina yozadi — cheksiz render halqasi bo'lmaydi.
 */
export function syncQarzShopWithList(shops: any[]): void {
  if (isXodimSession()) return;
  const cur = getQarzShop();
  if (!Array.isArray(shops) || shops.length === 0) {
    if (cur) clearQarzShop();
    return;
  }
  if (shops.length === 1) {
    const only = shops[0];
    const xod = !!only.is_xodim_role;
    if (
      !cur ||
      cur.id !== Number(only.id) ||
      cur.nomi !== String(only.nomi || '') ||
      !!cur.isXodim !== xod
    ) {
      setQarzShop({ id: Number(only.id), nomi: only.nomi, isXodim: xod });
    }
    return;
  }
  if (!cur) return;
  const found = shops.find((s: any) => Number(s.id) === cur.id);
  if (!found) {
    clearQarzShop();
  } else if (
    String(found.nomi || '') !== cur.nomi ||
    !!found.is_xodim_role !== !!cur.isXodim
  ) {
    // Do'kon nomi tahrirlangan yoki xodimlik holati aniqlandi — yangilaymiz.
    // (Bayroq ro'yxat kelgach to'g'rilanadi: eski saqlangan tanlovda u yo'q edi.)
    setQarzShop({
      id: cur.id,
      nomi: found.nomi,
      isXodim: !!found.is_xodim_role,
    });
  }
}
