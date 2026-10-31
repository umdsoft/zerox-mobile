/**
 * Wave B (01.11): isRoundOverdue / canUnpayPayment endi TOSHKENT vaqtida. Toshkent qurilmasida natija ESKI
 * (qurilma-lokal) realizatsiya bilan bir xil ekanini isbotlaydi (HEAD tanalari legacy* sifatida ko'chirilgan);
 * boshqa TZ'da natija Toshkent qiymati bilan teng bo'lishi shart.  TZ=UTC npx jest wave_b_gap_tz
 */
import { canUnpayPayment, isRoundOverdue, UNPAY_WINDOW_MS } from '../src/screens/home/modules/gap/gapDetailLogic';

type Json = Record<string, any>;
const legacyOverdue = (r: Json, now: Date): boolean => {
  if (typeof r?.round_expired === 'boolean') return r.round_expired;
  const raw = r?.due_date;
  if (!raw) return false;
  const d = new Date(String(raw).replace(' ', 'T'));
  if (isNaN(d.getTime())) return false;
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return day(d) < day(now);
};
const legacyCanUnpay = (p: Json, mayManage: boolean, nowMs: number): boolean => {
  if (!mayManage || p.status !== 'paid') return false;
  const ms = p.paid_at ? new Date(String(p.paid_at).replace(' ', 'T')).getTime() : 0;
  if (!ms || isNaN(ms)) return true;
  return nowMs - ms <= UNPAY_WINDOW_MS;
};

const isTashkent = new Date(Date.UTC(2026, 10, 1)).getTimezoneOffset() === -300;
const MIN = 60000;
const midnightTk = Date.UTC(2026, 10, 1, 19, 0); // 02.11 00:00 Toshkent
const NOWS = [-2, -1, 0, 1, 2, 600].map(m => new Date(midnightTk + m * MIN)); // 02.11 00:00 atrofida va ertalab
const DUES = [
  '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-01 00:00:00', '2026-11-02 00:00:00', '2026-11-01T23:59:59',
  '2026-11-02T00:00:00', '2026-11-02T00:00:00.000', 'bad', '', null,
];

describe('isRoundOverdue', () => {
  test.each(DUES)('due_date %p: Toshkentda eski bilan bir xil / hamma TZ\'da Toshkent qiymati', due => {
    const got = NOWS.map(n => isRoundOverdue({ due_date: due }, n));
    if (isTashkent) expect(got).toEqual(NOWS.map(n => legacyOverdue({ due_date: due }, n)));
    // TZ'dan mustaqil kutilgan qiymat: Toshkent kalendar kuni solishtiriladi
    const dueDay = typeof due === 'string' && /^\d{4}-\d{2}-\d{2}/.test(due) ? due.slice(0, 10) : null;
    const expected = NOWS.map(n => {
      if (!dueDay) return false;
      return dueDay < new Date(n.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
    });
    expect(got).toEqual(expected);
  });
  test('ISO "Z" muddat: Toshkent kuni (Toshkentda eski bilan bir xil)', () => {
    for (const due of ['2026-11-01T19:00:00.000Z', '2026-11-01T18:59:59.000Z']) {
      const got = NOWS.map(n => isRoundOverdue({ due_date: due }, n));
      if (isTashkent) expect(got).toEqual(NOWS.map(n => legacyOverdue({ due_date: due }, n)));
    }
    // 19:00Z = 02.11 Toshkent: 02.11 00:00 Toshkentda hali o'tmagan, 03.11 da o'tgan
    expect(isRoundOverdue({ due_date: '2026-11-01T19:00:00.000Z' }, new Date(midnightTk))).toBe(false);
    expect(isRoundOverdue({ due_date: '2026-11-01T19:00:00.000Z' }, new Date(midnightTk + 24 * 60 * MIN))).toBe(true);
  });
  test('round_expired bayrog\'i ustun', () => {
    expect(isRoundOverdue({ round_expired: true, due_date: '2099-01-01' }, NOWS[0])).toBe(true);
    expect(isRoundOverdue({ round_expired: false, due_date: '2000-01-01' }, NOWS[0])).toBe(false);
  });
});

describe('canUnpayPayment (24 soatlik oyna — kalendar kun qoidasi EMAS)', () => {
  const now = Date.UTC(2026, 10, 2, 10, 0); // 02.11 15:00 Toshkent
  const edge = now - UNPAY_WINDOW_MS; // 01.11 15:00 Toshkent = 10:00Z
  const PAID = [
    '2026-11-01 15:00:00', '2026-11-01 15:00:01', '2026-11-01 14:59:59', '2026-11-01T15:00:00', '2026-11-01T15:00:00.000',
    '2026-11-01T10:00:00.000Z', '2026-11-01T09:59:59Z', '2026-11-01T15:00:00+05:00', '2026-11-01T15:00:01+05:00', 'garbage', '',
  ];
  test.each(PAID)('paid_at %p', paid_at => {
    const p = { status: 'paid', paid_at };
    const got = [-1, 0, 1].map(d => canUnpayPayment(p, true, now + d * 1000));
    if (isTashkent) expect(got).toEqual([-1, 0, 1].map(d => legacyCanUnpay(p, true, now + d * 1000)));
  });
  test('zonasiz paid_at Toshkent devor vaqti: oyna chegarasi qurilma TZ\'siga bog\'liq emas', () => {
    expect(edge).toBe(Date.UTC(2026, 10, 1, 10, 0));
    const p = { status: 'paid', paid_at: '2026-11-01 15:00:00' };
    expect(canUnpayPayment(p, true, now)).toBe(true);
    expect(canUnpayPayment(p, true, now + 1)).toBe(false);
    expect(canUnpayPayment({ status: 'paid', paid_at: '2026-11-01T10:00:00.000Z' }, true, now + 1)).toBe(false);
  });
});
