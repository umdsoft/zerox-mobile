/**
 * Wave E: src/offline/projection.ts modullarga bo'linishidan OLDIN eski modul bilan olingan golden
 * (fixtures/offline_projection_golden.json): project() barcha endpoint turlari x amallar to'plami x kesh bor/yo'q,
 * hamda sof yordamchilar. Qayta yaratish (FAQAT eski modul bilan): PJ_GEN=1 npx jest offline_projection_split_golden
 */
import fs from 'fs';
import path from 'path';
import { Outbox } from '../src/offline/outbox';
import {
  applyRepayment,
  CachedSource,
  computeHistoryStats,
  derivableFrom,
  installmentSchedule,
  markInstallmentsPaid,
  num,
  OFFLINE_FAILED,
  opsForProjection,
  payInstallments,
  project,
  ProjectionCtx,
  qarzRowFromOp,
  rewriteTempUrl,
  tkYmdOf,
  yopishInfoFromHistory,
} from '../src/offline/projection';
import { KV, NewOp, OutboxOp } from '../src/offline/types';

const GOLD = path.join(__dirname, 'fixtures', 'offline_projection_golden.json');
const GEN = !!process.env.PJ_GEN;

const memKV = (): KV => {
  const data = new Map<string, string>();
  return {
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
const makeOutbox = () => {
  seq = 0;
  return new Outbox({ kv: memKV(), now: () => NOW - 1000, uuid: () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}` });
};

type Over = Record<string, unknown>;
const mijozOp = (ob: Outbox, fish = 'Ali Valiyev', faoliyatId = 5): OutboxOp =>
  ob.enqueue(
    {
      kind: 'mijoz.create',
      tempId: ob.nextTempId(),
      payload: { faoliyatId, fish, telefon: '+998901234567' },
      meta: { fish, faoliyatId, faoliyatNomi: "Bog'ot" },
    } as NewOp,
    ACTOR,
  );
const qarzOp = (ob: Outbox, mijozId: number, over: Over = {}): OutboxOp =>
  ob.enqueue(
    {
      kind: 'qarz.create',
      tempId: ob.nextTempId(),
      deps: mijozId < 0 ? [mijozId] : [],
      payload: {
        body: {
          savdo_faoliyat_id: 5, mijoz_id: mijozId, turi: 'berish', valyuta: 'UZS', miqdor: 300, mahsulot_nomi: 'Un',
          berilgan_sana: '2026-10-24', bolib_tolash: 0, qaytarish_sanasi: '2026-11-05', oylar_soni: null, boshlangich_tolov: 0, ...over,
        },
      },
      meta: { fish: 'Ali', faoliyatId: (over.savdo_faoliyat_id as number) ?? 5, mijozId, turi: (over.turi as string) ?? 'berish', valyuta: (over.valyuta as string) ?? 'UZS' },
    } as NewOp,
    ACTOR,
  );
const yopishOp = (ob: Outbox, qarzId: number, mijozId: number, summa: number, valyuta = 'UZS', turi = 'berish'): OutboxOp =>
  ob.enqueue(
    { kind: 'qarz.yopish', deps: [qarzId, mijozId].filter(x => x < 0), payload: { qarzId, summa, valyuta }, meta: { mijozId, qarzId, turi, valyuta, summa, faoliyatId: 5 } } as NewOp,
    ACTOR,
  );
const mijozYopishOp = (ob: Outbox, mijozId: number, summa: number, turi = 'berish'): OutboxOp =>
  ob.enqueue(
    { kind: 'mijoz.yopish', deps: mijozId < 0 ? [mijozId] : [], payload: { mijozId, summa, valyuta: 'UZS', turi, faoliyatId: 5 }, meta: { mijozId, turi, valyuta: 'UZS', summa, faoliyatId: 5 } } as NewOp,
    ACTOR,
  );
const vozOp = (ob: Outbox, qarzId: number, mijozId: number, summa: number): OutboxOp =>
  ob.enqueue(
    { kind: 'qarz.vozKechish', payload: { qarzId, summa, valyuta: 'UZS', izoh: null }, meta: { mijozId, qarzId, turi: 'berish', valyuta: 'UZS', summa, faoliyatId: 5 } } as NewOp,
    ACTOR,
  );
const tolovOp = (ob: Outbox, tolovId: number, qarzId: number, summa: number): OutboxOp =>
  ob.enqueue({ kind: 'tolov.tolandi', payload: { tolovId, qarzId, summa }, meta: { qarzId, valyuta: 'UZS', summa } } as NewOp, ACTOR);

const debt = (id: number, over: Over = {}) => ({
  id, mijoz_id: 20, savdo_faoliyat_id: 5, turi: 'berish', valyuta: 'UZS', miqdor: 100, qoldiq: 100, status: 'aktiv', bolib_tolash: 0,
  qaytarish_sanasi: '2026-11-01', created_at: `2026-10-0${id}T08:00:00.000Z`, ...over,
});
const HISTORY = '/api/qarz-daftari/mijozlar/20/history';
const DEBTS = [
  debt(1, { qaytarish_sanasi: '2026-10-01' }),
  debt(2, { qaytarish_sanasi: '2026-12-01' }),
  debt(3, { bolib_tolash: 1, qaytarish_sanasi: '2026-11-20', miqdor: 300, qoldiq: 300 }),
  debt(4, { valyuta: 'USD', miqdor: 50, qoldiq: 50 }),
  debt(5, { turi: 'olish', miqdor: 70, qoldiq: 70 }),
  debt(6, { status: 'yopilgan', qoldiq: 0 }),
];
const historyBody = (qarzlar: unknown[]) => ({
  success: true,
  data: {
    mijoz: { id: 20, fish: 'Bobur', telefon: '+998901112233', savdo_faoliyat_id: 5 },
    stats: {},
    qarzlar,
    tranzaksiyalar: [{ id: 900, qarz_id: 6, turi: 'qaytarish', valyuta: 'UZS', summa: 100, created_at: '2026-10-02T08:00:00.000Z' }],
  },
});
const SHOPS = { success: true, data: [{ id: 5, is_xodim_role: false }, { id: 9, is_xodim_role: true }] };

type Scenario = [string, (ob: Outbox) => void];
const SCENARIOS: Scenario[] = [
  ['empty', () => {}],
  ['offline-mijoz+qarz', ob => { const m = mijozOp(ob); qarzOp(ob, m.tempId as number); }],
  ['offline-mijoz+bolib', ob => {
    const m = mijozOp(ob);
    qarzOp(ob, m.tempId as number, { bolib_tolash: 1, oylar_soni: 3, qaytarish_sanasi: null, boshlangich_tolov: 30000, miqdor: 300000 });
    mijozYopishOp(ob, m.tempId as number, 1000);
  }],
  ['qarz-existing-mijoz', ob => {
    qarzOp(ob, 20, { miqdor: 70, qaytarish_sanasi: '2026-10-10' });
    qarzOp(ob, 20, { valyuta: 'USD', miqdor: 655.77, bolib_tolash: 1, oylar_soni: 3, qaytarish_sanasi: null });
    qarzOp(ob, 21, { turi: 'olish', qaytarish_sanasi: '2026-11-03', miqdor: 500 });
    qarzOp(ob, 22, { savdo_faoliyat_id: 9 });
  }],
  ['yopish', ob => { yopishOp(ob, 2, 20, 150); yopishOp(ob, 1, 20, 60); }],
  ['yopish-full+voz', ob => { yopishOp(ob, 1, 20, 100); vozOp(ob, 2, 20, 30); mijozYopishOp(ob, 20, 50); }],
  ['yopish-usd-olish', ob => { yopishOp(ob, 4, 20, 20, 'USD'); yopishOp(ob, 5, 20, 30, 'UZS', 'olish'); }],
  ['tolov+bolib', ob => { tolovOp(ob, 101, 7, 150); yopishOp(ob, 3, 20, 120); }],
  ['failed-and-done', ob => {
    const a = yopishOp(ob, 2, 20, 40);
    const b = qarzOp(ob, 20, { miqdor: 9 });
    const c = vozOp(ob, 1, 20, 5);
    ob.update(a.id, { status: 'failed' });
    ob.update(b.id, { status: 'failed' });
    ob.update(c.id, { status: 'done', doneAt: 5000 });
  }],
  ['synced-mijoz', ob => {
    const m = mijozOp(ob);
    ob.mapId(m.tempId as number, 20);
    ob.update(m.id, { status: 'done' });
    qarzOp(ob, m.tempId as number, { miqdor: 33 });
  }],
];

const ctxOf = (ob: Outbox, withCache: boolean, extra: Partial<ProjectionCtx> = {}): ProjectionCtx => {
  const ops = ob.activeOps(ACTOR);
  const cache: Record<string, unknown> = withCache
    ? {
        [HISTORY]: historyBody(DEBTS),
        '/api/qarz-daftari/savdo-faoliyat': SHOPS,
        '/api/qarz-daftari/mijozlar/20/yopish-info?turi=berish': { data: { qoldiqlar: [{ valyuta: 'UZS', qoldiq: 400, soni: 3 }] } },
      }
    : {};
  return {
    ops, resolve: id => ob.resolveId(id), now: NOW, ownerName: 'Karimov Anvar', baseAt: NOW - 500,
    cached: (p: string): CachedSource | null => (p in cache ? { data: cache[p], savedAt: NOW - 500, ops } : null),
    ...extra,
  };
};

const dash = () => ({
  success: true,
  data: {
    berilgan_qarz: { daftari: { uzs: 1000, usd: 5 } }, olingan_qarz: { daftari: { uzs: 20, usd: 0 } },
    muddati_otgan_debitor: { daftari: { uzs: 100, usd: 0 }, uzs: 100, usd: 0 },
    muddati_otgan_kreditor: { daftari: { uzs: 0, usd: 0 }, uzs: 0, usd: 0 },
  },
});
const near = () => ({
  success: true,
  data: {
    debitor: [
      { qarz_id: 1, mijoz_id: 20, turi: 'berish', currency: 'UZS', residual_amount: 100, end_date: '2026-11-01', days_left: 8 },
      { qarz_id: 2, mijoz_id: 20, turi: 'berish', currency: 'UZS', residual_amount: 100, end_date: '2026-11-10', days_left: 17 },
    ],
    kreditor: [{ qarz_id: 5, mijoz_id: 20, turi: 'olish', currency: 'UZS', residual_amount: 70, end_date: '2026-11-04', days_left: 11 }],
  },
});
const mijozlarBody = () => ({
  success: true,
  data: [
    { id: 20, fish: 'Bobur', qarz_soni: 3, aktiv_qarz_soni: 2, qoldiq_uzs: '500000.00', qoldiq_usd: '50.00', jami_uzs: '600000.00', jami_usd: 50, undirilgan_uzs: 0, undirilgan_usd: 0 },
    { id: 21, fish: 'Vali', qarz_soni: 1, aktiv_qarz_soni: 1, qoldiq_uzs: 200, qoldiq_usd: 0, jami_uzs: 200, jami_usd: 0, undirilgan_uzs: 0, undirilgan_usd: 0 },
  ],
});
const TOLOVLAR = [
  { id: 101, tartib_raqami: 1, summa: 100, status: 'kutilmoqda' },
  { id: 102, tartib_raqami: 2, summa: 100, status: 'kutilmoqda' },
  { id: 103, tartib_raqami: 3, summa: 100, status: 'kutilmoqda' },
];
const qarzDetail = (id: number) => ({ success: true, data: { ...DEBTS[id - 1], tranzaksiyalar: [], tolovlar: TOLOVLAR } });
const kvitansiya = () => ({
  success: true,
  data: { turi: 'berish', miqdor: 100, qoldiq: 100, valyuta: 'UZS', qaytarilgan: 0, bolib_tolash: 0, qaytarish_sanasi: '2026-11-01' },
});

const urlCases = (ob: Outbox): [string, string, unknown][] => {
  const tempMijoz = ob.list(ACTOR).find(o => o.kind === 'mijoz.create')?.tempId;
  const tempQarz = ob.list(ACTOR).find(o => o.kind === 'qarz.create')?.tempId;
  const out: [string, string, unknown][] = [
    ['mijozlar', '/api/qarz-daftari/savdo-faoliyat/5/mijozlar?turi=berish', mijozlarBody()],
    ['mijozlar-olish', '/api/qarz-daftari/savdo-faoliyat/5/mijozlar?turi=olish', mijozlarBody()],
    ['mijozlar-shop6', '/api/qarz-daftari/savdo-faoliyat/6/mijozlar', mijozlarBody()],
    ['history20', HISTORY, historyBody(DEBTS)],
    ['history20-empty', HISTORY, historyBody([])],
    ['history20-null', HISTORY, null],
    ['detail1', '/api/qarz-daftari/qarz/1', qarzDetail(1)],
    ['detail2', '/api/qarz-daftari/qarz/2', qarzDetail(2)],
    ['detail3', '/api/qarz-daftari/qarz/3', qarzDetail(3)],
    ['detail4', '/api/qarz-daftari/qarz/4', qarzDetail(4)],
    ['detail7', '/api/qarz-daftari/qarz/7', qarzDetail(3)],
    ['kvitansiya1', '/api/qarz-daftari/qarz/1/kvitansiya', kvitansiya()],
    ['yopish-info20', '/api/qarz-daftari/mijozlar/20/yopish-info?turi=berish&_=3', { data: { qoldiqlar: [{ valyuta: 'UZS', qoldiq: 400, soni: 3 }] } }],
    ['yopish-info20-null', '/api/qarz-daftari/mijozlar/20/yopish-info?turi=olish', null],
    ['qarzlar-aktiv', '/api/qarz-daftari/qarzlar?status=aktiv', { success: true, data: DEBTS.map(d => ({ ...d, mijoz: { id: 20, fish: 'Bobur' } })) }],
    ['qarzlar-yopilgan', '/api/qarz-daftari/qarzlar?status=yopilgan', { success: true, data: [] }],
    ['qarzlar-all', '/api/qarz-daftari/qarzlar', { success: true, data: [DEBTS[1]] }],
    ['dashboard5', '/api/qarz-daftari/dashboard?faoliyat_id=5', dash()],
    ['dashboard6', '/api/qarz-daftari/dashboard?faoliyat_id=6', dash()],
    ['dashboard-all', '/api/qarz-daftari/dashboard', dash()],
    ['near5', '/api/qarz-daftari/near-expiration?faoliyat_id=5', near()],
    ['near-all', '/api/qarz-daftari/near-expiration', near()],
    ['other', '/api/other/thing', { a: 1 }],
  ];
  if (tempMijoz) {
    out.push(['history-temp', `/api/qarz-daftari/mijozlar/${tempMijoz}/history`, null]);
    out.push(['yopish-info-temp', `/api/qarz-daftari/mijozlar/${tempMijoz}/yopish-info?turi=berish&_=3`, null]);
  }
  if (tempQarz) {
    out.push(['detail-temp', `/api/qarz-daftari/qarz/${tempQarz}`, undefined]);
    out.push(['kvitansiya-temp', `/api/qarz-daftari/qarz/${tempQarz}/kvitansiya`, null]);
  }
  return out;
};

describe("projection — bo'linishdan oldingi eski modul bilan bir xil natija (golden)", () => {
  const golden: Record<string, any> = !GEN && fs.existsSync(GOLD) ? JSON.parse(fs.readFileSync(GOLD, 'utf8')) : {};
  const rec: Record<string, unknown> = {};
  afterAll(() => {
    if (GEN) fs.writeFileSync(GOLD, JSON.stringify(rec));
  });

  it("project(): barcha endpoint x amallar to'plami x kesh", () => {
    const results: Record<string, unknown> = {};
    for (const [sname, build] of SCENARIOS) {
      for (const withCache of [false, true]) {
        const ob = makeOutbox();
        build(ob);
        const ctx = ctxOf(ob, withCache);
        for (const [uname, url, body] of urlCases(ob)) {
          const input = JSON.stringify(body);
          let out: unknown;
          try {
            out = project(url, body, ctx);
          } catch (e) {
            out = `THROW:${(e as Error).message}`;
          }
          expect(JSON.stringify(body)).toBe(input); // kirish o'zgarmaydi
          results[`${sname}|${withCache ? 'cache' : 'nocache'}|${uname}`] = { out: out === undefined ? '__undef__' : out, same: out === body };
        }
      }
    }
    const norm = JSON.parse(JSON.stringify(results));
    if (GEN) Object.assign(rec, { project: norm });
    else expect(norm).toEqual(golden.project);
  });

  it('sof yordamchilar', () => {
    const ob = makeOutbox();
    const q = qarzOp(ob, 20, { bolib_tolash: 1, oylar_soni: 4, qaytarish_sanasi: null, boshlangich_tolov: 10, miqdor: 1000 });
    const y = yopishOp(ob, 3, 20, 150);
    const all = ob.list(ACTOR);
    const rows = DEBTS.map(d => ({ ...d }));
    const ctx = ctxOf(ob, true);
    const h = historyBody(DEBTS).data;
    const res: Record<string, unknown> = {
      sched: [installmentSchedule(1000000, 3, '2026-10-23', false), installmentSchedule(655.77, 3, '2026-01-31', true), installmentSchedule(0, 2, '2026-10-23', false), installmentSchedule(100, 0, '2026-10-23', false)],
      paid: [markInstallmentsPaid(TOLOVLAR, 150, false, 'pending'), markInstallmentsPaid(TOLOVLAR, 0, true, 'pending'), markInstallmentsPaid(TOLOVLAR, 1e13, false, 'done'), markInstallmentsPaid(TOLOVLAR, 250, false, 'failed')],
      pay: [payInstallments(TOLOVLAR, 101, 150, 'pending'), payInstallments(TOLOVLAR, 102, 40, 'syncing'), payInstallments(TOLOVLAR, 9, 40, 'pending'), payInstallments(TOLOVLAR, 103, 500, 'failed')],
      row: qarzRowFromOp(q as never),
      rep: applyRepayment(rows, y as never, ctx),
      rep2: applyRepayment([], y as never, ctx),
      stats: [
        computeHistoryStats(DEBTS, h.tranzaksiyalar),
        computeHistoryStats(DEBTS, [{ qarz_id: 1, turi: 'voz_kechish', valyuta: 'UZS', summa: 10 }, { qarz_id: 4, turi: 'voz_kechish', valyuta: 'USD', summa: 5 }], { vozFromRows: true }),
        computeHistoryStats([], []),
      ],
      yopInfo: [yopishInfoFromHistory({ data: h } as never, 'berish'), yopishInfoFromHistory({ data: h } as never, 'olish'), yopishInfoFromHistory(h as never, 'berish')],
      derivable: ['/api/qarz-daftari/mijozlar/20/yopish-info?turi=berish', '/api/qarz-daftari/qarz/3', '/api/qarz-daftari/dashboard'].map(u => {
        const d = derivableFrom(u);
        return d ? { source: d.source, derived: d.derive({ data: h } as never) } : null;
      }),
      opsFor: [opsForProjection(all, 0), opsForProjection(all, NOW), opsForProjection(all, 1)],
      rewrite: ['https://h/api/qarz-daftari/mijozlar/-3/history', '/qarz-daftari/qarz/-4', '/qarz-daftari/qarz/12?x=1', '/qarz-daftari/mijozlar/-5/yopish-info?turi=berish'].map(u =>
        rewriteTempUrl(u, id => (id === -3 || id === -5 ? 88 : undefined)),
      ),
      tk: [tkYmdOf('2026-10-24T20:00:00Z'), tkYmdOf('2026-10-24'), tkYmdOf(null), tkYmdOf(NOW), tkYmdOf('x')],
      num: [num('12.5'), num('x'), num(null), num(Infinity)],
      failed: OFFLINE_FAILED,
    };
    const norm = JSON.parse(JSON.stringify(res));
    if (GEN) Object.assign(rec, { pure: norm });
    else expect(norm).toEqual(golden.pure);
  });
});
