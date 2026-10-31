/**
 * Tarix statistikasi va yopish-info'ni tarixdan hosil qilish (sof, taqsimotga bog'liq emas).
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import { normalizeUrl } from './responseCache';
import { Turi } from './types';
import type { Json } from './projectionBase';
import { EPS, OFFLINE_FAILED, curKey, num, parseQuery, round2 } from './projectionBase';

/** Mijoz tarixi stats — backend mijozlar.controller.history bilan bir xil formula. */
export function computeHistoryStats(allQarzlar: Json[], tranzaksiyalar: Json[], opts: { vozFromRows?: boolean } = {}): Json {
  // 24.10: rad etilgan oflayn qarz serverda yo'q — hisobga kirmaydi.
  const qarzlar = allQarzlar.filter(q => q.status !== OFFLINE_FAILED);
  const z = () => ({ uzs: 0, usd: 0 });
  const s: Json = {
    jami_qarzlar: qarzlar.length,
    aktiv_qarzlar: qarzlar.filter(q => q.status === 'aktiv').length,
    berilgan: z(),
    olingan: z(),
    qoldiq_berilgan: z(),
    qoldiq_olingan: z(),
    voz_kechilgan_berilgan: z(),
    voz_kechilgan_olingan: z(),
    undirilgan_berilgan: z(),
    undirilgan_olingan: z(),
  };
  const turiOf = new Map<string, unknown>();
  qarzlar.forEach(q => turiOf.set(String(q.id), q.turi));
  tranzaksiyalar.forEach(tr => {
    if (tr.turi !== 'voz_kechish' || opts.vozFromRows) return;
    const turi = turiOf.get(String(tr.qarz_id));
    if (!turi) return;
    const key = turi === 'berish' ? 'voz_kechilgan_berilgan' : 'voz_kechilgan_olingan';
    s[key][curKey(tr.valyuta)] += num(tr.summa);
  });
  // Tarix ro'yxatlardan hosil qilinganda (ledger yo'q) — FAQAT qatordagi `voz_kechilgan` (qarzlar ro'yxati
  // maydoni; oflayn voz kechish ham shunga qo'shiladi — tranzaksiya bilan ikki marta sanalmaydi).
  if (opts.vozFromRows) {
    qarzlar.forEach(q => {
      const key = q.turi === 'berish' ? 'voz_kechilgan_berilgan' : 'voz_kechilgan_olingan';
      s[key][curKey(q.valyuta)] += num(q.voz_kechilgan);
    });
  }
  qarzlar.forEach(q => {
    const c = curKey(q.valyuta);
    const miqdor = num(q.miqdor);
    const qoldiq = num(q.qoldiq);
    const kamaygan = Math.max(miqdor - qoldiq, 0);
    if (q.turi === 'berish') {
      s.berilgan[c] += miqdor;
      s.undirilgan_berilgan[c] += kamaygan;
      if (q.status === 'aktiv') s.qoldiq_berilgan[c] += qoldiq;
    } else {
      s.olingan[c] += miqdor;
      s.undirilgan_olingan[c] += kamaygan;
      if (q.status === 'aktiv') s.qoldiq_olingan[c] += qoldiq;
    }
  });
  (['uzs', 'usd'] as const).forEach(c => {
    s.undirilgan_berilgan[c] = Math.max(s.undirilgan_berilgan[c] - s.voz_kechilgan_berilgan[c], 0);
    s.undirilgan_olingan[c] = Math.max(s.undirilgan_olingan[c] - s.voz_kechilgan_olingan[c], 0);
  });
  (Object.keys(s) as string[]).forEach(k => {
    if (s[k] && typeof s[k] === 'object') {
      s[k] = { uzs: round2(s[k].uzs), usd: round2(s[k].usd) };
    }
  });
  return s;
}

/**
 * 23.10: yopish-info keshda yo'q (mijoz oflaynda birinchi marta yopilmoqda) — asos mijozning
 * SAQLANGAN tarixidan (`/mijozlar/:id/history`) hisoblanadi: backend `mijozQoldiqlari` bilan bir xil
 * (shu tur, `aktiv`, valyuta bo'yicha jami qoldiq va soni). Navbatdagi amallar keyin proyeksiya qilinadi.
 */
export function yopishInfoFromHistory(historyBody: Json, turi: Turi): Json {
  const h = historyBody?.data;
  if (!h?.mijoz) return null;
  const map = new Map<string, { valyuta: string; qoldiq: number; soni: number }>();
  (Array.isArray(h.qarzlar) ? h.qarzlar : [])
    .filter((q: Json) => q.turi === turi && q.status === 'aktiv' && !q.deleted_at)
    .forEach((q: Json) => {
      const v = q.valyuta || 'UZS';
      const e = map.get(v) || { valyuta: v, qoldiq: 0, soni: 0 };
      map.set(v, { ...e, qoldiq: round2(e.qoldiq + num(q.qoldiq)), soni: e.soni + 1 });
    });
  const m = h.mijoz;
  return {
    success: true,
    data: {
      mijoz: { id: m.id, fish: m.fish, telefon: m.telefon ?? null, savdo_faoliyat_id: m.savdo_faoliyat_id },
      turi,
      qoldiqlar: Array.from(map.values()).filter(r => r.qoldiq > EPS),
      ...(h._derived ? { _derived: true } : {}),
    },
  };
}

/** Kesh kalitidan hosil qilinadigan "qardosh" URL: yopish-info -> shu mijozning tarixi. */
export function derivableFrom(url: string): { source: string; derive: (body: Json) => Json } | null {
  const m = normalizeUrl(url).match(/^(.*\/qarz-daftari\/mijozlar\/-?\d+)\/yopish-info(?:\?|$)/);
  if (!m) return null;
  const turi = (parseQuery(url).turi as Turi) === 'olish' ? 'olish' : 'berish';
  return { source: `${m[1]}/history`, derive: body => yopishInfoFromHistory(body, turi) };
}

