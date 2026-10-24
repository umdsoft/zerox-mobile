/**
 * 23.10 — Qarz daftari OFLAYN REJIM: outbox, sinxron dvigatel, proyeksiya, kesh, aktor.
 * Sof modullar (RN'siz) — xotira KV va soxta `send` bilan.
 */
import { actorFromToken } from '../src/offline/actor';
import { Outbox, OutboxFullError, MAX_ACTIVE_OPS, OUTBOX_KEY } from '../src/offline/outbox';
import { backoffMs, buildRequest, classify } from '../src/offline/opSpec';
import {
  applyRepayment,
  computeHistoryStats,
  derivableFrom,
  installmentSchedule,
  opsForProjection,
  project,
  ProjectionCtx,
  rewriteTempUrl,
} from '../src/offline/projection';
import { CACHE_LIMITS, normalizeUrl, ResponseCache } from '../src/offline/responseCache';
import { SyncEngine } from '../src/offline/syncEngine';
import { KV, NewOp, OpRequest, OutboxOp, SendResult } from '../src/offline/types';
import { uuidv4 } from '../src/offline/uuid';

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

const b64url = (o: object) =>
  Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (payload: object) => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.sig`;

const ACTOR = 'u7:x0';
let seq = 0;
const makeOutbox = (kv = memKV(), now = () => 1_000_000) =>
  new Outbox({ kv, now, uuid: () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}` });

const mijozOp = (ob: Outbox, fish = 'Ali Valiyev'): OutboxOp => {
  const tempId = ob.nextTempId();
  return ob.enqueue(
    {
      kind: 'mijoz.create',
      tempId,
      payload: { faoliyatId: 5, fish, telefon: '+998901234567' },
      meta: { fish, faoliyatId: 5, faoliyatNomi: "Bog'ot" },
    } as NewOp,
    ACTOR,
  );
};

const qarzOp = (ob: Outbox, mijozId: number, over: Partial<Record<string, unknown>> = {}): OutboxOp => {
  const tempId = ob.nextTempId();
  return ob.enqueue(
    {
      kind: 'qarz.create',
      tempId,
      deps: mijozId < 0 ? [mijozId] : [],
      payload: {
        body: {
          savdo_faoliyat_id: 5,
          mijoz_id: mijozId,
          turi: 'berish',
          valyuta: 'UZS',
          miqdor: 300000,
          mahsulot_nomi: 'Un',
          berilgan_sana: '2026-10-23',
          bolib_tolash: 0,
          qaytarish_sanasi: '2026-11-23',
          oylar_soni: null,
          boshlangich_tolov: 0,
          ...over,
        },
      },
      meta: { fish: 'Ali Valiyev', faoliyatId: 5, mijozId, turi: 'berish', valyuta: 'UZS', summa: 300000 },
    } as NewOp,
    ACTOR,
  );
};

const repayOp = (ob: Outbox, qarzId: number, mijozId: number, summa: number): OutboxOp =>
  ob.enqueue(
    {
      kind: 'qarz.yopish',
      deps: [qarzId, mijozId].filter(x => x < 0),
      payload: { qarzId, summa, valyuta: 'UZS' },
      meta: { mijozId, qarzId, turi: 'berish', valyuta: 'UZS', summa, faoliyatId: 5 },
    } as NewOp,
    ACTOR,
  );

/** Soxta server: path -> javob(lar); har chaqiruv yoziladi. */
const fakeServer = (handler: (req: OpRequest, key: string, n: number) => SendResult) => {
  const calls: { req: OpRequest; key: string }[] = [];
  const send = async (req: OpRequest, key: string): Promise<SendResult> => {
    calls.push({ req, key });
    return handler(req, key, calls.length);
  };
  return { calls, send };
};

const ctxOf = (ob: Outbox, extra: Partial<ProjectionCtx> = {}): ProjectionCtx => ({
  ops: ob.activeOps(ACTOR),
  resolve: id => ob.resolveId(id),
  now: new Date('2026-10-23T10:00:00Z').getTime(),
  ...extra,
});

// ---------------------------------------------------------------------------
describe('actor / uuid', () => {
  test('oddiy va xodim tokenidan aktor kaliti', () => {
    expect(actorFromToken(jwt({ id: 7 }))).toEqual({ key: 'u7:x0', userId: 7, xodimId: null });
    expect(actorFromToken(jwt({ id: 7, role: 'xodim', xodim_id: 12 }))?.key).toBe('u7:x12');
    expect(actorFromToken('garbage')).toBeNull();
    expect(actorFromToken(undefined)).toBeNull();
    expect(actorFromToken(jwt({ id: 0 }))).toBeNull();
  });
  test('uuid v4 formati va noyobligi', () => {
    const a = uuidv4();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(new Set(Array.from({ length: 200 }, uuidv4)).size).toBe(200);
  });
});

describe('Outbox', () => {
  test('enqueue: temp id manfiy, holat saqlanadi va qayta yuklanadi (syncing -> pending)', () => {
    const kv = memKV();
    const ob = makeOutbox(kv);
    const m = mijozOp(ob);
    expect(m.tempId).toBe(-1);
    expect(m.status).toBe('pending');
    ob.update(m.id, { status: 'syncing' });
    const again = makeOutbox(kv);
    expect(again.get(m.id)?.status).toBe('pending');
    expect(again.nextTempId()).toBe(-2);
    expect(JSON.parse(kv.data.get(OUTBOX_KEY) as string).v).toBe(1);
  });

  test('buzilgan JSON — bo\'sh navbat (ilova yiqilmaydi)', () => {
    const kv = memKV();
    kv.set(OUTBOX_KEY, '{oops');
    expect(makeOutbox(kv).list()).toEqual([]);
  });

  test('dependentsOf tranzitiv; discard bog\'liqlarni ham o\'chiradi', () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    const q = qarzOp(ob, m.tempId as number);
    const r = repayOp(ob, q.tempId as number, m.tempId as number, 1000);
    const other = qarzOp(ob, 99);
    expect(ob.dependentsOf(m.id).sort()).toEqual([q.id, r.id].sort());
    expect(ob.discard(m.id)).toBe(3);
    expect(ob.list().map(o => o.id)).toEqual([other.id]);
  });

  test('editAmount — yangi kalit, summa yangilanadi, holat pending', () => {
    const ob = makeOutbox();
    const r = repayOp(ob, 10, 20, 500);
    ob.update(r.id, { status: 'failed', lastError: { status: 400, code: 'amount-exceeds' } });
    const e = ob.editAmount(r.id, 300);
    expect(e?.id).not.toBe(r.id);
    expect(e?.status).toBe('pending');
    expect((e?.payload as { summa: number }).summa).toBe(300);
    expect(ob.get(r.id)).toBeUndefined();
  });

  test('editAmount faqat rad etilgan amalga; yuborilayotgan amalni bekor qilib bo\'lmaydi', () => {
    const ob = makeOutbox();
    const r = repayOp(ob, 10, 20, 500);
    ob.update(r.id, { sentOnce: true }); // 24.10: jo'natilgan (javobsiz) pending — kalit almashmaydi
    expect(ob.editAmount(r.id, 300)).toBeUndefined();
    ob.update(r.id, { status: 'syncing' });
    expect(ob.discard(r.id)).toBe(0);
    expect(ob.get(r.id)).toBeDefined();
  });

  test('o\'qib bo\'lmagan navbat jim o\'chmaydi — zaxiraga ko\'chiriladi', () => {
    const kv = memKV();
    kv.set(OUTBOX_KEY, '{"v":2,"ops":"?"}');
    makeOutbox(kv, () => 42);
    expect(kv.data.get(`${OUTBOX_KEY}:corrupt:42`)).toBe('{"v":2,"ops":"?"}');
  });

  test('limit: MAX_ACTIVE_OPS dan oshsa OutboxFullError', () => {
    const ob = makeOutbox();
    for (let i = 0; i < MAX_ACTIVE_OPS; i++) repayOp(ob, 10, 20, 1);
    expect(() => repayOp(ob, 10, 20, 1)).toThrow(OutboxFullError);
  });

  test('prune: eski done o\'chadi; faol amallar (BOSHQA aktorniki ham, 24.10) qoladi', () => {
    let t = 1_000_000;
    const ob = makeOutbox(memKV(), () => t);
    const mine = repayOp(ob, 10, 20, 1);
    const done = repayOp(ob, 10, 20, 2);
    ob.update(done.id, { status: 'done', doneAt: t });
    const foreign = ob.enqueue(
      { kind: 'qarz.yopish', payload: { qarzId: 1, summa: 1, valyuta: 'UZS' }, meta: {} } as NewOp,
      'u8:x0',
    );
    t += 31 * 24 * 3600 * 1000;
    ob.prune();
    const ids = ob.list().map(o => o.id);
    expect(ids).toContain(mine.id);
    expect(ids).not.toContain(done.id);
    expect(ids).toContain(foreign.id);
  });
});

describe('opSpec', () => {
  test('so\'rovlar va temp id almashtirish', () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    const q = qarzOp(ob, m.tempId as number);
    const unresolved = buildRequest(q, id => ob.resolveId(id));
    expect(unresolved).toEqual({ ok: false, unresolved: m.tempId });
    ob.mapId(m.tempId as number, 777);
    const built = buildRequest(q, id => ob.resolveId(id));
    expect(built.ok && built.request.path).toBe('/qarz-daftari/qarz');
    expect(built.ok && (built.request.body as { mijoz_id: number }).mijoz_id).toBe(777);
    const mr = buildRequest(m, id => ob.resolveId(id));
    expect(mr.ok && mr.request).toEqual({
      method: 'POST',
      path: '/qarz-daftari/savdo-faoliyat/5/mijozlar',
      body: { fish: 'Ali Valiyev', telefon: '+998901234567' },
    });
  });

  test('classify', () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    expect(classify(m, { status: 200, data: { data: { id: 5 } } })).toEqual({ type: 'success', serverId: 5 });
    expect(classify(m, { status: null }).type).toBe('transient');
    expect(classify(m, { status: 503 }).type).toBe('transient');
    expect(classify(m, { status: 429 }).type).toBe('transient');
    expect(classify(m, { status: 409, data: { code: 'IDEMPOTENCY_IN_PROGRESS' } }).type).toBe('transient');
    const existing = { id: 44, fish: 'Ali Valiyev' }; // 24.10: faqat FISH mos bo'lsa bog'lanadi
    expect(classify(m, { status: 409, data: { code: 'phone-exists', existing_id: 44, existing_mijoz: existing } })).toEqual({
      type: 'link-existing',
      serverId: 44,
    });
    expect(classify(m, { status: 401 }).type).toBe('auth');
    expect(classify(m, { status: 402, data: { code: 'no-sms-package', message: 'x' } })).toEqual({
      type: 'permanent',
      error: { status: 402, code: 'no-sms-package', message: 'x' },
    });
  });

  test('backoff o\'sadi va 5 daqiqada cheklanadi', () => {
    const mid = () => 0.5;
    expect(backoffMs(1, mid)).toBe(2000);
    expect(backoffMs(2, mid)).toBe(4000);
    expect(backoffMs(20, mid)).toBe(300000);
  });
});

describe('SyncEngine', () => {
  test('oflayn mijoz + unga qarz + qaytarish: tartib bilan, temp id server id ga, kalit = op.id', async () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    const q = qarzOp(ob, m.tempId as number);
    const r = repayOp(ob, q.tempId as number, m.tempId as number, 100000);
    const srv = fakeServer(req => {
      if (req.path.endsWith('/mijozlar')) return { status: 200, data: { success: true, data: { id: 501 } } };
      if (req.path === '/qarz-daftari/qarz') return { status: 200, data: { success: true, data: { id: 9001 } } };
      return { status: 200, data: { success: true } };
    });
    const engine = new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR, now: () => 1_000_000 });
    const sum = await engine.run();
    expect(sum).toMatchObject({ synced: 3, failed: 0, stoppedBy: 'idle' });
    expect(srv.calls.map(c => c.req.path)).toEqual([
      '/qarz-daftari/savdo-faoliyat/5/mijozlar',
      '/qarz-daftari/qarz',
      '/qarz-daftari/qarz/9001/yopish',
    ]);
    expect((srv.calls[1].req.body as { mijoz_id: number }).mijoz_id).toBe(501);
    expect(srv.calls.map(c => c.key)).toEqual([m.id, q.id, r.id]);
    expect(ob.resolveId(m.tempId as number)).toBe(501);
    expect(ob.list().every(o => o.status === 'done')).toBe(true);
  });

  test('tarmoq uzilsa: to\'xtaydi, tartib saqlanadi, backoff; qayta urinishda O\'SHA kalit', async () => {
    let t = 1_000_000;
    const ob = makeOutbox(memKV(), () => t);
    const a = repayOp(ob, 10, 20, 1);
    const b = repayOp(ob, 11, 20, 2);
    let online = false;
    const srv = fakeServer(() => (online ? { status: 200, data: { success: true } } : { status: null }));
    const engine = new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR, now: () => t, random: () => 0.5 });
    const s1 = await engine.run();
    expect(s1.stoppedBy).toBe('transient');
    expect(s1.nextAttemptAt).toBe(t + 2000);
    expect(srv.calls).toHaveLength(1); // b yuborilmadi (tartib)
    expect(ob.get(a.id)?.attempts).toBe(1);

    const s2 = await engine.run(); // backoff vaqti kelmagan
    expect(s2.stoppedBy).toBe('transient');
    expect(srv.calls).toHaveLength(1);

    online = true;
    t += 2500;
    const s3 = await engine.run();
    expect(s3.synced).toBe(2);
    expect(srv.calls.map(c => c.key)).toEqual([a.id, a.id, b.id]);
  });

  test('force=true backoff\'ni kutmaydi', async () => {
    const ob = makeOutbox();
    const a = repayOp(ob, 10, 20, 1);
    ob.update(a.id, { nextAttemptAt: Number.MAX_SAFE_INTEGER });
    const srv = fakeServer(() => ({ status: 200, data: {} }));
    const engine = new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR });
    expect((await engine.run()).synced).toBe(0);
    expect((await engine.run(true)).synced).toBe(1);
  });

  test('doimiy xato: failed (jim tashlanmaydi), bog\'liqlar blocked, mustaqil amallar davom etadi', async () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    const q = qarzOp(ob, m.tempId as number);
    const indep = repayOp(ob, 10, 20, 5);
    const srv = fakeServer(req =>
      req.path.endsWith('/mijozlar')
        ? { status: 403, data: { code: 'OFERTA_REQUIRED', message: 'Oferta' } }
        : { status: 200, data: { success: true } },
    );
    const engine = new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR });
    const s = await engine.run();
    expect(s).toMatchObject({ failed: 1, synced: 1 });
    expect(ob.get(m.id)).toMatchObject({ status: 'failed', lastError: { status: 403, code: 'OFERTA_REQUIRED' } });
    expect(ob.get(q.id)?.status).toBe('blocked');
    expect(ob.get(indep.id)?.status).toBe('done');

    // Foydalanuvchi ofertani tasdiqladi -> "Qayta urinish": bog'liq amal ham navbatga qaytadi
    ob.retry(m.id);
    expect(ob.get(q.id)?.status).toBe('pending');
  });

  test('qaytarish qoldiqdan oshdi (boshqa qurilma yopgan) -> failed amount-exceeds', async () => {
    const ob = makeOutbox();
    const r = repayOp(ob, 10, 20, 500000);
    const srv = fakeServer(() => ({ status: 400, data: { code: 'amount-exceeds', message: 'oshib ketdi' } }));
    await new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR }).run();
    expect(ob.get(r.id)?.status).toBe('failed');
    expect(ob.get(r.id)?.lastError?.code).toBe('amount-exceeds');
  });

  test('409 phone-exists: temp mijoz mavjud mijozga bog\'lanadi, keyingi qarz o\'sha id bilan', async () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    qarzOp(ob, m.tempId as number);
    const srv = fakeServer(req =>
      req.path.endsWith('/mijozlar')
        ? { status: 409, data: { code: 'phone-exists', existing_id: 321, existing_mijoz: { id: 321, fish: 'Ali Valiyev' } } }
        : { status: 200, data: { data: { id: 1 } } },
    );
    const s = await new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR }).run();
    expect(s.linked).toBe(1);
    expect(ob.get(m.id)?.note).toBe('linked-existing');
    expect((srv.calls[1].req.body as { mijoz_id: number }).mijoz_id).toBe(321);
  });

  test('401: bir marta refresh, so\'ng o\'sha amal qayta; refresh muvaffaqiyatsiz bo\'lsa to\'xtaydi', async () => {
    const ob = makeOutbox();
    repayOp(ob, 10, 20, 1);
    let authed = false;
    const srv = fakeServer(() => (authed ? { status: 200, data: {} } : { status: 401 }));
    const refreshAuth = jest.fn(async () => {
      authed = true;
      return true;
    });
    const s = await new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR, refreshAuth }).run();
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(s.synced).toBe(1);

    const ob2 = makeOutbox();
    const x = repayOp(ob2, 10, 20, 1);
    const s2 = await new SyncEngine({
      outbox: ob2,
      send: fakeServer(() => ({ status: 401 })).send,
      getActor: () => ACTOR,
      refreshAuth: async () => false,
    }).run();
    expect(s2.stoppedBy).toBe('auth');
    expect(ob2.get(x.id)?.status).toBe('pending');
  });

  test('boshqa aktor (xodim sessiyasi) amallari bu sessiyada yuborilmaydi; aktor yo\'q -> no-actor', async () => {
    const ob = makeOutbox();
    ob.enqueue({ kind: 'qarz.yopish', payload: { qarzId: 1, summa: 1, valyuta: 'UZS' }, meta: {} } as NewOp, 'u7:x12');
    const srv = fakeServer(() => ({ status: 200, data: {} }));
    expect((await new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR }).run()).synced).toBe(0);
    expect((await new SyncEngine({ outbox: ob, send: srv.send, getActor: () => null }).run()).stoppedBy).toBe('no-actor');
    expect(srv.calls).toHaveLength(0);
  });

  test('bog\'liqlikni yaratuvchi boshqa sessiyada — navbat boshini to\'smaydi (blocked)', async () => {
    const ob = makeOutbox();
    const tempId = ob.nextTempId();
    ob.enqueue(
      { kind: 'mijoz.create', tempId, payload: { faoliyatId: 5, fish: 'X', telefon: '' }, meta: {} } as NewOp,
      'u7:x12',
    );
    const q = qarzOp(ob, tempId);
    const after = repayOp(ob, 10, 20, 1);
    const srv = fakeServer(() => ({ status: 200, data: {} }));
    await new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR }).run();
    expect(ob.get(q.id)?.status).toBe('blocked');
    expect(ob.get(after.id)?.status).toBe('done');
  });

  test('yaratish 2xx, lekin javobda id yo\'q -> failed (NO_SERVER_ID), bog\'liqlar blocked — navbat to\'xtab qolmaydi', async () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    const q = qarzOp(ob, m.tempId as number);
    const after = repayOp(ob, 10, 20, 1);
    const srv = fakeServer(() => ({ status: 200, data: { success: true } }));
    await new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR }).run();
    expect(ob.get(m.id)?.lastError?.code).toBe('NO_SERVER_ID');
    expect(ob.get(q.id)?.status).toBe('blocked');
    expect(ob.get(after.id)?.status).toBe('done');
  });

  test('yugurish paytida "Hozir sinxronlash" (force) — tugagach yana bir marta ishlaydi', async () => {
    const ob = makeOutbox();
    const a = repayOp(ob, 10, 20, 1);
    let release: () => void = () => undefined;
    const gate = new Promise<void>(r => {
      release = r;
    });
    const srv = fakeServer(() => ({ status: 200, data: {} }));
    const send = async (req: OpRequest, key: string) => {
      await gate;
      return srv.send(req, key);
    };
    const engine = new SyncEngine({ outbox: ob, send, getActor: () => ACTOR });
    const first = engine.run();
    const b = repayOp(ob, 11, 20, 2);
    ob.update(b.id, { nextAttemptAt: Number.MAX_SAFE_INTEGER });
    const forced = engine.run(true);
    release();
    await first;
    await forced;
    expect(ob.get(a.id)?.status).toBe('done');
    expect(ob.get(b.id)?.status).toBe('done'); // force backoff'ni chetlab o'tdi
  });

  test('parallel run() chaqiruvlari bitta yugurishga birlashadi', async () => {
    const ob = makeOutbox();
    repayOp(ob, 10, 20, 1);
    const srv = fakeServer(() => ({ status: 200, data: {} }));
    const engine = new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR });
    await Promise.all([engine.run(), engine.run(), engine.run()]);
    expect(srv.calls).toHaveLength(1);
  });
});

describe('projection', () => {
  const serverMijozlar = {
    success: true,
    data: [
      { id: 20, fish: 'Bobur', qarz_soni: 1, aktiv_qarz_soni: 1, qoldiq_uzs: '500000.00', qoldiq_usd: '0.00', jami_uzs: '500000.00', jami_usd: 0, undirilgan_uzs: 0, undirilgan_usd: 0 },
    ],
  };

  test('mijozlar: oflayn mijoz tepada, unga qarz qoldiqqa qo\'shiladi; boshqa mijoz qaytarishi ayriladi', () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    qarzOp(ob, m.tempId as number);
    repayOp(ob, 33, 20, 200000);
    const out = project('https://app.zerox.uz/api/qarz-daftari/savdo-faoliyat/5/mijozlar?turi=berish', serverMijozlar, ctxOf(ob));
    expect(out.data[0]).toMatchObject({ id: m.tempId, fish: 'Ali Valiyev', qoldiq_uzs: 300000, qarz_soni: 1, _offline: 'pending' });
    expect(out.data[1]).toMatchObject({ id: 20, qoldiq_uzs: 300000, undirilgan_uzs: 200000, _pendingChange: true });
    expect(serverMijozlar.data[0].qoldiq_uzs).toBe('500000.00'); // kirish o'zgarmadi
  });

  test('boshqa do\'kon / turi filtri hisobga olinadi', () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    qarzOp(ob, m.tempId as number, { turi: 'olish' });
    const out = project('/qarz-daftari/savdo-faoliyat/5/mijozlar?turi=berish', { success: true, data: [] }, ctxOf(ob));
    expect(out.data[0].qarz_soni).toBe(0);
    const other = project('/qarz-daftari/savdo-faoliyat/6/mijozlar', { success: true, data: [] }, ctxOf(ob));
    expect(other.data).toEqual([]);
  });

  test('history: temp mijoz uchun to\'liq sintez (serverga chiqmasdan) + qarz + stats', () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    qarzOp(ob, m.tempId as number, { bolib_tolash: 1, oylar_soni: 3, qaytarish_sanasi: null, boshlangich_tolov: 30000 });
    const out = project(`/qarz-daftari/mijozlar/${m.tempId}/history`, null, ctxOf(ob));
    expect(out.data.mijoz).toMatchObject({ id: m.tempId, fish: 'Ali Valiyev' });
    expect(out.data.qarzlar).toHaveLength(1);
    expect(out.data.qarzlar[0]).toMatchObject({ qoldiq: 270000, bolib_tolash: 1, qaytarish_sanasi: '2027-01-23' });
    expect(out.data.tranzaksiyalar.map((t: { turi: string }) => t.turi)).toEqual(['qaytarish', 'berish']);
    expect(out.data.stats.qoldiq_berilgan.uzs).toBe(270000);
    expect(out.data.stats.undirilgan_berilgan.uzs).toBe(30000);
  });

  test('history: mijoz SINXRONLANGAN (xarita), qarzi hali navbatda — server tarixiga qo\'shiladi', () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    ob.mapId(m.tempId as number, 501);
    ob.update(m.id, { status: 'done' });
    qarzOp(ob, m.tempId as number);
    const server = { success: true, data: { mijoz: { id: 501, fish: 'Ali' }, stats: {}, qarzlar: [], tranzaksiyalar: [] } };
    const out = project('/qarz-daftari/mijozlar/501/history', server, ctxOf(ob));
    expect(out.data.qarzlar).toHaveLength(1);
    expect(out.data.stats.qoldiq_berilgan.uzs).toBe(300000);
  });

  test('applyRepayment: avval oddiy qarzlar, muddati yaqinidan; failed amal summaga ta\'sir qilmaydi', () => {
    const ob = makeOutbox();
    const rows = [
      { id: 1, mijoz_id: 20, turi: 'berish', valyuta: 'UZS', qoldiq: 100, status: 'aktiv', bolib_tolash: 1, qaytarish_sanasi: '2026-10-01' },
      { id: 2, mijoz_id: 20, turi: 'berish', valyuta: 'UZS', qoldiq: 100, status: 'aktiv', bolib_tolash: 0, qaytarish_sanasi: '2026-12-01' },
      { id: 3, mijoz_id: 20, turi: 'berish', valyuta: 'UZS', qoldiq: 100, status: 'aktiv', bolib_tolash: 0, qaytarish_sanasi: '2026-11-01' },
    ];
    const op = repayOp(ob, 2, 20, 150);
    const { rows: out } = applyRepayment(rows, op as never, ctxOf(ob));
    expect(out.map(r => [r.id, r.qoldiq, r.status])).toEqual([
      [1, 100, 'aktiv'],
      [2, 50, 'aktiv'],
      [3, 0, 'yopilgan'],
    ]);
    ob.update(op.id, { status: 'failed' });
    const hist = project(
      '/qarz-daftari/mijozlar/20/history',
      { success: true, data: { mijoz: { id: 20 }, stats: {}, qarzlar: rows, tranzaksiyalar: [] } },
      ctxOf(ob),
    );
    expect(hist.data.qarzlar).toBe(rows); // failed — o'zgarishsiz (o'sha massiv)
  });

  test('qarz tafsiloti: temp qarz sintezi (bo\'lib to\'lash jadvali backend bilan bir xil)', () => {
    const ob = makeOutbox();
    const q = qarzOp(ob, 20, { valyuta: 'USD', miqdor: 655.77, bolib_tolash: 1, oylar_soni: 3, qaytarish_sanasi: null });
    const out = project(`/qarz-daftari/qarz/${q.tempId}`, undefined, ctxOf(ob));
    expect(out.data.mijoz.fish).toBe('Ali Valiyev');
    expect(out.data.tolovlar.map((t: { summa: number }) => t.summa)).toEqual([218.59, 218.59, 218.59]);
    // backend hisobla(1000000, 3, '2026-10-23') bilan aynan: 333333 / 333333 / 333334, sanalar oyma-oy
    expect(installmentSchedule(1000000, 3, '2026-10-23', false).map(t => [t.summa, t.tolov_sanasi])).toEqual([
      [333333, '2026-11-23'],
      [333333, '2026-12-23'],
      [333334, '2027-01-23'],
    ]);
  });

  test('qarz tafsiloti: bo\'lak to\'lovi sharsharasi (ortiqchasi keyingi bo\'lakka)', () => {
    const ob = makeOutbox();
    ob.enqueue(
      { kind: 'tolov.tolandi', payload: { tolovId: 101, qarzId: 7, summa: 150 }, meta: { qarzId: 7, valyuta: 'UZS', summa: 150 } } as NewOp,
      ACTOR,
    );
    const server = {
      success: true,
      data: {
        id: 7, qoldiq: 300, status: 'aktiv', tranzaksiyalar: [],
        tolovlar: [
          { id: 101, tartib_raqami: 1, summa: 100, status: 'kutilmoqda' },
          { id: 102, tartib_raqami: 2, summa: 100, status: 'kutilmoqda' },
          { id: 103, tartib_raqami: 3, summa: 100, status: 'kutilmoqda' },
        ],
      },
    };
    const out = project('/qarz-daftari/qarz/7', server, ctxOf(ob));
    expect(out.data.qoldiq).toBe(150);
    expect(out.data.tolovlar.map((t: { status: string; summa: number }) => [t.status, t.summa])).toEqual([
      ['tolandi', 100],
      ['kutilmoqda', 50],
      ['kutilmoqda', 100],
    ]);
  });

  test('kvitansiya: temp qarz uchun lokal (oflayn chek)', () => {
    const ob = makeOutbox();
    const q = qarzOp(ob, 20);
    const out = project(`/qarz-daftari/qarz/${q.tempId}/kvitansiya`, null, ctxOf(ob, { ownerName: 'Karimov Anvar' }));
    expect(out.data).toMatchObject({ turi: 'berish', qarz_oluvchi: 'Ali Valiyev', qarz_beruvchi: 'Karimov Anvar', miqdor: 300000, qaytarilgan: 0 });
  });

  test('yopish-info: temp mijoz qoldig\'i navbatdagi qarzlardan', () => {
    const ob = makeOutbox();
    const m = mijozOp(ob);
    qarzOp(ob, m.tempId as number);
    const out = project(`/qarz-daftari/mijozlar/${m.tempId}/yopish-info?turi=berish&_=3`, null, ctxOf(ob));
    expect(out.data.qoldiqlar).toEqual([{ valyuta: 'UZS', qoldiq: 300000, soni: 1 }]);
  });

  test('dashboard: daftari summalari do\'kon filtri bilan', () => {
    const ob = makeOutbox();
    qarzOp(ob, 20);
    const body = { success: true, data: { berilgan_qarz: { daftari: { uzs: 1000, usd: 0 } }, olingan_qarz: { daftari: { uzs: 0, usd: 0 } } } };
    expect(project('/qarz-daftari/dashboard?faoliyat_id=5', body, ctxOf(ob)).data.berilgan_qarz.daftari.uzs).toBe(301000);
    expect(project('/qarz-daftari/dashboard?faoliyat_id=6', body, ctxOf(ob))).toBe(body);
  });

  test('opsForProjection: sinxrondan keyin, server qayta yuklanguncha yozuv yo\'qolmaydi (miltillamaydi)', () => {
    const ob = makeOutbox();
    const q = qarzOp(ob, 20);
    ob.update(q.id, { status: 'done', doneAt: 5000 });
    const all = ob.list(ACTOR);
    // Asosiy ma'lumot sinxrondan OLDIN olingan (baseAt 4000) — done amal hali proyeksiya qilinadi.
    const before = project('/qarz-daftari/mijozlar/20/history', {
      success: true,
      data: { mijoz: { id: 20 }, stats: {}, qarzlar: [], tranzaksiyalar: [] },
    }, { ...ctxOf(ob), ops: opsForProjection(all, 4000) });
    expect(before.data.qarzlar).toHaveLength(1);
    // Server javobi sinxrondan KEYIN (baseAt 6000) — unda qarz allaqachon bor, done amal tashlanadi.
    expect(opsForProjection(all, 6000)).toHaveLength(0);
  });

  test('navbat bo\'sh — body o\'zgarishsiz (o\'sha obyekt)', () => {
    const ob = makeOutbox();
    expect(project('/qarz-daftari/qarzlar', serverMijozlar, ctxOf(ob))).toBe(serverMijozlar);
  });

  test('computeHistoryStats voz kechilganni undirilgandan ayiradi', () => {
    const s = computeHistoryStats(
      [{ id: 1, turi: 'berish', valyuta: 'UZS', miqdor: 100, qoldiq: 40, status: 'aktiv' }],
      [{ qarz_id: 1, turi: 'voz_kechish', valyuta: 'UZS', summa: 10 }],
    );
    expect(s.undirilgan_berilgan.uzs).toBe(50);
    expect(s.qoldiq_berilgan.uzs).toBe(40);
  });

  test('rewriteTempUrl', () => {
    const resolve = (id: number) => (id === -3 ? 88 : undefined);
    expect(rewriteTempUrl('https://h/api/qarz-daftari/mijozlar/-3/history', resolve)).toEqual({
      url: 'https://h/api/qarz-daftari/mijozlar/88/history',
      unresolved: false,
    });
    expect(rewriteTempUrl('/qarz-daftari/qarz/-4', resolve).unresolved).toBe(true);
    expect(rewriteTempUrl('/qarz-daftari/qarz/12?x=1', resolve)).toEqual({ url: '/qarz-daftari/qarz/12?x=1', unresolved: false });
  });
});

describe('ResponseCache', () => {
  test('aktor bo\'yicha ajratilgan; host va cache-buster e\'tiborsiz', () => {
    const kv = memKV();
    const c = new ResponseCache(() => kv, () => 1000);
    c.set('u7:x0', 'https://a.uz/api/qarz-daftari/mijozlar/5/yopish-info?turi=berish&_=1', { ok: 1 });
    expect(c.get('u7:x0', 'https://b.uz/api/qarz-daftari/mijozlar/5/yopish-info?_=9&turi=berish')?.data).toEqual({ ok: 1 });
    expect(c.get('u8:x0', 'https://a.uz/api/qarz-daftari/mijozlar/5/yopish-info?turi=berish')).toBeNull();
    expect(normalizeUrl('https://x/api/a?b=2&_=5&a=1')).toBe('/api/a?a=1&b=2');
  });

  test('juda katta javob keshlanmaydi; eskirgan (30 kun) qaytarilmaydi', () => {
    let t = 0;
    const kv = memKV();
    const c = new ResponseCache(() => kv, () => t);
    c.set('a', '/big', 'x'.repeat(CACHE_LIMITS.maxEntryBytes + 1));
    expect(c.get('a', '/big')).toBeNull();
    c.set('a', '/ok', [1, 2]);
    t += CACHE_LIMITS.maxAgeMs + 1;
    expect(c.get('a', '/ok')).toBeNull();
  });

  test('LRU: yozuvlar soni limitdan oshsa eng kam ishlatilgani o\'chadi; clear()', () => {
    let t = 0;
    const kv = memKV();
    const c = new ResponseCache(() => kv, () => ++t);
    for (let i = 0; i < CACHE_LIMITS.maxEntries; i++) c.set('a', `/u/${i}`, i);
    c.get('a', '/u/0'); // 0 — yaqinda ishlatildi
    c.set('a', '/u/new', 'n');
    expect(c.stats().entries).toBe(CACHE_LIMITS.maxEntries);
    expect(c.get('a', '/u/0')?.data).toBe(0);
    expect(c.get('a', '/u/1')).toBeNull();
    c.clear();
    expect(c.stats().entries).toBe(0);
    expect(Array.from(kv.data.keys())).toEqual([]);
  });
});

describe('yopish-info keshsiz (tarixdan hosil qilish)', () => {
  const history = {
    success: true,
    data: {
      mijoz: { id: 42, fish: 'Test Mijoz', telefon: '+998900000000', savdo_faoliyat_id: 7 },
      qarzlar: [
        { id: 1, turi: 'berish', status: 'aktiv', valyuta: 'UZS', qoldiq: 500000 },
        { id: 2, turi: 'berish', status: 'aktiv', valyuta: 'UZS', qoldiq: 309937 },
        { id: 3, turi: 'berish', status: 'yopilgan', valyuta: 'UZS', qoldiq: 0 },
        { id: 4, turi: 'olish', status: 'aktiv', valyuta: 'UZS', qoldiq: 100 },
        { id: 5, turi: 'berish', status: 'aktiv', valyuta: 'USD', qoldiq: 12.5 },
      ],
    },
  };

  test("yopish-info URL tarix URL ga bog'lanadi (nonce e'tiborsiz)", () => {
    const rel = derivableFrom('https://tb.zerox.uz/api/qarz-daftari/mijozlar/42/yopish-info?turi=berish&_=123');
    expect(rel?.source).toBe('/api/qarz-daftari/mijozlar/42/history');
    expect(derivableFrom('https://tb.zerox.uz/api/qarz-daftari/qarz/5')).toBeNull();
  });

  test("backend mijozQoldiqlari kabi: shu tur, aktiv, valyuta bo'yicha jami", () => {
    const body = derivableFrom('/api/qarz-daftari/mijozlar/42/yopish-info?turi=berish')!.derive(history);
    expect(body.data.mijoz).toEqual({ id: 42, fish: 'Test Mijoz', telefon: '+998900000000', savdo_faoliyat_id: 7 });
    expect(body.data.qoldiqlar).toEqual([
      { valyuta: 'UZS', qoldiq: 809937, soni: 2 },
      { valyuta: 'USD', qoldiq: 12.5, soni: 1 },
    ]);
    const olish = derivableFrom('/api/qarz-daftari/mijozlar/42/yopish-info?turi=olish')!.derive(history);
    expect(olish.data.qoldiqlar).toEqual([{ valyuta: 'UZS', qoldiq: 100, soni: 1 }]);
  });

  test("tarixda mijoz yo'q — null (soxta ekran emas)", () => {
    expect(derivableFrom('/api/qarz-daftari/mijozlar/42/yopish-info?turi=berish')!.derive({ data: null })).toBeNull();
  });
});
