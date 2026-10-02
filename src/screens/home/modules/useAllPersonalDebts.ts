/**
 * useAllPersonalDebts.ts — shaxsiy qarzlarni SAHIFALAB TO'LIQ yuklash (o'z + ko'zgu/do'kon).
 *
 * 02.10 (mobil hujjat, 2/3/10b-band): sayt `utils/debtSummary.js → fetchAllPersonalDebts`
 * bilan bir xil. Backend bir so'rovda ko'pi bilan 100 ta o'z qarzini qaytaradi — svod
 * ("Jami berilgan / Qaytarilgan / Jarayonda") va yakunlangan qarzlar hisoboti eski qarzlarni
 * yo'qotmasligi uchun sahifalar ketma-ket olinadi (ko'pi bilan MAX_PAGES). Ko'zgu qarzlar
 * sahifalanmaydi — birinchi javobdan olinadi va (tur-id) bo'yicha takrorlanmaydi.
 *
 * Kesh: oxirgi natija xotirada (parametr bo'yicha) — sahifa qayta ochilganda darhol
 * ko'rinadi, fonda yangilanadi (useFetch'dagi stale-while-revalidate naqshi).
 */
import React from 'react';
import { financeApi } from './financeApi';
import { uniqueDebts } from './financeDebtGroups';

const PAGE_LIMIT = 100; // backend maksimumi (VULN-L8)
const MAX_PAGES = 10;

export type AllDebtsParams = { type?: 'lent' | 'borrowed'; status?: 'active' | 'completed' };

const cache = new Map<string, any[]>();
const keyOf = (p: AllDebtsParams) => `${p.type || '*'}|${p.status || '*'}`;

const loadAll = async (params: AllDebtsParams): Promise<any[]> => {
  const own: any[] = [];
  let mirrors: any[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await financeApi.getDebts({ ...params, limit: PAGE_LIMIT, page });
    const body = res?.data;
    if (!body?.success) break;
    const rows: any[] = Array.isArray(body.data) ? body.data : [];
    own.push(...rows);
    if (page === 1) mirrors = Array.isArray(body.mirror_debts) ? body.mirror_debts : [];
    if (rows.length < PAGE_LIMIT) break;
  }
  return uniqueDebts([...own, ...mirrors]);
};

/**
 * @param params null — yuklanmaydi (masalan svod kerak bo'lmagan ro'yxat turi).
 * @returns debts — yuklangan qarzlar; ready — kamida bir marta yuklangan (yoki keshdan);
 *          error — oxirgi urinish xato; reload — majburiy qayta yuklash.
 */
export const useAllPersonalDebts = (params: AllDebtsParams | null) => {
  const type = params?.type;
  const status = params?.status;
  const enabled = !!params;
  const key = enabled ? keyOf({ type, status }) : '';
  const [state, setState] = React.useState(() => {
    const hit = key ? cache.get(key) : undefined;
    return { debts: hit || [], loading: false, ready: !!hit, error: false };
  });
  const reqId = React.useRef(0);

  const reload = React.useCallback(async () => {
    if (!enabled) return;
    const id = ++reqId.current;
    setState(s => ({ ...s, loading: true, error: false }));
    try {
      const list = await loadAll({ type, status });
      if (id !== reqId.current) return; // eskirgan javob — yangisi ustiga yozilmaydi
      cache.set(keyOf({ type, status }), list);
      setState({ debts: list, loading: false, ready: true, error: false });
    } catch (e) {
      if (id !== reqId.current) return;
      // Svod/hisobot ixtiyoriy — sahifa baribir ishlaydi; oldingi ma'lumot saqlanadi.
      setState(s => ({ ...s, loading: false, ready: true, error: true }));
    }
  }, [enabled, type, status]);

  React.useEffect(() => {
    reload();
    return () => {
      reqId.current += 1; // unmount / parametr o'zgarishi — kutilayotgan javob bekor
    };
  }, [reload]);

  return { ...state, reload };
};
