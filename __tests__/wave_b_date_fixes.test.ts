/**
 * Wave B (01.11, egasi tasdiqlagan) sana tuzatishlari. Kutilgan qiymatlar qurilma TZ'iga bog'liq EMAS —
 * fayl TZ=UTC, TZ=EST5EDT va Toshkentda yuriladi:  TZ=UTC npx jest wave_b_date_fixes
 *  - checkDate/settingDate: 'Z'/ofsetli satr va son -> TOSHKENT kuni (ilgari qurilma kuni);
 *  - zonasiz satr (knexfile mysql2 '+05:00' = Toshkent devor vaqti) -> o'sha kun; projection.tkYmdOf va
 *    debtAllocation.ymdOf endi bir xil qoida (helper/date.tkYmdLoose).
 */
import { checkDate, settingDate } from '../src/helper';
import { tkYmdLoose } from '../src/helper/date';
import { tkYmdOf } from '../src/offline/projection';
import { ymdOf } from '../src/screens/home/modules/debtAllocation';

describe('checkDate / settingDate: Z sanalar Toshkent kuni', () => {
  const cases: [string | number, string][] = [
    ['2026-10-31T21:00:00.000Z', '01.11.2026'], // 21:00Z = 02:00 ertasi Toshkent
    ['2026-10-31T18:59:59Z', '31.10.2026'],
    ['2026-10-31T19:00:00Z', '01.11.2026'],
    ['2026-12-31T20:00:00.000Z', '01.01.2027'],
    ['2026-10-31T23:00:00+05:00', '31.10.2026'], // ofsetli: oniy vaqt 18:00Z -> Toshkent 31.10
    [Date.UTC(2026, 9, 31, 19, 0), '01.11.2026'], // son = epoch ms
  ];
  test.each(cases)('%p -> %s', (input, out) => {
    expect(checkDate(input as any)).toBe(out);
    expect(settingDate(input as any)).toBe(out);
  });
  test('zonasiz satrlar va DD.MM.YYYY: o\'sha kun (o\'zgarmagan)', () => {
    for (const s of ['2026-10-31', '2026-10-31 23:59:59', '2026-10-31T23:59:59', '2026-10-31 00:00:00.000', '31.10.2026', '31-10-2026']) {
      expect(checkDate(s)).toBe('31.10.2026');
      expect(settingDate(s)).toBe('31.10.2026');
    }
  });
  test('Date nusxasi (DatePicker) LOKAL kun; yaroqsiz/bo\'sh -> \'\'', () => {
    expect(settingDate(new Date(2026, 9, 31, 23, 30))).toBe('31.10.2026');
    expect(settingDate(new Date(2026, 9, 31, 0, 30))).toBe('31.10.2026');
    for (const bad of [null, undefined, '', 'abc', new Date(NaN)]) {
      expect(checkDate(bad as any)).toBe('');
      expect(settingDate(bad as any)).toBe('');
    }
  });
});

describe('tkYmdOf == ymdOf (zonasiz = Toshkent devor vaqti)', () => {
  const rows: [any, string | null][] = [
    ['2026-10-31', '2026-10-31'],
    ['2026-10-31T21:00:00', '2026-10-31'], // zonasiz: kesiladi (ilgari tkYmdOf non-Toshkent qurilmada 2026-11-01 berardi)
    ['2026-10-31 21:00:00', '2026-10-31'],
    ['2026-10-31 23:59:59.999', '2026-10-31'],
    ['2026-10-31T21:00:00.000Z', '2026-11-01'], // instant + 5s
    ['2026-10-31T18:59:59Z', '2026-10-31'],
    ['2026-10-31T21:00:00+0000', '2026-11-01'],
    ['2026-11-01T01:00:00+05:00', '2026-11-01'],
    [Date.UTC(2026, 9, 31, 19, 0), '2026-11-01'],
    [new Date(Date.UTC(2026, 9, 31, 19, 0)), '2026-11-01'],
    [null, null], [undefined, null], ['', null], ['abc', null], [NaN, null],
  ];
  test.each(rows)('%p -> %p', (input, out) => {
    expect(tkYmdOf(input)).toBe(out);
    expect(ymdOf(input)).toBe(out);
    expect(tkYmdLoose(input)).toBe(out);
  });
});
