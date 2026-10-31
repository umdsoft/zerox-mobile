import {tashkentDayDiff} from '../src/helper/dayDiff';

// "now" = Toshkent peshin (UTC 07:00 = 12:00 Toshkent)
const at = (iso: string) => new Date(iso);

describe('tashkentDayDiff', () => {
  test('Jul 30 -> Aug 2 = 3 kun (oy chegarasi)', () => {
    expect(tashkentDayDiff(at('2026-08-02T07:00:00Z'), at('2026-07-30T07:00:00Z'))).toBe(3);
  });
  test('Dec 31 -> Jan 1 = 1 kun (yil chegarasi)', () => {
    expect(tashkentDayDiff(at('2027-01-01T07:00:00Z'), at('2026-12-31T07:00:00Z'))).toBe(1);
  });
  test('o\'tgan sana manfiy, bugun = 0', () => {
    expect(tashkentDayDiff(at('2026-07-29T07:00:00Z'), at('2026-07-30T07:00:00Z'))).toBe(-1);
    expect(tashkentDayDiff(at('2026-07-30T01:00:00Z'), at('2026-07-30T18:00:00Z'))).toBe(0);
  });
  test('Toshkent yarim tuni: UTC 19:30 allaqachon ertangi kun', () => {
    expect(tashkentDayDiff(at('2026-07-31T00:00:00Z'), at('2026-07-30T19:30:00Z'))).toBe(0);
  });
  test('sana-only satr va noto\'g\'ri sana', () => {
    expect(tashkentDayDiff('2026-08-02', at('2026-07-30T07:00:00Z'))).toBe(3);
    expect(tashkentDayDiff('xx', at('2026-07-30T07:00:00Z'))).toBeNaN();
  });
});
