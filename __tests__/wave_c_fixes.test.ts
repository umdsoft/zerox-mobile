/**
 * Wave C (01.11): grafik jadvalidagi "Muddati o'tgan" tekshiruvi endi TOSHKENT kuni bo'yicha.
 * Toshkent qurilmasida natija ESKI (qurilma-lokal yarim tun vs UTC yarim tun) realizatsiya bilan bir xil;
 * boshqa TZ'da Toshkent qiymatiga teng.   TZ=UTC npx jest wave_c_fixes   |   TZ=Asia/Tashkent npx jest wave_c_fixes
 */
import { isDueBeforeTodayTk, scheduleRowState } from '../src/screens/home/modules/qarzAmaliyot/amaliyotLogic';

jest.mock('../src/screens/components/StatisticCard', () => ({ sortMoneyText: () => '' }));

const legacyOverdue = (raw: unknown, now: Date): boolean => {
  const due = new Date(String(raw).slice(0, 10)).getTime();
  return !isNaN(due) && due < new Date(now.toDateString()).getTime();
};
const isTashkent = new Date(Date.UTC(2026, 10, 1)).getTimezoneOffset() === -300;
const MIN = 60000;
const midnightTk = Date.UTC(2026, 10, 1, 19, 0); // 02.11 00:00 Toshkent
const NOWS = [-300, -61, -1, 0, 1, 60, 600, 1439].map(m => new Date(midnightTk + m * MIN));
const DUES = ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-02T10:00:00', '2026-11-01 00:00:00', '2025-01-01'];

describe('isDueBeforeTodayTk — Toshkent kuni', () => {
  test.each(NOWS.map(n => [n.toISOString(), n] as const))('now=%s: Toshkent qiymati', (_l, now) => {
    const today = new Date(now.getTime() + 5 * 3600e3).toISOString().slice(0, 10);
    for (const d of DUES) expect(isDueBeforeTodayTk(d, now)).toBe(d.slice(0, 10) < today);
  });

  (isTashkent ? test : test.skip)('Toshkent qurilmasida ESKI realizatsiya bilan bir xil', () => {
    for (const now of NOWS) for (const d of DUES) expect(isDueBeforeTodayTk(d, now)).toBe(legacyOverdue(d, now));
  });

  test('chegara: Toshkent 00:00 da kecha o\'tgan, bugun o\'tmagan', () => {
    const justAfterMidnight = new Date(midnightTk + 1 * MIN); // 02.11 00:01 Toshkent
    expect(isDueBeforeTodayTk('2026-11-01', justAfterMidnight)).toBe(true);
    expect(isDueBeforeTodayTk('2026-11-02', justAfterMidnight)).toBe(false);
    const justBefore = new Date(midnightTk - 1 * MIN); // 01.11 23:59 Toshkent
    expect(isDueBeforeTodayTk('2026-11-01', justBefore)).toBe(false);
    expect(isDueBeforeTodayTk('2026-10-31', justBefore)).toBe(true);
  });

  test('yaroqsiz/bo\'sh qiymat — muddati o\'tmagan', () => {
    for (const bad of [undefined, null, '', 'abc', '2026-13-45']) expect(isDueBeforeTodayTk(bad, new Date(midnightTk))).toBe(false);
  });
});

describe('scheduleRowState', () => {
  const t = (k: string) => k;
  test('holatlar (new Date() bilan)', () => {
    jest.useFakeTimers({ now: new Date(midnightTk + 10 * MIN) }); // 02.11 00:10 Toshkent
    try {
      expect(scheduleRowState({ status: 'tolandi', tolov_sanasi: '2026-01-01' }, t).label).toBe('To‘landi');
      expect(scheduleRowState({ status: 'kutilmoqda', tolov_sanasi: '2026-11-01' }, t).label).toBe('Muddati o‘tgan');
      expect(scheduleRowState({ status: 'kutilmoqda', tolov_sanasi: '2026-11-02' }, t).label).toBe('Kutilmoqda');
    } finally {
      jest.useRealTimers();
    }
  });
});
