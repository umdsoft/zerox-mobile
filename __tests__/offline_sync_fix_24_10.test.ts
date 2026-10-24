/**
 * 24.10 — oflayn navbat/sinxron tuzatishlari (reviewer topgan pul xatolari):
 *  1) onlayn 4xx -> 'syncing' amal HAQIQATAN o'chadi (arvoh amal qayta yuborilmaydi);
 *  2) aktor har yuborishdan oldin tekshiriladi; 3) 409 IDEMPOTENCY_RESPONSE_UNAVAILABLE / KEY_REUSED;
 *  4) 5xx chegarasi + Retry-After; 5) disk xatosi; 6) bir mijozning keyingi amallari bloklanadi;
 *  7) faol amal vaqt bo'yicha o'chmaydi; 8) phone-exists faqat FISH mos bo'lsa bog'lanadi;
 *  A) navbatdagi amalni tahrirlash/bekor qilish qoidalari; logout'da done amallar tozalanadi.
 */
import { Outbox, OutboxPersistError, OUTBOX_KEY, canDiscard, canEditAmount } from '../src/offline/outbox';
import { classify, isTerminalFailure, MAX_SERVER_ERRORS, normFish, parseRetryAfter } from '../src/offline/opSpec';
import { SyncEngine } from '../src/offline/syncEngine';
import { KV, NewOp, OpRequest, OutboxOp, SendResult } from '../src/offline/types';

// submit.ts RN modullarini (MMKV, NetInfo, axios) import qiladi — ularni soxtalaymiz.
const mockState: { outbox: Outbox | null; actor: string | null; send: jest.Mock } = {
  outbox: null,
  actor: 'u7:x0',
  send: jest.fn(),
};
jest.mock('../src/offline/offlineStore', () => ({
  getOutbox: () => mockState.outbox,
  currentActor: () => (mockState.actor ? { key: mockState.actor, userId: 7, xodimId: null } : null),
}));
jest.mock('../src/offline/netStatus', () => ({ isOnline: () => true }));
jest.mock('../src/offline/syncManager', () => ({
  requestSync: jest.fn(),
  startOfflineSync: jest.fn(),
  sendOpRequest: (...args: unknown[]) => mockState.send(...args),
}));
jest.mock('../src/store/api/authInterceptor', () => ({ refreshAccessToken: jest.fn(async () => null) }));

import { submitQarzOp } from '../src/offline/submit';

// ---------------------------------------------------------------------------
// Yordamchilar
// ---------------------------------------------------------------------------
const memKV = (): KV & { data: Map<string, string>; fail: boolean } => {
  const data = new Map<string, string>();
  const kv = {
    data,
    fail: false,
    getString: (k: string) => data.get(k),
    set: (k: string, v: string) => {
      if (kv.fail) throw new Error('disk full');
      data.set(k, v);
    },
    delete: (k: string) => {
      data.delete(k);
    },
  };
  return kv;
};

const ACTOR = 'u7:x0';
let seq = 0;
const makeOutbox = (kv: KV = memKV(), now = () => 1_000_000) =>
  new Outbox({ kv, now, uuid: () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}` });

const mijozInput = (ob: Outbox, fish = 'Ali Valiyev'): NewOp =>
  ({
    kind: 'mijoz.create',
    tempId: ob.nextTempId(),
    payload: { faoliyatId: 5, fish, telefon: '+998901234567' },
    meta: { fish, faoliyatId: 5 },
  }) as NewOp;

const qarzInput = (ob: Outbox, mijozId: number): NewOp =>
  ({
    kind: 'qarz.create',
    tempId: ob.nextTempId(),
    deps: mijozId < 0 ? [mijozId] : [],
    payload: {
      body: {
        savdo_faoliyat_id: 5,
        mijoz_id: mijozId,
        turi: 'berish',
        valyuta: 'UZS',
        miqdor: 300000,
        mahsulot_nomi: 'Un',
        berilgan_sana: '2026-10-24',
        bolib_tolash: 0,
        qaytarish_sanasi: null,
        oylar_soni: null,
        boshlangich_tolov: 0,
      },
    },
    meta: { mijozId, faoliyatId: 5, turi: 'berish', valyuta: 'UZS', summa: 300000 },
  }) as NewOp;

const repayInput = (qarzId: number, mijozId: number, summa: number): NewOp =>
  ({
    kind: 'qarz.yopish',
    deps: [qarzId, mijozId].filter(x => x < 0),
    payload: { qarzId, summa, valyuta: 'UZS' },
    meta: { mijozId, qarzId, turi: 'berish', valyuta: 'UZS', summa },
  }) as NewOp;

const closeInput = (mijozId: number, summa: number): NewOp =>
  ({
    kind: 'mijoz.yopish',
    deps: mijozId < 0 ? [mijozId] : [],
    payload: { mijozId, summa, valyuta: 'UZS', turi: 'berish' },
    meta: { mijozId, turi: 'berish', valyuta: 'UZS', summa },
  }) as NewOp;

const add = (ob: Outbox, input: NewOp, actor = ACTOR): OutboxOp => ob.enqueue(input, actor);

const fakeServer = (handler: (req: OpRequest, key: string, n: number) => SendResult) => {
  const calls: { req: OpRequest; key: string; actor?: string }[] = [];
  const send = async (req: OpRequest, key: string, actor?: string): Promise<SendResult> => {
    calls.push({ req, key, actor });
    return handler(req, key, calls.length);
  };
  return { calls, send };
};

const engineOf = (ob: Outbox, send: (r: OpRequest, k: string, a: string) => Promise<SendResult>, extra = {}) =>
  new SyncEngine({ outbox: ob, send, getActor: () => ACTOR, now: () => 1_000_000, random: () => 0.5, ...extra });

beforeEach(() => {
  mockState.actor = ACTOR;
  mockState.send = jest.fn();
});

// ---------------------------------------------------------------------------
describe('1) onlayn submit: server 4xx rad etsa amal haqiqatan o‘chadi', () => {
  test('402 -> xato tashlanadi; qayta yuklangan navbatda arvoh amal yo‘q, yuboriladigan hech narsa yo‘q', async () => {
    const kv = memKV();
    mockState.outbox = makeOutbox(kv);
    mockState.send.mockResolvedValue({ status: 402, data: { code: 'no-sms-package', message: 'paket yo‘q' } });

    await expect(submitQarzOp(repayInput(10, 20, 5000))).rejects.toMatchObject({ response: { status: 402 } });
    expect(mockState.outbox.list()).toEqual([]);

    const reloaded = makeOutbox(kv); // ilova qayta ochildi ('syncing' -> 'pending' bo'lardi)
    expect(reloaded.list()).toEqual([]);
    const srv = fakeServer(() => ({ status: 200, data: {} }));
    await engineOf(reloaded, srv.send).run();
    expect(srv.calls).toHaveLength(0);
  });

  test('2xx -> synced, amal done; so‘rov amal aktori bilan yuboriladi', async () => {
    mockState.outbox = makeOutbox();
    mockState.send.mockResolvedValue({ status: 200, data: { success: true } });
    const out = await submitQarzOp(repayInput(10, 20, 5000));
    expect(out.status).toBe('synced');
    expect(mockState.send.mock.calls[0][2]).toBe(ACTOR);
  });

  test('token boshqa aktorniki (actorMismatch) -> yuborilmagan, navbatda (tahrirlash mumkin)', async () => {
    mockState.outbox = makeOutbox();
    mockState.send.mockResolvedValue({ status: null, actorMismatch: true });
    const out = await submitQarzOp(repayInput(10, 20, 5000));
    expect(out.status).toBe('queued');
    expect(out.op).toMatchObject({ status: 'pending', attempts: 0 });
    expect(out.op.sentOnce).toBeFalsy();
  });

  test('javobsiz (timeout) -> navbatda, O‘SHA kalit, endi tahrirlab/bekor qilib bo‘lmaydi', async () => {
    mockState.outbox = makeOutbox();
    mockState.send.mockResolvedValue({ status: null });
    const out = await submitQarzOp(repayInput(10, 20, 5000));
    expect(out.status).toBe('queued');
    const op = mockState.outbox.get(out.op.id) as OutboxOp;
    expect(op.sentOnce).toBe(true);
    expect(canDiscard(op)).toBe(false);
    expect(canEditAmount(op)).toBe(false);
    expect(mockState.outbox.discard(op.id)).toBe(0);
  });
});

describe('2) aktor har yuborishdan oldin tekshiriladi', () => {
  test('yugurish o‘rtasida token almashdi -> to‘xtaydi (no-actor), keyingi amal yuborilmaydi', async () => {
    const ob = makeOutbox();
    const a = add(ob, repayInput(10, 20, 1));
    const b = add(ob, repayInput(11, 21, 2));
    let actor: string = ACTOR;
    const srv = fakeServer(() => {
      actor = 'u7:x12'; // xodim rejimiga kirildi
      return { status: 200, data: {} };
    });
    const s = await new SyncEngine({ outbox: ob, send: srv.send, getActor: () => actor }).run();
    expect(s.stoppedBy).toBe('no-actor');
    expect(srv.calls).toHaveLength(1);
    expect(srv.calls[0].actor).toBe(ACTOR);
    expect(ob.get(a.id)?.status).toBe('done');
    expect(ob.get(b.id)?.status).toBe('pending');
  });

  test('yuboruvchi actorMismatch qaytarsa — amal o‘zgarishsiz pending, urinish hisoblanmaydi', async () => {
    const ob = makeOutbox();
    const a = add(ob, repayInput(10, 20, 1));
    const s = await engineOf(ob, async () => ({ status: null, actorMismatch: true })).run();
    expect(s.stoppedBy).toBe('no-actor');
    expect(ob.get(a.id)).toMatchObject({ status: 'pending', attempts: 0 });
  });

  test('401 -> refresh boshqa aktor tokenini berdi -> qayta yuborilmaydi', async () => {
    const ob = makeOutbox();
    add(ob, repayInput(10, 20, 1));
    let actor: string = ACTOR;
    const srv = fakeServer(() => ({ status: 401 }));
    const s = await new SyncEngine({
      outbox: ob,
      send: srv.send,
      getActor: () => actor,
      refreshAuth: async () => {
        actor = 'u7:x12';
        return true;
      },
    }).run();
    expect(s.stoppedBy).toBe('no-actor');
    expect(srv.calls).toHaveLength(1);
  });
});

describe('3) 409 IDEMPOTENCY_RESPONSE_UNAVAILABLE / KEY_REUSED', () => {
  const unavailable = { status: 409, data: { code: 'IDEMPOTENCY_RESPONSE_UNAVAILABLE', message: 'x' } };

  test('qaytarish -> done (serverda bajarilgan), qayta yuborilmaydi', async () => {
    const ob = makeOutbox();
    const r = add(ob, repayInput(10, 20, 500));
    const s = await engineOf(ob, async () => unavailable).run();
    expect(s.committed).toBe(1);
    expect(ob.get(r.id)).toMatchObject({ status: 'done', note: 'replay-lost' });
  });

  test('yaratish -> yakuniy failed: qayta urinish/summa yo‘q; bog‘liqlar aniq sabab bilan blocked', async () => {
    const ob = makeOutbox();
    const m = add(ob, mijozInput(ob));
    const q = add(ob, qarzInput(ob, m.tempId as number));
    const srv = fakeServer(() => unavailable);
    await engineOf(ob, srv.send).run();
    const failed = ob.get(m.id) as OutboxOp;
    expect(failed.status).toBe('failed');
    expect(isTerminalFailure(failed)).toBe(true);
    expect(ob.get(q.id)).toMatchObject({ status: 'blocked', lastError: { code: 'DEPENDENCY_COMMITTED' } });

    ob.retry(m.id); // hech narsa qilmaydi
    expect(ob.get(m.id)?.status).toBe('failed');
    expect(canDiscard(failed)).toBe(true);
    expect(srv.calls).toHaveLength(1);
  });

  test('KEY_REUSED -> failed, yangi kalit bilan tahrirlash/qayta urinish yo‘q', async () => {
    const ob = makeOutbox();
    const r = add(ob, repayInput(10, 20, 500));
    await engineOf(ob, async () => ({ status: 409, data: { code: 'IDEMPOTENCY_KEY_REUSED' } })).run();
    expect(ob.get(r.id)?.status).toBe('failed');
    expect(ob.editAmount(r.id, 100)).toBeUndefined();
    ob.retry(r.id);
    expect(ob.get(r.id)?.status).toBe('failed');
  });
});

describe('4) 5xx chegarasi va Retry-After', () => {
  test(`${MAX_SERVER_ERRORS} ta ketma-ket 5xx -> failed (vaqtinchalik); mustaqil amal davom etadi, o‘sha mijoz bloklanadi`, async () => {
    let t = 1_000_000;
    const ob = makeOutbox(memKV(), () => t);
    const bad = add(ob, repayInput(10, 20, 1));
    const sameCustomer = add(ob, closeInput(20, 5));
    const other = add(ob, repayInput(11, 21, 2));
    const srv = fakeServer(req => (req.path.includes('/qarz/10/') ? { status: 500 } : { status: 200, data: {} }));
    const engine = new SyncEngine({ outbox: ob, send: srv.send, getActor: () => ACTOR, now: () => t, random: () => 0.5 });
    for (let i = 0; i < MAX_SERVER_ERRORS; i++) {
      await engine.run(true);
      t += 10 * 60 * 1000;
    }
    expect(ob.get(bad.id)).toMatchObject({ status: 'failed', serverErrors: MAX_SERVER_ERRORS });
    expect(isTerminalFailure(ob.get(bad.id) as OutboxOp)).toBe(false);
    expect(canEditAmount(ob.get(bad.id) as OutboxOp)).toBe(false); // 5xx — faqat "Qayta urinish" (o'sha kalit)
    expect(ob.get(sameCustomer.id)).toMatchObject({ status: 'blocked', lastError: { code: 'CUSTOMER_BLOCKED' } });
    expect(ob.get(other.id)?.status).toBe('done');

    ob.retry(bad.id);
    expect(ob.get(bad.id)).toMatchObject({ status: 'pending', serverErrors: 0 });
    expect(ob.get(sameCustomer.id)?.status).toBe('pending');
  });

  test('tarmoq xatosi (javobsiz) chegaraga kirmaydi — cheksiz qayta urinish', async () => {
    let t = 1_000_000;
    const ob = makeOutbox(memKV(), () => t);
    const a = add(ob, repayInput(10, 20, 1));
    const engine = new SyncEngine({ outbox: ob, send: async () => ({ status: null }), getActor: () => ACTOR, now: () => t });
    for (let i = 0; i < MAX_SERVER_ERRORS * 2; i++) {
      await engine.run(true);
      t += 10 * 60 * 1000;
    }
    expect(ob.get(a.id)).toMatchObject({ status: 'pending', attempts: MAX_SERVER_ERRORS * 2 });
  });

  test('429/503 Retry-After hurmat qilinadi', async () => {
    const ob = makeOutbox();
    const a = add(ob, repayInput(10, 20, 1));
    const s = await engineOf(ob, async () => ({ status: 429, retryAfterMs: 60_000 })).run();
    expect(s.nextAttemptAt).toBe(1_000_000 + 60_000);
    expect(ob.get(a.id)?.nextAttemptAt).toBe(1_000_000 + 60_000);
    const r = classify(ob.get(a.id) as OutboxOp, { status: 503, data: { code: 'IDEMPOTENCY_UNAVAILABLE' }, retryAfterMs: 5000 });
    expect(r).toMatchObject({ type: 'transient', retryAfterMs: 5000, serverError: true });
  });

  test('parseRetryAfter: soniya, HTTP sana, noto‘g‘ri qiymat, 1 soat chegarasi', () => {
    expect(parseRetryAfter('5')).toBe(5000);
    expect(parseRetryAfter(new Date(10_000).toUTCString(), 4_000)).toBe(6_000);
    expect(parseRetryAfter('abc')).toBeUndefined();
    expect(parseRetryAfter(undefined)).toBeUndefined();
    expect(parseRetryAfter('99999')).toBe(3600 * 1000);
  });
});

describe('5) diskka yozib bo‘lmasa', () => {
  test('enqueue / nextTempId / mapId xato tashlaydi va xotira o‘zgarmaydi', () => {
    const kv = memKV();
    const ob = makeOutbox(kv);
    const before = ob.getState();
    kv.fail = true;
    expect(() => ob.enqueue(repayInput(10, 20, 1), ACTOR)).toThrow(OutboxPersistError);
    expect(() => ob.nextTempId()).toThrow(OutboxPersistError);
    expect(() => ob.mapId(-1, 5)).toThrow(OutboxPersistError);
    expect(ob.getState()).toBe(before);
    kv.fail = false;
    expect(ob.nextTempId()).toBe(-1);
    expect(JSON.parse(kv.data.get(OUTBOX_KEY) as string).tempSeq).toBe(1);
  });

  test('server id xaritasi saqlanmasa — O‘SHA kalit bilan keyinroq (dublikat emas)', async () => {
    const kv = memKV();
    const ob = makeOutbox(kv);
    const m = add(ob, mijozInput(ob));
    const srv = fakeServer((_req, _key, n) => {
      if (n === 1) kv.fail = true; // birinchi javobdan keyin disk to'ldi
      return { status: 200, data: { data: { id: 501 } } };
    });
    const s = await engineOf(ob, srv.send).run();
    expect(s.stoppedBy).toBe('transient');
    expect(ob.get(m.id)).toMatchObject({ status: 'pending', lastError: { code: 'PERSIST_FAILED' } });
    kv.fail = false;
    await engineOf(ob, srv.send).run(true);
    expect(srv.calls.map(c => c.key)).toEqual([m.id, m.id]);
    expect(ob.get(m.id)?.status).toBe('done');
    expect(ob.resolveId(m.tempId as number)).toBe(501);
  });
});

describe('6) bir mijozning keyingi amallari', () => {
  test('yangi qarz 402 -> shu mijozni yopish bloklanadi (eski qarzlarga tushmaydi); boshqa mijoz davom etadi', async () => {
    const ob = makeOutbox();
    const q = add(ob, qarzInput(ob, 20));
    const close = add(ob, closeInput(20, 300000));
    const other = add(ob, closeInput(21, 1));
    const srv = fakeServer(req =>
      req.path === '/qarz-daftari/qarz' ? { status: 402, data: { code: 'no-sms-package' } } : { status: 200, data: {} },
    );
    await engineOf(ob, srv.send).run();
    expect(ob.get(q.id)?.status).toBe('failed');
    expect(ob.get(close.id)).toMatchObject({ status: 'blocked', lastError: { code: 'CUSTOMER_BLOCKED' } });
    expect(ob.get(other.id)?.status).toBe('done');
    expect(srv.calls.some(c => c.req.path === '/qarz-daftari/mijozlar/20/yopish')).toBe(false);

    // Muammo hal bo'ldi -> "Qayta urinish": qarz, so'ng yopish
    ob.retry(q.id);
    expect(ob.get(close.id)?.status).toBe('pending');
  });

  test('rad etilgan qarz bekor qilinsa — yopish o‘zi yuborilmaydi, lekin sababi "Qayta urinish"ga o‘zgaradi', async () => {
    const ob = makeOutbox();
    const q = add(ob, qarzInput(ob, 20));
    const close = add(ob, closeInput(20, 2000));
    const srv = fakeServer(req =>
      req.path === '/qarz-daftari/qarz' ? { status: 422, data: { message: 'sana' } } : { status: 200, data: {} },
    );
    await engineOf(ob, srv.send).run();
    expect(ob.discard(q.id)).toBe(1);
    expect(ob.get(close.id)).toMatchObject({ status: 'blocked', lastError: { code: 'CUSTOMER_PARENT_DISCARDED' } });
    await engineOf(ob, srv.send).run();
    expect(srv.calls.some(c => c.req.path === '/qarz-daftari/mijozlar/20/yopish')).toBe(false);
    ob.retry(close.id);
    await engineOf(ob, srv.send).run();
    expect(ob.get(close.id)?.status).toBe('done');
  });

  test('temp mijoz xaritalangandan keyin server id bilan kiritilgan amal ham o‘sha mijoz hisoblanadi', async () => {
    const ob = makeOutbox();
    const m = add(ob, mijozInput(ob));
    const q = add(ob, qarzInput(ob, m.tempId as number));
    const repay = add(ob, repayInput(77, 501, 1000));
    const srv = fakeServer(req => {
      if (req.path.endsWith('/mijozlar')) return { status: 200, data: { data: { id: 501 } } };
      if (req.path === '/qarz-daftari/qarz') return { status: 402, data: { code: 'no-sms-package' } };
      return { status: 200, data: {} };
    });
    await engineOf(ob, srv.send).run();
    expect(ob.get(q.id)?.status).toBe('failed');
    expect(ob.get(repay.id)).toMatchObject({ status: 'blocked', lastError: { code: 'CUSTOMER_BLOCKED' } });
  });

  test('onlayn submit: o‘sha mijozning rad etilgan amali bor -> yuborilmaydi, blocked', async () => {
    const ob = makeOutbox();
    mockState.outbox = ob;
    const q = add(ob, qarzInput(ob, 20));
    ob.update(q.id, { status: 'failed', lastError: { status: 402, code: 'no-sms-package' } });
    const out = await submitQarzOp(closeInput(20, 100));
    expect(out.status).toBe('queued');
    expect(out.op).toMatchObject({ status: 'blocked', lastError: { code: 'CUSTOMER_BLOCKED' } });
    expect(mockState.send).not.toHaveBeenCalled();
  });
});

describe('7) prune faol amallarni o‘chirmaydi', () => {
  test('boshqa aktorning 60 kunlik pending amali qoladi; eski done o‘chadi', () => {
    let t = 1_000_000;
    const ob = makeOutbox(memKV(), () => t);
    const foreign = add(ob, repayInput(10, 20, 1), 'u9:x0');
    const done = add(ob, repayInput(10, 20, 2), 'u9:x0');
    ob.update(done.id, { status: 'done', doneAt: t });
    t += 60 * 24 * 3600 * 1000;
    ob.prune();
    expect(ob.list().map(o => o.id)).toEqual([foreign.id]);
  });
});

describe('8) 409 phone-exists — faqat FISH mos bo‘lsa avtomatik bog‘lanadi', () => {
  test('normFish: registr, bo‘shliq, apostrof turlari e‘tiborsiz', () => {
    expect(normFish("  G'ulom  ALIYEV ")).toBe(normFish('Gʻulom Aliyev'));
    expect(normFish('O‘tkir')).toBe(normFish("O'tkir"));
    expect(normFish('Ali')).not.toBe(normFish('Vali'));
  });

  test('ism boshqa -> failed (sabab + mavjud mijoz), bog‘liqlar blocked; "Shu mijozga bog‘lash" -> davom etadi', async () => {
    const ob = makeOutbox();
    const m = add(ob, mijozInput(ob, 'Ali Valiyev'));
    const q = add(ob, qarzInput(ob, m.tempId as number));
    const srv = fakeServer(req =>
      req.path.endsWith('/mijozlar')
        ? { status: 409, data: { code: 'phone-exists', existing_id: 321, existing_mijoz: { id: 321, fish: 'Vali Aliyev' } } }
        : { status: 200, data: { data: { id: 9001 } } },
    );
    const s = await engineOf(ob, srv.send).run();
    expect(s.linked).toBe(0);
    expect(ob.get(m.id)).toMatchObject({
      status: 'failed',
      lastError: { code: 'phone-exists', existingId: 321, existingFish: 'Vali Aliyev' },
    });
    expect(ob.get(q.id)?.status).toBe('blocked');
    expect(ob.resolveId(m.tempId as number)).toBeUndefined();

    expect(ob.linkExisting(m.id)).toBe(true);
    expect(ob.get(m.id)).toMatchObject({ status: 'done', note: 'linked-existing', serverId: 321 });
    expect(ob.get(q.id)?.status).toBe('pending');
    await engineOf(ob, srv.send).run();
    expect((srv.calls[1].req.body as { mijoz_id: number }).mijoz_id).toBe(321);
    expect(ob.get(q.id)?.status).toBe('done');
  });

  test('ism mos (registr/apostrof farqi) -> avtomatik bog‘lanadi', () => {
    const ob = makeOutbox();
    const m = add(ob, mijozInput(ob, "G'ulom Aliyev"));
    const r = classify(m, {
      status: 409,
      data: { code: 'phone-exists', existing_id: 5, existing_mijoz: { id: 5, fish: 'gʻulom  aliyev' } },
    });
    expect(r).toEqual({ type: 'link-existing', serverId: 5 });
  });

  test('onlayn submit: ism boshqa -> amal o‘chadi va xato ekranga (avvalgi xulq)', async () => {
    mockState.outbox = makeOutbox();
    mockState.send.mockResolvedValue({
      status: 409,
      data: { code: 'phone-exists', existing_id: 3, existing_mijoz: { id: 3, fish: 'Boshqa' } },
    });
    await expect(submitQarzOp(mijozInput(mockState.outbox))).rejects.toMatchObject({ response: { status: 409 } });
    expect(mockState.outbox.list()).toEqual([]);
  });
});

describe('A) navbatdagi amalni tahrirlash / bekor qilish', () => {
  test('hech qachon jo‘natilmagan pending: summa o‘zgaradi, bekor qilinadi', () => {
    const ob = makeOutbox();
    const r = add(ob, repayInput(10, 20, 500));
    expect(canEditAmount(r)).toBe(true);
    expect(canDiscard(r)).toBe(true);
    const e = ob.editAmount(r.id, 300) as OutboxOp;
    expect(e.status).toBe('pending');
    expect((e.payload as { summa: number }).summa).toBe(300);
    expect(ob.discard(e.id)).toBe(1);
  });

  test('dvigatel jo‘natgan (javobsiz) amal: tahrirlash ham, bekor qilish ham yo‘q', async () => {
    const ob = makeOutbox();
    const r = add(ob, repayInput(10, 20, 500));
    await engineOf(ob, async () => ({ status: null })).run();
    const op = ob.get(r.id) as OutboxOp;
    expect(op).toMatchObject({ status: 'pending', sentOnce: true });
    expect(ob.editAmount(r.id, 1)).toBeUndefined();
    expect(ob.discard(r.id)).toBe(0);
  });

  test('yaratish amali summasi tahrirlanmaydi; 4xx bilan rad etilgan qaytarish — tahrirlanadi', () => {
    const ob = makeOutbox();
    const q = add(ob, qarzInput(ob, 20));
    expect(canEditAmount(q)).toBe(false);
    const r = add(ob, repayInput(10, 20, 500));
    const f = ob.update(r.id, { status: 'failed', sentOnce: true, lastError: { status: 400, code: 'amount-exceeds' } });
    expect(canEditAmount(f as OutboxOp)).toBe(true);
  });
});

describe('logout (foydalanuvchi o‘zi): shu aktorning done amallari o‘chadi', () => {
  test('dropDone faqat shu aktorning done amallarini o‘chiradi', () => {
    const ob = makeOutbox();
    const d = add(ob, repayInput(10, 20, 1));
    const p = add(ob, repayInput(11, 20, 2));
    const foreignDone = add(ob, repayInput(12, 20, 3), 'u9:x0');
    ob.update(d.id, { status: 'done', doneAt: 1 });
    ob.update(foreignDone.id, { status: 'done', doneAt: 1 });
    expect(ob.dropDone(ACTOR)).toBe(1);
    expect(ob.list().map(o => o.id).sort()).toEqual([p.id, foreignDone.id].sort());
  });
});
