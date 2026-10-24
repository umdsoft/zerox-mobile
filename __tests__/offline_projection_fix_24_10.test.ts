/**
 * 24.10 — oflayn proyeksiya tuzatishlari: qardosh qarzlar bo'ylab taqsimot (backend planAllocation),
 * rad etilgan qarzlar jamidan chiqarilishi, bo'laklar (markInstallmentsPaid / keyingilar), voz kechish
 * tartibi, filtrlangan ro'yxatlar, dashboard "muddati o'tgan", near-expiration, kvitansiya, do'kon doirasi,
 * eskirgan kesh (sinxron belgilari), keshdan hosil qilish (tarix / qarz / kvitansiya).
 */
import { debtFromCache, deriveCached, DeriveSources, historyFromLists } from '../src/offline/derive';
import { Outbox } from '../src/offline/outbox';
import {
  applyRepayment,
  CachedSource,
  computeHistoryStats,
  markInstallmentsPaid,
  OFFLINE_FAILED,
  payInstallments,
  project,
  ProjectionCtx,
} from '../src/offline/projection';
import { normalizeUrl, ResponseCache, SYNC_MARK_TTL_MS } from '../src/offline/responseCache';
import { KV, NewOp, OutboxOp } from '../src/offline/types';

// ---------------------------------------------------------------------------
// Yordamchilar
// ---------------------------------------------------------------------------
const memKV = (): KV & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getString: k => data.get(k),
    set: (k, v) => {
      data.set(k, v);
    },
    delete: k => {
      data.delete(k);
    },
    getAllKeys: () => Array.from(data.keys()),
  };
};

const ACTOR = 'u7:x0';
const NOW = new Date('2026-10-24T10:00:00Z').getTime();
let seq = 0;
const makeOutbox = () =>
  new Outbox({ kv: memKV(), now: () => NOW - 1000, uuid: () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}` });

type Over = Partial<Record<string, unknown>>;
const qarzOp = (ob: Outbox, mijozId: number, over: Over = {}): OutboxOp =>
  ob.enqueue(
    {
      kind: 'qarz.create',
      tempId: ob.nextTempId(),
      deps: mijozId < 0 ? [mijozId] : [],
      payload: {
        body: {
          savdo_faoliyat_id: 5,
          mijoz_id: mijozId,
          turi: 'berish',
          valyuta: 'UZS',
          miqdor: 300,
          mahsulot_nomi: 'Un',
          berilgan_sana: '2026-10-24',
          bolib_tolash: 0,
          qaytarish_sanasi: '2026-11-05',
          oylar_soni: null,
          boshlangich_tolov: 0,
          ...over,
        },
      },
      meta: { fish: 'Ali', faoliyatId: 5, mijozId, turi: 'berish', valyuta: 'UZS' },
    } as NewOp,
    ACTOR,
  );

const yopishOp = (ob: Outbox, qarzId: number, mijozId: number, summa: number, faoliyatId = 5): OutboxOp =>
  ob.enqueue(
    {
      kind: 'qarz.yopish',
      payload: { qarzId, summa, valyuta: 'UZS' },
      meta: { mijozId, qarzId, turi: 'berish', valyuta: 'UZS', summa, faoliyatId },
    } as NewOp,
    ACTOR,
  );

const mijozYopishOp = (ob: Outbox, mijozId: number, summa: number): OutboxOp =>
  ob.enqueue(
    {
      kind: 'mijoz.yopish',
      payload: { mijozId, summa, valyuta: 'UZS', turi: 'berish', faoliyatId: 5 },
      meta: { mijozId, turi: 'berish', valyuta: 'UZS', summa, faoliyatId: 5 },
    } as NewOp,
    ACTOR,
  );

const vozOp = (ob: Outbox, qarzId: number, mijozId: number, summa: number): OutboxOp =>
  ob.enqueue(
    {
      kind: 'qarz.vozKechish',
      payload: { qarzId, summa, valyuta: 'UZS', izoh: null },
      meta: { mijozId, qarzId, turi: 'berish', valyuta: 'UZS', summa, faoliyatId: 5 },
    } as NewOp,
    ACTOR,
  );

/** Keshdagi qardosh javoblar (yo'l -> body), barchasi `savedAt` vaqtida, amallari — ctx amallari. */
const ctxOf = (ob: Outbox, cache: Record<string, unknown> = {}, extra: Partial<ProjectionCtx> = {}): ProjectionCtx => {
  const ops = ob.activeOps(ACTOR);
  return {
    ops,
    resolve: id => ob.resolveId(id),
    now: NOW,
    baseAt: NOW - 500,
    cached: (path: string): CachedSource | null =>
      path in cache ? { data: cache[path], savedAt: NOW - 500, ops } : null,
    ...extra,
  };
};

const debt = (id: number, over: Over = {}) => ({
  id,
  mijoz_id: 20,
  savdo_faoliyat_id: 5,
  turi: 'berish',
  valyuta: 'UZS',
  miqdor: 100,
  qoldiq: 100,
  status: 'aktiv',
  bolib_tolash: 0,
  qaytarish_sanasi: '2026-11-01',
  created_at: `2026-10-0${id}T08:00:00.000Z`,
  ...over,
});

const historyBody = (qarzlar: unknown[]) => ({
  success: true,
  data: { mijoz: { id: 20, fish: 'Bobur', telefon: '+998901112233', savdo_faoliyat_id: 5 }, stats: {}, qarzlar, tranzaksiyalar: [] },
});
const HISTORY = '/api/qarz-daftari/mijozlar/20/history';

// ---------------------------------------------------------------------------
describe('1. qarz tafsiloti — qaytarish mijozning BARCHA qarzlari bo\'ylab', () => {
  const A = debt(1, { qaytarish_sanasi: '2026-11-01' });
  const B = debt(2, { qaytarish_sanasi: '2026-12-01' });
  const cache = { [HISTORY]: historyBody([A, B]) };

  test('qarz.yopish B ga 150: avval muddati yaqin A (100), so\'ng B (50); tranzaksiya faqat anchor (B) da', () => {
    const ob = makeOutbox();
    yopishOp(ob, 2, 20, 150);
    const ctx = ctxOf(ob, cache);
    const b = project('/api/qarz-daftari/qarz/2', { success: true, data: { ...B, tranzaksiyalar: [] } }, ctx);
    expect(b.data).toMatchObject({ qoldiq: 50, status: 'aktiv' });
    expect(b.data.tranzaksiyalar).toHaveLength(1);
    const a = project('/api/qarz-daftari/qarz/1', { success: true, data: { ...A, tranzaksiyalar: [] } }, ctx);
    expect(a.data).toMatchObject({ qoldiq: 0, status: 'yopilgan' });
    expect(a.data.tranzaksiyalar).toHaveLength(0);
  });

  test('mijoz.yopish: shu qarzga ham taqsimlanadi; anchor — eng oxirgi ro\'yxatdan o\'tgan (pickAnchor)', () => {
    const ob = makeOutbox();
    mijozYopishOp(ob, 20, 120);
    const ctx = ctxOf(ob, cache);
    const a = project('/api/qarz-daftari/qarz/1', { success: true, data: { ...A, tranzaksiyalar: [] } }, ctx);
    expect(a.data).toMatchObject({ qoldiq: 0, status: 'yopilgan' });
    expect(a.data.tranzaksiyalar).toHaveLength(0); // anchor — B (created_at yangiroq)
    const b = project('/api/qarz-daftari/qarz/2', { success: true, data: { ...B, tranzaksiyalar: [] } }, ctx);
    expect(b.data).toMatchObject({ qoldiq: 80 });
    expect(b.data.tranzaksiyalar).toHaveLength(1);
  });

  test('tarix keshda yo\'q: mijoz.yopish yopish-info jamisini qoplasa — qarz yopiladi; qisman — o\'zgarmaydi', () => {
    const ob = makeOutbox();
    mijozYopishOp(ob, 20, 200);
    const info = (qoldiq: number) => ({
      '/api/qarz-daftari/mijozlar/20/yopish-info?turi=berish': { data: { qoldiqlar: [{ valyuta: 'UZS', qoldiq, soni: 2 }] } },
    });
    const full = project('/api/qarz-daftari/qarz/1', { success: true, data: { ...A } }, ctxOf(ob, info(200)));
    expect(full.data).toMatchObject({ qoldiq: 0, status: 'yopilgan' });
    const partialBody = { success: true, data: { ...A } };
    expect(project('/api/qarz-daftari/qarz/1', partialBody, ctxOf(ob, info(500))).data.qoldiq).toBe(100);
  });

  test('tarix asosiy javobdan YANGIROQ: tarixdagi qoldiq olinadi, amal ikki marta qo\'llanmaydi', () => {
    const ob = makeOutbox();
    const op = yopishOp(ob, 1, 20, 30);
    ob.update(op.id, { status: 'done', doneAt: NOW - 400 });
    const ops = ob.list(ACTOR);
    const freshHistory = historyBody([{ ...A, qoldiq: 70 }, B]); // serverda 30 allaqachon ayrilgan
    const ctx: ProjectionCtx = {
      ops, // asosiy (qarz) javob amal sinxronidan OLDIN olingan
      resolve: () => undefined,
      now: NOW,
      baseAt: NOW - 600,
      cached: p => (p === HISTORY ? { data: freshHistory, savedAt: NOW - 300, ops: [] } : null),
    };
    const out = project('/api/qarz-daftari/qarz/1', { success: true, data: { ...A, tranzaksiyalar: [] } }, ctx);
    expect(out.data.qoldiq).toBe(70);
  });
});

describe('2. rad etilgan oflayn qarz — ko\'rinadi, lekin jami va taqsimotga kirmaydi', () => {
  test('history: failed qarz offline_failed, stats va qaytarish taqsimotida yo\'q', () => {
    const ob = makeOutbox();
    const bad = qarzOp(ob, 20, { miqdor: 999, qaytarish_sanasi: '2026-10-25' });
    ob.update(bad.id, { status: 'failed', lastError: { status: 402 } });
    yopishOp(ob, 1, 20, 50);
    const out = project(HISTORY, historyBody([debt(1)]), ctxOf(ob));
    const row = out.data.qarzlar.find((q: { id: number }) => q.id === bad.tempId);
    expect(row).toMatchObject({ status: OFFLINE_FAILED, qoldiq: 999, _offline: 'failed' });
    expect(out.data.stats.qoldiq_berilgan.uzs).toBe(50);
    expect(out.data.stats.jami_qarzlar).toBe(1);
    expect(out.data.qarzlar.find((q: { id: number }) => q.id === 1).qoldiq).toBe(50);
  });

  test('qarzlar ro\'yxati: failed qarz aktiv filtrida ham ko\'rinadi (holati offline_failed)', () => {
    const ob = makeOutbox();
    const bad = qarzOp(ob, 20);
    ob.update(bad.id, { status: 'blocked' });
    const out = project('/api/qarz-daftari/qarzlar?status=aktiv', { success: true, data: [] }, ctxOf(ob));
    expect(out.data).toHaveLength(1);
    expect(out.data[0].status).toBe(OFFLINE_FAILED);
    expect(computeHistoryStats(out.data, []).qoldiq_berilgan.uzs).toBe(0);
  });
});

describe('3. eskirgan kesh — sinxron belgilari (ResponseCache)', () => {
  test('done amal tozalanishiga yaqinlashganda undan OLDIN saqlangan yozuv qaytarilmaydi', () => {
    let t = 1_000_000;
    const kv = memKV();
    const c = new ResponseCache(() => kv, () => t);
    c.set(ACTOR, '/api/qarz-daftari/qarzlar', { old: 1 });
    t += 10;
    c.markSynced(ACTOR, t); // amal shu vaqtda serverga yetdi
    t += 10;
    c.set(ACTOR, '/api/qarz-daftari/dashboard', { fresh: 1 });
    expect(c.get(ACTOR, '/api/qarz-daftari/qarzlar')).not.toBeNull(); // done amal hali proyeksiya qiladi
    t += SYNC_MARK_TTL_MS; // amal tozalandi
    expect(c.get(ACTOR, '/api/qarz-daftari/qarzlar')).toBeNull();
    expect(c.get(ACTOR, '/api/qarz-daftari/dashboard')?.data).toEqual({ fresh: 1 });
    expect(c.get('u8:x0', '/api/qarz-daftari/qarzlar')).toBeNull();
  });

  test('invalidateOlderThan faqat shu aktorning eski yozuvlarini o\'chiradi; scan yo\'l bo\'yicha', () => {
    let t = 100;
    const kv = memKV();
    const c = new ResponseCache(() => kv, () => t);
    c.set(ACTOR, '/api/qarz-daftari/qarzlar?status=aktiv', { data: [1] });
    c.set('u8:x0', '/api/qarz-daftari/qarzlar?status=aktiv', { data: [2] });
    t = 200;
    c.set(ACTOR, '/api/qarz-daftari/qarzlar?turi=olish', { data: [3] });
    expect(c.scan(ACTOR, /\/qarz-daftari\/qarzlar/).map(h => h.data)).toHaveLength(2);
    expect(c.invalidateOlderThan(ACTOR, 150)).toBe(1);
    expect(c.get(ACTOR, '/api/qarz-daftari/qarzlar?status=aktiv')).toBeNull();
    expect(c.get('u8:x0', '/api/qarz-daftari/qarzlar?status=aktiv')).not.toBeNull();
    expect(c.scan(ACTOR, /\/qarz-daftari\/qarzlar/).map(h => h.url)).toEqual([normalizeUrl('/api/qarz-daftari/qarzlar?turi=olish')]);
  });

  test('eski formatdagi indeks yozuvi (a/u yo\'q) ham scan qilinadi', () => {
    const kv = memKV();
    const c = new ResponseCache(() => kv, () => 5);
    c.set(ACTOR, '/api/qarz-daftari/qarzlar', { data: [] });
    const idx = JSON.parse(kv.data.get('qdc:v1:index') as string);
    Object.values(idx).forEach((e: unknown) => {
      delete (e as { a?: string }).a;
      delete (e as { u?: string }).u;
    });
    kv.set('qdc:v1:index', JSON.stringify(idx));
    expect(c.scan(ACTOR, /qarzlar/)).toHaveLength(1);
  });
});

describe('4. bo\'lib to\'lash bo\'laklari (backend markInstallmentsPaid / tolovTolandi keyingilar)', () => {
  const tolovlar = [
    { id: 11, tartib_raqami: 1, summa: 100, status: 'kutilmoqda' },
    { id: 12, tartib_raqami: 2, summa: 100, status: 'kutilmoqda' },
    { id: 13, tartib_raqami: 3, summa: 100, status: 'kutilmoqda' },
  ];

  test('markInstallmentsPaid: qisman — bo\'lak summasi kamayadi; closeAll — hammasi to\'langan', () => {
    expect(markInstallmentsPaid(tolovlar, 150, false, 'pending').map(t => [t.status, t.summa])).toEqual([
      ['tolandi', 100],
      ['kutilmoqda', 50],
      ['kutilmoqda', 100],
    ]);
    expect(markInstallmentsPaid(tolovlar, 1, true, 'pending').every(t => t.status === 'tolandi')).toBe(true);
  });

  test('payInstallments: ortiqcha OLDINGI to\'lanmagan bo\'lakka ham o\'tadi (tartib bo\'yicha)', () => {
    const out = payInstallments(tolovlar, 12, 150, 'pending');
    expect(out.map(t => [t.id, t.status, t.summa])).toEqual([
      [11, 'kutilmoqda', 50],
      [12, 'tolandi', 100],
      [13, 'kutilmoqda', 100],
    ]);
    expect(payInstallments([{ ...tolovlar[0], status: 'tolandi' }], 11, 50, 'pending')[0].summa).toBe(100);
  });

  test('qarz.yopish bo\'lib to\'lash qarziga: tafsilotdagi bo\'laklar ham belgilanadi', () => {
    const ob = makeOutbox();
    yopishOp(ob, 3, 20, 300);
    const bolib = debt(3, { bolib_tolash: 1, qoldiq: 300, miqdor: 300, tolovlar });
    const out = project('/api/qarz-daftari/qarz/3', { success: true, data: bolib }, ctxOf(ob, { [HISTORY]: historyBody([bolib]) }));
    expect(out.data.status).toBe('yopilgan');
    expect(out.data.tolovlar.every((t: { status: string }) => t.status === 'tolandi')).toBe(true);
  });
});

describe('5. voz kechish — faqat muddat bo\'yicha; voz_kechilgan qatorga qo\'shiladi', () => {
  test('muddati yaqin bo\'lib to\'lash qarzi oddiydan OLDIN kechiriladi', () => {
    const ob = makeOutbox();
    const op = vozOp(ob, 2, 20, 120);
    const rows = [
      debt(1, { bolib_tolash: 1, qaytarish_sanasi: '2026-10-30' }),
      debt(2, { bolib_tolash: 0, qaytarish_sanasi: '2026-12-01', voz_kechilgan: 5 }),
    ];
    const { rows: out } = applyRepayment(rows, op as never, ctxOf(ob));
    expect(out.map(r => [r.id, r.qoldiq, r.status, r.voz_kechilgan])).toEqual([
      [1, 0, 'voz_kechilgan', 100],
      [2, 80, 'aktiv', 25],
    ]);
  });
});

describe('6. filtrlangan ro\'yxat — taqsimot to\'liq to\'plam bo\'ylab; holat filtri qayta qo\'llanadi', () => {
  test('status=aktiv: yopilgan qator chiqib ketadi; ro\'yxatda yo\'q qardosh ham hisobda', () => {
    const ob = makeOutbox();
    yopishOp(ob, 2, 20, 150);
    const A = debt(1, { qaytarish_sanasi: '2026-11-01' });
    const B = debt(2, { qaytarish_sanasi: '2026-12-01' });
    const listed = { success: true, data: [{ ...B, mijoz: { id: 20, fish: 'Bobur' } }] }; // turi/sahifa filtri: faqat B
    const out = project('/api/qarz-daftari/qarzlar?status=aktiv', listed, ctxOf(ob, { [HISTORY]: historyBody([A, B]) }));
    expect(out.data.map((r: { id: number; qoldiq: number }) => [r.id, r.qoldiq])).toEqual([[2, 50]]);
    const all = project(
      '/api/qarz-daftari/qarzlar?status=aktiv',
      { success: true, data: [A, B] },
      ctxOf(ob, { [HISTORY]: historyBody([A, B]) }),
    );
    expect(all.data.map((r: { id: number }) => r.id)).toEqual([2]); // A yopildi — aktiv ro'yxatdan chiqdi
    const closed = project('/api/qarz-daftari/qarzlar?status=yopilgan', { success: true, data: [] }, ctxOf(ob, { [HISTORY]: historyBody([A, B]) }));
    expect(closed.data.map((r: { id: number; mijoz: { fish: string } }) => [r.id, r.mijoz.fish])).toEqual([[1, 'Bobur']]);
  });
});

describe('7. dashboard "muddati o\'tgan" va near-expiration', () => {
  const dash = () => ({
    success: true,
    data: {
      berilgan_qarz: { daftari: { uzs: 1000, usd: 0 } },
      olingan_qarz: { daftari: { uzs: 0, usd: 0 } },
      muddati_otgan_debitor: { daftari: { uzs: 100, usd: 0 }, uzs: 100, usd: 0 },
      muddati_otgan_kreditor: { daftari: { uzs: 0, usd: 0 }, uzs: 0, usd: 0 },
    },
  });

  test('muddati o\'tgan oddiy qarz qaytarilsa — muddati o\'tgan summa kamayadi; tarixsiz — o\'zgarmaydi', () => {
    const ob = makeOutbox();
    yopishOp(ob, 1, 20, 60);
    const overdue = debt(1, { qaytarish_sanasi: '2026-10-01' });
    const out = project('/api/qarz-daftari/dashboard?faoliyat_id=5', dash(), ctxOf(ob, { [HISTORY]: historyBody([overdue]) }));
    expect(out.data.muddati_otgan_debitor.daftari.uzs).toBe(40);
    expect(out.data.muddati_otgan_debitor.uzs).toBe(40);
    expect(out.data.berilgan_qarz.daftari.uzs).toBe(940);
    const blind = project('/api/qarz-daftari/dashboard?faoliyat_id=5', dash(), ctxOf(ob));
    expect(blind.data.muddati_otgan_debitor.daftari.uzs).toBe(100);
  });

  test('orqa sanali yangi oflayn qarz muddati o\'tganga qo\'shiladi', () => {
    const ob = makeOutbox();
    qarzOp(ob, 20, { qaytarish_sanasi: '2026-10-10', miqdor: 70 });
    const out = project('/api/qarz-daftari/dashboard?faoliyat_id=5', dash(), ctxOf(ob));
    expect(out.data.muddati_otgan_debitor.daftari.uzs).toBe(170);
  });

  test('near-expiration: to\'liq qaytarilgan qator olinadi, yangi oflayn qarz (30 kun ichida) qo\'shiladi', () => {
    const ob = makeOutbox();
    yopishOp(ob, 1, 20, 100);
    const q = qarzOp(ob, 21, { qaytarish_sanasi: '2026-11-03', miqdor: 500 });
    const near = {
      success: true,
      data: {
        debitor: [{ qarz_id: 1, mijoz_id: 20, turi: 'berish', currency: 'UZS', residual_amount: 100, end_date: '2026-11-01', days_left: 8 }],
        kreditor: [],
      },
    };
    const out = project('/api/qarz-daftari/near-expiration?faoliyat_id=5', near, ctxOf(ob, { [HISTORY]: historyBody([debt(1)]) }));
    expect(out.data.debitor).toEqual([
      expect.objectContaining({ qarz_id: q.tempId, residual_amount: 500, end_date: '2026-11-03', days_left: 10, mijoz_fish: 'Ali' }),
    ]);
  });
});

describe('8. mijozlar soni, kvitansiya', () => {
  test('mijozlar: barcha qarzi yopilgan mijozning aktiv_qarz_soni kamayadi', () => {
    const ob = makeOutbox();
    yopishOp(ob, 2, 20, 200);
    const body = { success: true, data: [{ id: 20, fish: 'Bobur', aktiv_qarz_soni: 2, qoldiq_uzs: 200, qoldiq_usd: 0 }] };
    const out = project('/api/qarz-daftari/savdo-faoliyat/5/mijozlar?turi=berish', body, ctxOf(ob, { [HISTORY]: historyBody([debt(1), debt(2)]) }));
    expect(out.data[0]).toMatchObject({ aktiv_qarz_soni: 0, qoldiq_uzs: 0 });
    const blind = project('/api/qarz-daftari/savdo-faoliyat/5/mijozlar?turi=berish', body, ctxOf(ob));
    expect(blind.data[0].aktiv_qarz_soni).toBe(0); // qoldiq 0 — zaxira qoidasi
  });

  test('kvitansiya: mavjud qarzga navbatdagi qaytarish qo\'yiladi', () => {
    const ob = makeOutbox();
    yopishOp(ob, 1, 20, 40);
    const kv = { success: true, data: { turi: 'berish', miqdor: 100, qoldiq: 100, valyuta: 'UZS', qaytarilgan: 0, bolib_tolash: 0, qaytarish_sanasi: '2026-11-01' } };
    const out = project('/api/qarz-daftari/qarz/1/kvitansiya', kv, ctxOf(ob, { [HISTORY]: historyBody([debt(1)]) }));
    expect(out.data).toMatchObject({ qoldiq: 60, qaytarilgan: 40 });
    expect(kv.data.qoldiq).toBe(100);
  });
});

describe('9. "Barcha do\'konlar" — xodim bo\'lgan begona do\'kon amallari hisoblanmaydi', () => {
  test('keshdagi do\'konlar ro\'yxatidagi is_xodim_role do\'kon chiqarib tashlanadi', () => {
    const ob = makeOutbox();
    qarzOp(ob, 20, { savdo_faoliyat_id: 9 });
    qarzOp(ob, 20, { savdo_faoliyat_id: 5, miqdor: 10 });
    const shops = { success: true, data: [{ id: 5, is_xodim_role: false }, { id: 9, is_xodim_role: true }] };
    const body = { success: true, data: { berilgan_qarz: { daftari: { uzs: 0, usd: 0 } }, olingan_qarz: { daftari: { uzs: 0, usd: 0 } } } };
    const out = project('/api/qarz-daftari/dashboard', body, ctxOf(ob, { '/api/qarz-daftari/savdo-faoliyat': shops }));
    expect(out.data.berilgan_qarz.daftari.uzs).toBe(10);
    expect(project('/api/qarz-daftari/dashboard', body, ctxOf(ob)).data.berilgan_qarz.daftari.uzs).toBe(310);
  });
});

describe('A/B/E. keshdan hosil qilish (derive)', () => {
  const lists = [
    {
      url: '/api/qarz-daftari/qarzlar?status=aktiv',
      savedAt: 100,
      data: { success: true, data: [{ ...debt(1), qoldiq: 40, voz_kechilgan: 10, mijoz: { id: 20, fish: 'Bobur', telefon: '+998' } }, { ...debt(7), mijoz_id: 99 }] },
    },
    {
      url: '/api/qarz-daftari/qarzlar',
      savedAt: 200,
      data: { success: true, data: [{ ...debt(1), qoldiq: 30, voz_kechilgan: 10, mijoz: { id: 20, fish: 'Bobur', telefon: '+998' } }] },
    },
  ];
  const src = (extra: { url: string; savedAt: number; data: unknown }[] = []): DeriveSources => {
    const all = [...lists, ...extra];
    return {
      get: u => {
        const h = all.find(x => x.url === normalizeUrl(u));
        return h ? { data: h.data, savedAt: h.savedAt } : null;
      },
      scan: re => all.filter(x => re.test(x.url)),
      ownerName: 'Karimov Anvar',
    };
  };

  test('tarix qarzlar ro\'yxatlaridan: eng yangi qator, eng eski manba vaqti, _derived', () => {
    const h = historyFromLists(20, src());
    expect(h?.savedAt).toBe(100);
    expect(h?.data.data._derived).toBe(true);
    expect(h?.data.data.mijoz).toMatchObject({ id: 20, fish: 'Bobur' });
    expect(h?.data.data.qarzlar.map((q: { id: number; qoldiq: number }) => [q.id, q.qoldiq])).toEqual([[1, 30]]);
    expect(h?.data.data.stats).toMatchObject({ qoldiq_berilgan: { uzs: 30, usd: 0 }, undirilgan_berilgan: { uzs: 60, usd: 0 } });
    expect(historyFromLists(55, src())).toBeNull();
  });

  test('mijoz faqat mijozlar ro\'yxatida (qarz qatorlari yo\'q) — _partial belgisi', () => {
    const h = historyFromLists(
      33,
      src([{ url: '/api/qarz-daftari/savdo-faoliyat/5/mijozlar?turi=berish', savedAt: 50, data: { data: [{ id: 33, fish: 'Vali', aktiv_qarz_soni: 2 }] } }]),
    );
    expect(h?.data.data).toMatchObject({ _derived: true, _partial: true, qarzlar: [] });
  });

  test('yopish-info <- hosil qilingan tarix; qarz tafsiloti tarix tranzaksiyalari bilan; kvitansiya', () => {
    const info = deriveCached('/api/qarz-daftari/mijozlar/20/yopish-info?turi=berish&_=5', src());
    expect(info?.data.data.qoldiqlar).toEqual([{ valyuta: 'UZS', qoldiq: 30, soni: 1 }]);
    const hist = {
      url: '/api/qarz-daftari/mijozlar/20/history',
      savedAt: 300,
      data: {
        data: {
          mijoz: { id: 20, fish: 'Bobur' },
          qarzlar: [{ ...debt(4), tolovlar: [{ id: 1 }] }],
          tranzaksiyalar: [{ id: 'a', qarz_id: 4 }, { id: 'b', qarz_id: 5 }],
        },
      },
    };
    const q = debtFromCache(4, src([hist]));
    expect(q?.data.data).toMatchObject({ id: 4, _derived: true, mijoz: { id: 20, fish: 'Bobur' }, tolovlar: [{ id: 1 }] });
    expect(q?.data.data.tranzaksiyalar).toEqual([{ id: 'a', qarz_id: 4 }]);
    expect(debtFromCache(1, src())?.data.data.qoldiq).toBe(30); // ro'yxat qatoridan
    const kv = deriveCached('/api/qarz-daftari/qarz/4/kvitansiya', src([hist]));
    expect(kv?.data.data).toMatchObject({ qarz_oluvchi: 'Bobur', qarz_beruvchi: 'Karimov Anvar', miqdor: 100, qaytarilgan: 0, _derived: true });
  });

  test('hosil qilingan tarix proyeksiyada qardosh manba sifatida ishlaydi', () => {
    const ob = makeOutbox();
    yopishOp(ob, 1, 20, 30);
    const derived = historyFromLists(20, src());
    const out = project(HISTORY, derived?.data, ctxOf(ob));
    expect(out.data.qarzlar[0]).toMatchObject({ qoldiq: 0, status: 'yopilgan' });
    expect(out.data._derived).toBe(true);
  });
});
