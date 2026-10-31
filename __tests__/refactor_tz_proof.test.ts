/**
 * 01.11 sana/raqam xatolarini tuzatish isboti (docs/REFACTOR_DIVERGENCES.md, egasi tasdiqlagan).
 *
 * 1) Toshkent jadvali (-360) tuzatishdan OLDINGI (refactor_golden_pre.json) bilan bir xil — faqat
 *    ataylab o'zgargan raqam/sumCur sub'ektlari va 1970 tarixiy soat qatori bundan mustasno.
 * 2) Tuzatilgan sana sub'ektlari UTC / EST5EDT / Toshkent jadvallarida BIR XIL (TZ'ga bog'liq emas).
 * 3) Funksiyalar bevosita: kutilgan qiymatlar TZ'ga bog'liq emas — shu fayl TZ=UTC, TZ=EST5EDT va
 *    Toshkentda yuriladi (`TZ=UTC npx jest refactor_tz_proof`).
 * 4) num / sumCur tuzatishlari.
 * 5) Toshkent qurilmasida HEAD (eski, lokal getter) realizatsiyalar bilan natijalar bir xil (fmtLocalDate*, getDueMeta,
 *    daysLeft, isDebtOverdue, dateParts iste'molchilari) — Toshkent yarim tuni atrofidagi "hozir" qiymatlari bilan.
 * Golden: refactor_golden_pre.json = tuzatishdan OLDINGI jadval (o'zgarmas); refactor_golden.json = joriy.
 */
import fs from 'fs';
import path from 'path';

import { fmtLocalDate, fmtLocalDateTime, fmtDmyTk, fmtYmdTk, tkWall, tkCalendarYmd } from '../src/helper/date';
import { apiDateTkYmd, parseApiDate } from '../src/helper';
import { ymdOf } from '../src/screens/home/modules/debtAllocation';
import {
  parseLocalDate, localDateKey, isDebtOverdue, num as finNum, fDate, dateKeyOf, fDateHeader, fillDailySeries,
} from '../src/screens/home/modules/financeMoney';
import { daysLeft } from '../src/screens/home/modules/financeDebtGroups';
import { getDueMeta } from '../src/screens/components/StatisticCard';
import { num as shNum, sumCur as shSumCur } from '../src/screens/home/modules/QarzShartnomasi';
import { sumCur as homeSumCur } from '../src/screens/home/redesign/HomeRedesign';
import { num as smsNum } from '../src/screens/home/drawer/drawerScreens/smsPools';
import { formatDate as debtAskFormat } from '../src/screens/other/DebtDateLengthAsk';
import { formatDate as searchFormat } from '../src/screens/other/SearchUserScreen';

const load = (f: string): Record<string, Record<string, { in: any; out: any }[]>> =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'));
const pre = load('refactor_golden_pre.json');
const post = load('refactor_golden.json');
const TASHKENT = '-360'; // epoch 0 da Asia/Tashkent = UTC+6 (tarixiy); hozirgi UTC+5

// Tuzatishdan keyin Toshkent jadvalida o'zgargan QATORLAR — aniq ro'yxat (boshqa hech qanday qator o'zgarmagan).
const NUM_INPUTS = ['__Infinity__', '-Infinity', 'Infinity'];
const INTENDED_TK_CHANGES: Record<string, (row: { in: any }, idx: number) => boolean> = {
  'smsPools.num': r => NUM_INPUTS.includes(r.in),
  'financeMoney.num': r => NUM_INPUTS.includes(r.in),
  'QarzShartnomasi.num': r => [...NUM_INPUTS, '1 234,50', 'abc', '0x10'].includes(r.in),
  'QarzShartnomasi.sumCur(UZS)': (_r, i) => i === 0 || i === 3, // 'abc' qatori (NaN) va [null] (TypeError)
  'HomeRedesign.sumCur(USD)': (_r, i) => i === 0, // 10.4 + 0.3 USD: 11 -> 10.7
};
// Tashkent jadvalidagi YAGONA sana farqi: tzdata 1970-yilda Toshkentni UTC+6 deb biladi (Sovet davri).
// Joriy qoida har doim +5 (Toshkent 1991 yildan beri UTC+5) -> '1970-01-01T00:00:00Z' 06:00 emas 05:00.
const HISTORICAL_1970 = '1970-01-01T00:00:00Z';
const FIXED_DATE_SUBJECTS = [
  'QarzDaftariAmaliyot.fmtDate', 'QarzDaftariAmaliyot.fmtDateTime', 'QarzDaftariAmaliyotlar.fmtDateTime',
  'QarzDaftariMijoz.fmtDate', 'DebtDateLengthAsk.formatDate', 'SearchUserScreen.formatDate',
];

describe('1) Toshkent jadvali tuzatishdan oldingi bilan bir xil', () => {
  test('har bir sub\'ekt: faqat ataylab o\'zgargan qatorlar o\'zgargan (aniq ro\'yxat)', () => {
    for (const subject of Object.keys(pre[TASHKENT])) {
      const before = pre[TASHKENT][subject];
      const after = post[TASHKENT][subject];
      const allowed = INTENDED_TK_CHANGES[subject];
      const changed = before
        .map((b, i) => ({ b, i }))
        .filter(({ b, i }) => JSON.stringify(b) !== JSON.stringify(after[i]));
      const unexpected = changed.filter(({ b, i }) => b.in !== HISTORICAL_1970 && !(allowed && allowed(b, i)));
      expect({ subject, unexpected: unexpected.map(u => u.b.in) }).toEqual({ subject, unexpected: [] });
      // ruxsat etilgan qatorlarning HAMMASI haqiqatan o'zgargan (ro'yxat ortiqcha emas)
      if (allowed) {
        const idle = before.filter((b, i) => allowed(b, i) && JSON.stringify(b) === JSON.stringify(after[i]));
        expect({ subject, allowedButUnchanged: idle.length }).toEqual({ subject, allowedButUnchanged: 0 });
      }
    }
  });
  test('1970 qatori: faqat soat (06:00 -> 05:00), kun o\'zgarmaydi', () => {
    for (const s of ['QarzDaftariAmaliyot.fmtDateTime', 'QarzDaftariAmaliyotlar.fmtDateTime']) {
      const b = pre[TASHKENT][s].find(r => r.in === HISTORICAL_1970)!;
      const a = post[TASHKENT][s].find(r => r.in === HISTORICAL_1970)!;
      expect([b.out, a.out]).toEqual(['01.01.1970 06:00', '01.01.1970 05:00']);
    }
  });
  test('ymdOf va StatisticCard/sana yordamchilari: hech bir TZ jadvalida o\'zgarmagan', () => {
    for (const tz of Object.keys(pre)) {
      for (const s of ['debtAllocation.ymdOf', 'projection.tkYmdOf', 'helper.fmtDateTimeUz', 'helper.checkDate', 'debtAllocation.todayTashkent']) {
        expect(post[tz][s]).toEqual(pre[tz][s]);
      }
    }
  });
});

describe('2) Tuzatilgan sana sub\'ektlari barcha TZ jadvallarida bir xil', () => {
  test.each(FIXED_DATE_SUBJECTS)('%s', subject => {
    const tzs = Object.keys(post);
    expect(tzs.sort()).toEqual(['-360', '0', '300']);
    for (const tz of tzs) expect(post[tz][subject]).toEqual(post['-360'][subject]);
  });
});

// Eski (lokal getter) realizatsiya — Toshkent qurilmasida natija bir xil ekanini isbotlash uchun.
const p2 = (n: number) => String(n).padStart(2, '0');
const legacyDate = (s: any, spaceToT: boolean, fb: string) => {
  if (!s) return fb;
  const d = spaceToT ? new Date(String(s).replace(' ', 'T')) : new Date(s);
  if (isNaN(d.getTime())) return fb;
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`;
};
const legacyDateTime = (s: any, spaceToT: boolean, fb: string) => {
  const base = legacyDate(s, spaceToT, '');
  if (!base) return fb;
  const d = spaceToT ? new Date(String(s).replace(' ', 'T')) : new Date(s);
  return `${base} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};
const isTashkentDevice = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Tashkent';

describe('3) funksiyalar to\'g\'ridan-to\'g\'ri (TZ=UTC / EST5EDT / Toshkent da bir xil kutilma)', () => {
  test('fmtLocalDate / fmtLocalDateTime: Toshkent kuni', () => {
    const cases: [any, string, string][] = [
      ['2026-10-31', '31.10.2026', '31.10.2026 05:00'], // sof sana = shu kalendar kun
      ['2026-10-31T19:30:00.000Z', '01.11.2026', '01.11.2026 00:30'], // oniy vaqt + 5s
      ['2026-10-30T19:00:00.000Z', '31.10.2026', '31.10.2026 00:00'], // mysql2 DATE (Toshkent yarim tun)
      ['2026-10-31T21:00:00', '31.10.2026', '31.10.2026 21:00'], // zonasiz = Toshkent devor vaqti
      ['2026-10-31 21:00:00', '31.10.2026', '31.10.2026 21:00'],
      ['2026-10-31 21:00:00.123', '31.10.2026', '31.10.2026 21:00'],
      ['2026-10-31T00:30:00+05:00', '31.10.2026', '31.10.2026 00:30'],
      [1761939000000, '01.11.2025', '01.11.2025 00:30'],
    ];
    for (const [input, d, dt] of cases) {
      expect([input, fmtLocalDate(input)]).toEqual([input, d]);
      expect([input, fmtLocalDateTime(input)]).toEqual([input, dt]);
    }
    expect(fmtLocalDate('invalid', { fallback: '—' })).toBe('—');
    expect(fmtLocalDate('2026-02-30', { fallback: '—' })).toBe('—');
    expect(fmtLocalDate(1761939000000, { fallback: '—', spaceToT: true })).toBe('—'); // eski xulq: son + spaceToT = yaroqsiz
    expect(fmtLocalDate('')).toBe('');
  });

  test('formatDate: Date (DatePicker) -> lokal kun; satr -> Toshkent kuni', () => {
    const picked = new Date(2026, 9, 31, 23, 30); // foydalanuvchi shu qurilmada 31.10 ni tanladi
    expect(debtAskFormat(picked)).toBe('2026-10-31');
    expect(searchFormat(picked)).toBe('31.10.2026');
    expect(debtAskFormat('2026-10-31T19:30:00.000Z')).toBe('2026-11-01');
    expect(searchFormat('2026-10-31')).toBe('31.10.2026');
    expect(fmtYmdTk('x')).toBe('NaN-NaN-NaN');
    expect(fmtDmyTk('x')).toBe('NaN.NaN.NaN');
  });

  test('parseLocalDate: Toshkent y/m/d, lokal yarim tun; picker aylanishi (ymd -> Date -> ymd) buzilmaydi', () => {
    const ymds = ['2026-01-01', '2026-03-08', '2026-03-29', '2026-10-25', '2026-11-01', '2026-12-31', '2028-02-29'];
    for (const ymd of ymds) {
      const d = parseLocalDate(ymd)!;
      expect([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()]).toEqual([
        Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)), Number(ymd.slice(8, 10)), 0,
      ]);
      expect(localDateKey(d)).toBe(ymd);
    }
    const mysql = parseLocalDate('2026-10-30T19:00:00.000Z')!; // Toshkent 31.10 yarim tun
    expect(localDateKey(mysql)).toBe('2026-10-31');
    expect(parseLocalDate('garbage')).toBeNull();
  });

  test('daysLeft: Toshkent "bugun" bo\'yicha (g\'arbiy TZ\'da -1 yo\'q)', () => {
    // Toshkent 31.10 00:05 = 30.10 19:05Z; 31.10 23:55 = 31.10 18:55Z
    const lateNight = new Date('2026-10-31T18:55:00Z');
    const justAfterMidnight = new Date('2026-10-30T19:05:00Z');
    expect(daysLeft('2026-10-31', lateNight)).toBe(0);
    expect(daysLeft('2026-10-31', justAfterMidnight)).toBe(0);
    expect(daysLeft('2026-11-02', lateNight)).toBe(2);
    expect(daysLeft('2026-10-30', justAfterMidnight)).toBe(-1);
    expect(daysLeft('2026-10-30T19:00:00.000Z', justAfterMidnight)).toBe(0);
    expect(daysLeft(null)).toBeNull();
  });

  test('isDebtOverdue: Toshkent kuni (jest fake timers)', () => {
    jest.useFakeTimers();
    try {
      const debt = (due: string) => ({ status: 'active', remaining_amount: 5, due_date: due });
      jest.setSystemTime(new Date('2026-10-30T19:05:00Z')); // Toshkent 31.10 00:05
      expect(isDebtOverdue(debt('2026-10-31'))).toBe(false);
      expect(isDebtOverdue(debt('2026-10-30'))).toBe(true);
      jest.setSystemTime(new Date('2026-10-31T18:55:00Z')); // Toshkent 31.10 23:55
      expect(isDebtOverdue(debt('2026-10-31'))).toBe(false);
      expect(isDebtOverdue(debt('2026-10-30T19:00:00.000Z'))).toBe(false); // = 31.10
    } finally {
      jest.useRealTimers();
    }
  });

  test('StatisticCard.getDueMeta: sana matni va diff Toshkent kuni', () => {
    const now = Date.parse('2026-10-31T18:55:00Z'); // Toshkent 31.10 23:55
    const cases: [any, string, number, string][] = [
      ['2026-10-31', '31.10.2026', 0, 'near'],
      ['2026-10-31 21:00:00.000', '31.10.2026', 0, 'near'], // zonasiz -> Toshkent devor vaqti
      ['2026-10-30T19:00:00.000Z', '31.10.2026', 0, 'near'], // oniy vaqt Toshkent 31.10 00:00
      ['2026-10-31T19:30:00.000Z', '01.11.2026', 1, 'near'],
      ['31.10.2026', '31.10.2026', 0, 'near'],
      ['2026-10-30', '30.10.2026', -1, 'overdue'],
      ['2026-11-20', '20.11.2026', 20, 'active'],
    ];
    for (const [input, date, diff, cat] of cases) {
      const m = getDueMeta(input, now);
      expect([input, m.date, m.diff, m.cat]).toEqual([input, date, diff, cat]);
    }
    expect(getDueMeta('', now).diff).toBe(99999);
    expect(getDueMeta('nope', now).diff).toBe(99999);
  });

  test('ymdOf: zonasiz satr = Toshkent devor vaqti (backend VARCHAR/raw), TZ\'ga bog\'liq emas', () => {
    // Tasdiq: backend/knexfile.js mysql2 timezone '+05:00' -> Date ustunlari ISO(Z) instant; raw/VARCHAR satrlar Toshkent devor vaqti.
    expect(ymdOf('2026-10-31T21:00:00')).toBe('2026-10-31');
    expect(ymdOf('2026-10-31 21:00:00')).toBe('2026-10-31');
    expect(ymdOf('2026-10-31')).toBe('2026-10-31');
    expect(ymdOf('2026-10-30T19:00:00.000Z')).toBe('2026-10-31');
    expect(ymdOf('2026-10-31T00:30:00+05:00')).toBe('2026-10-31');
  });

  test('tkWall / tkCalendarYmd / apiDateTkYmd', () => {
    expect(tkCalendarYmd('2026-10-31T21:00:00')).toBe('2026-10-31');
    expect(tkCalendarYmd(null)).toBe('1970-01-01'); // new Date(null) = epoch (eski xulq saqlangan)
    expect(tkCalendarYmd(undefined)).toBeNull();
    expect(tkWall('2026-13-01')).toBeNull();
    expect(apiDateTkYmd('2026-10-31 10:00:00.000')).toBe('2026-10-31');
    expect(apiDateTkYmd('31.10.2026')).toBe('2026-10-31');
    expect(apiDateTkYmd('2026-10-31T19:30:00Z')).toBe('2026-11-01');
    expect(apiDateTkYmd('bad')).toBeNull();
  });

  (isTashkentDevice ? test : test.skip)('Toshkent qurilmasi: eski lokal-getter realizatsiya bilan 2026 panjarasida bir xil', () => {
    const inputs: any[] = [];
    for (let ms = Date.parse('2026-10-29T00:00:00Z'); ms < Date.parse('2026-11-03T00:00:00Z'); ms += 37 * 60 * 1000) {
      const iso = new Date(ms).toISOString(); // 2026-10-31T19:30:00.000Z
      inputs.push(iso, iso.slice(0, 19), iso.slice(0, 19).replace('T', ' '), iso.slice(0, 10), ms, iso.slice(0, 19) + '+05:00', iso.slice(0, 19) + '-05:00');
    }
    for (const x of inputs) {
      for (const spaceToT of [false, true]) {
        expect([x, spaceToT, fmtLocalDate(x, { fallback: '—', spaceToT })]).toEqual([x, spaceToT, legacyDate(x, spaceToT, '—')]);
        expect([x, spaceToT, fmtLocalDateTime(x, { fallback: '—', spaceToT })]).toEqual([x, spaceToT, legacyDateTime(x, spaceToT, '—')]);
      }
    }
  });
});

describe('4) num / sumCur', () => {
  test('QarzShartnomasi.num: pul parseri, chekli', () => {
    expect(shNum('abc')).toBe(0);
    expect(shNum('1 234,50')).toBe(1234.5);
    expect(shNum('1234.50')).toBe(1234.5);
    expect(shNum('-5')).toBe(-5);
    expect(shNum(' ')).toBe(0);
    expect(shNum(Infinity)).toBe(0);
    expect(shNum('-Infinity')).toBe(0);
    expect(Object.is(shNum('-Infinity'), -0)).toBe(false);
    expect(shNum(null)).toBe(0);
    expect(shNum(1234.5)).toBe(1234.5);
    expect(shNum(true)).toBe(1);
  });
  test('QarzShartnomasi.sumCur: NaN / null qator xavfsiz', () => {
    const rows: any[] = [
      { currency: 'UZS', residual_amount: '1000.5' }, { currency: 'UZS', residual_amount: 'abc' },
      null, { residual_amount: '2 000,25' }, { currency: 'usd', residual_amount: 10.4 },
    ];
    expect(shSumCur(rows, 'UZS')).toBe(3000.75);
    expect(shSumCur(rows, 'USD')).toBe(10.4);
    expect(shSumCur([null as any], 'UZS')).toBe(0);
    expect(shSumCur(undefined, 'UZS')).toBe(0);
  });
  test('HomeRedesign.sumCur: USD tsentlar saqlanadi, UZS butun', () => {
    const rows = [
      { currency: 'USD', residual_amount: 10.4 }, { currency: 'usd', residual_amount: 0.3 },
      { currency: 'UZS', residual_amount: 1000.5 }, { currency: 'UZS', residual_amount: 0.4 },
    ];
    expect(homeSumCur(rows, 'USD')).toBe(10.7);
    expect(homeSumCur(rows, 'UZS')).toBe(1001);
    expect(homeSumCur([{ currency: 'USD', residual_amount: 0.1 }, { currency: 'USD', residual_amount: 0.2 }], 'USD')).toBe(0.3);
  });
  test('smsPools.num / financeMoney.num: Infinity -> 0; -0 xulqi saqlangan', () => {
    for (const f of [smsNum, finNum]) {
      expect(f(Infinity)).toBe(0);
      expect(f('-Infinity')).toBe(0);
      expect(f('abc')).toBe(0);
      expect(f('12.5')).toBe(12.5);
    }
    expect(Object.is(smsNum(-0), 0)).toBe(true);
    expect(Object.is(finNum(-0), -0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 5) Toshkent qurilmasida ESKI (HEAD) realizatsiyalar bilan natija bir xil: getDueMeta, daysLeft, isDebtOverdue,
//    dateParts iste'molchilari (fDate, dateKeyOf, fDateHeader, fillDailySeries, parseLocalDate).
//    Eski tanalar `git show HEAD:src/screens/home/modules/{financeMoney,financeDebtGroups}.ts` va StatisticCard.tsx dan.
// ---------------------------------------------------------------------------------------------------------------
const legacyDateParts = (s?: any): { y: number; mo: number; d: number } | null => {
  if (!s) return null;
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) return { y: dt.getFullYear(), mo: dt.getMonth() + 1, d: dt.getDate() };
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) } : null;
};
const legacyParseLocalDate = (s?: any): Date | null => {
  const p = legacyDateParts(s || undefined);
  return p ? new Date(p.y, p.mo - 1, p.d) : null;
};
const legacyDaysLeft = (due: any, now: Date): number | null => {
  const d = legacyParseLocalDate(due || undefined);
  if (!d) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};
const legacyOverdue = (due: any, now: Date): boolean => {
  const d = legacyParseLocalDate(String(due));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return !!d && d.getTime() < today.getTime();
};
const legacyDueMeta = (endDate: any, now: Date) => {
  const parsed = parseApiDate(endDate); // parseApiDate xulqi o'zgarmagan (golden: helper.checkDate)
  const d = parsed ? new Date(parsed.getTime()) : new Date(NaN);
  if (!endDate || isNaN(d.getTime())) return { cat: 'active', date: '', diff: 99999 };
  const iso = new Date(d.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
  const [y, m, dd] = iso.split('-');
  const n = new Date(now.getTime());
  d.setHours(0, 0, 0, 0);
  n.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - n.getTime()) / 86400000);
  const cat = diff < 0 ? 'overdue' : diff <= 5 ? 'near' : 'active';
  return { cat, date: `${dd}.${m}.${y}`, diff };
};

describe('5) Toshkent qurilmasi: HEAD realizatsiyalari bilan bir xil', () => {
  const NOWS = [
    '2026-10-30T18:55:00Z', '2026-10-30T19:05:00Z', '2026-10-31T18:55:00Z', '2026-10-31T19:05:00Z', '2026-11-01T12:00:00Z',
  ].map(x => new Date(x));
  const inputs: any[] = ['', null, undefined, 'invalid', '31.10.2026', '2026-10-31 garbage'];
  for (let ms = Date.parse('2026-10-28T00:00:00Z'); ms < Date.parse('2026-11-08T00:00:00Z'); ms += 53 * 60 * 1000) {
    const iso = new Date(ms).toISOString();
    const noZone = iso.slice(0, 19);
    inputs.push(iso, noZone, noZone.replace('T', ' '), noZone.replace('T', ' ') + '.000', iso.slice(0, 10), ms, noZone + '+05:00');
  }
  const run = isTashkentDevice ? test : test.skip;

  run('fDate / dateKeyOf / parseLocalDate / fillDailySeries (dateParts iste\'molchilari)', () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    for (const x of inputs) {
      const p = legacyDateParts(x);
      expect([x, dateKeyOf(x)]).toEqual([x, p ? `${p.y}-${pad(p.mo)}-${pad(p.d)}` : '']);
      expect([x, fDate(x)]).toEqual([x, p ? `${pad(p.d)}.${pad(p.mo)}.${p.y}` : x ? String(x) : '']);
      const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
      expect([x, fDateHeader(x)]).toEqual([x, p ? `${p.d}-${MONTHS[p.mo - 1]}, ${p.y}` : x ? String(x) : '']);
      const a = parseLocalDate(x);
      const b = legacyParseLocalDate(x);
      expect([x, a && a.getTime()]).toEqual([x, b && b.getTime()]);
    }
    const rows = inputs.filter(x => typeof x === 'string').map(date => ({ date, total: 10 }));
    const expected = Array.from({ length: 31 }, () => 0);
    for (const r of rows) {
      const p = legacyDateParts(r.date);
      if (p) expected[Math.min(31, Math.max(1, p.d)) - 1] += 10;
    }
    expect(fillDailySeries(rows, 2026, 10).map(r => r.total)).toEqual(expected);
  });

  run('daysLeft va isDebtOverdue (Toshkent yarim tuni atrofida)', () => {
    jest.useFakeTimers();
    try {
      for (const now of NOWS) {
        jest.setSystemTime(now);
        for (const x of inputs) {
          expect([x, now.toISOString(), daysLeft(x as any, now)]).toEqual([x, now.toISOString(), legacyDaysLeft(x, now)]);
          if (x) {
            const debt = { status: 'active', remaining_amount: 5, due_date: x };
            expect([x, now.toISOString(), isDebtOverdue(debt)]).toEqual([x, now.toISOString(), legacyOverdue(x, now)]);
          }
        }
      }
    } finally {
      jest.useRealTimers();
    }
  });

  run('getDueMeta: cat / date / diff', () => {
    for (const now of NOWS) {
      for (const x of inputs) {
        const m = getDueMeta(x, now.getTime());
        expect([x, now.toISOString(), { cat: m.cat, date: m.date, diff: m.diff }]).toEqual([x, now.toISOString(), legacyDueMeta(x, now)]);
      }
    }
  });
});
