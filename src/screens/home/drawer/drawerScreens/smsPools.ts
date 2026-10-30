/**
 * smsPools.ts — "SMS xabarlar tarixi" uchun sof yordamchilar (30.10).
 *
 * Backend (yangi): GET /finance/subscription -> sms.pools = { plan, package };
 * GET /finance/subscription/sms-stats -> pools_used, by_type_pool.
 * Eski backend (maydonlar yo'q) — hasSplit=false: faqat umumiy sonlar, pastki qatorlarsiz.
 */

export interface PoolPart {
  total: number;
  used: number;
  remaining: number;
}

export interface SmsPools {
  hasSplit: boolean;
  plan: PoolPart;
  package: PoolPart;
}

export interface PoolPair {
  plan: number;
  package: number;
}

const num = (v: unknown): number => Number(v) || 0;

const toPart = (raw: any): PoolPart => ({
  total: num(raw?.total),
  used: num(raw?.used),
  remaining: num(raw?.remaining),
});

export const toPools = (sms: any): SmsPools => {
  const p = sms?.pools;
  const hasSplit = !!p && typeof p === 'object' && !!(p.plan || p.package);
  return { hasSplit, plan: toPart(p?.plan), package: toPart(p?.package) };
};

/** `{ plan, package }` juftligi yoki null (maydon yo'q / noto'g'ri). */
export const toPair = (raw: any): PoolPair | null =>
  raw && typeof raw === 'object' && ('plan' in raw || 'package' in raw)
    ? { plan: num(raw.plan), package: num(raw.package) }
    : null;

/** Tarif doim, Paket — faqat 0 dan katta bo'lsa. */
export const poolLine = (
  pair: PoolPair | null,
  labels: { plan: string; package: string },
): string | undefined => {
  if (!pair) return undefined;
  const parts = [`${labels.plan} ${pair.plan}`];
  if (pair.package > 0) parts.push(`${labels.package} ${pair.package}`);
  return parts.join(' · ');
};

// Backend `sms_history.type` -> mobil kategoriya kaliti.
export const mapType = (t: unknown): string => {
  const s = String(t ?? '').toLowerCase();
  if (s === 'other') return 'other'; // 30.10: backend qoldiq (kategoriyaga kirmagan SMS'lar)
  if (s === 'registration' || s.includes('register') || s === '1') return 'register';
  if (s === 'auto' || s.includes('due') || s.includes('muddat') || s === '2') return 'due';
  if (s === 'manual' || s === 'payment_link' || s.includes('demand') || s.includes('talab') || s === '3')
    return 'demand';
  if (s === 'qarz_tolandi' || s.includes('paid') || s.includes('tolan') || s === '4') return 'paid';
  return 'register';
};

const KNOWN_TYPES = ['registration', 'auto', 'manual', 'payment_link', 'qarz_tolandi'];

/** Server turi -> kategoriya; noma'lum turlar 'other' ("Boshqa") ga tushadi. */
export const statsCategory = (type: unknown): string => {
  const s = String(type ?? '').toLowerCase();
  return KNOWN_TYPES.includes(s) ? mapType(s) : 'other';
};

/** stats.by_type ({[type]:n}) -> kategoriya bo'yicha sonlar (null = maydon yo'q). */
export const categoryCounts = (byType: any): Record<string, number> | null => {
  if (!byType || typeof byType !== 'object') return null;
  const c: Record<string, number> = { register: 0, due: 0, demand: 0, paid: 0, other: 0 };
  Object.keys(byType).forEach(type => {
    const k = statsCategory(type);
    c[k] = (c[k] || 0) + (Number(byType[type]) || 0);
  });
  return c;
};

/** by_type_pool ({[type]:{plan,package}}) -> kategoriya bo'yicha yig'indi. */
export const categoryPools = (byTypePool: any): Record<string, PoolPair> | null => {
  if (!byTypePool || typeof byTypePool !== 'object') return null;
  const out: Record<string, PoolPair> = {};
  Object.keys(byTypePool).forEach(type => {
    const pair = toPair(byTypePool[type]);
    if (!pair) return;
    const k = statsCategory(type);
    const prev = out[k] || { plan: 0, package: 0 };
    out[k] = { plan: prev.plan + pair.plan, package: prev.package + pair.package };
  });
  return out;
};
