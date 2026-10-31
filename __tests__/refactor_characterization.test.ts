/**
 * Refactor characterization (Phase 0): yagona-manbaga ko'chirishdan OLDIN mavjud
 * lokal nusxalarning aniq chiqishlarini qotiradi (fixtures/refactor_golden.json).
 *
 * Mahalliy getter ishlatuvchi nusxalar qurilma TZ'iga bog'liq, shuning uchun golden
 * TZ ofseti bo'yicha (getTimezoneOffset) saqlanadi: -300 (Asia/Tashkent), 0 (UTC) va
 * 240 (EST5EDT). Boshqa TZ'da jadval yo'q -> o'sha qism o'tkazib yuboriladi.
 *   Windows'da TZ faqat buyruq qatorida ishlaydi:  TZ=UTC npx jest refactor_
 * Golden'ni qayta yozish (FAQAT refaktordan oldingi kodda): REFACTOR_GEN=1.
 */
import fs from 'fs';
import path from 'path';

import { checkDate, fmtDateTimeUz } from '../src/helper';
import { groupDigits, compactMoney } from '../src/helper/money';
import { phoneDigits9 } from '../src/helper/phone';
import { fmtCard4, cardDigits } from '../src/helper/cardBin';
import { tkYmdOf, num as projNum } from '../src/offline/projection';
import { num as deriveNum } from '../src/offline/derive';
import { num as smsNum } from '../src/screens/home/drawer/drawerScreens/smsPools';
import { ymdOf, todayTashkent } from '../src/screens/home/modules/debtAllocation';
import { num as finNum, parseLocalDate, localDateKey } from '../src/screens/home/modules/financeMoney';
import { sumByCur } from '../src/screens/home/modules/financeDebtGroups';
import { fmtDate as amFmtDate, fmtDateTime as amFmtDateTime } from '../src/screens/home/modules/QarzDaftariAmaliyot';
import { fmtDateTime as amsFmtDateTime } from '../src/screens/home/modules/QarzDaftariAmaliyotlar';
import { fmtDate as mijFmtDate } from '../src/screens/home/modules/QarzDaftariMijoz';
import { formatDate as debtAskFormatDate } from '../src/screens/other/DebtDateLengthAsk';
import { formatDate as searchFormatDate } from '../src/screens/other/SearchUserScreen';
import { num as shNum, sumCur as shSumCur } from '../src/screens/home/modules/QarzShartnomasi';
import { sumCur as homeSumCur } from '../src/screens/home/redesign/HomeRedesign';
import { fmtCard as payoutFmtCard } from '../src/screens/home/modules/FinancePayoutCard';
import { fmtCard as kartaFmtCard } from '../src/screens/home/modules/QarzDaftariKarta';
import { formatThousands } from '../src/screens/home/modules/QarzDaftariYopish';
import { parsePhone9 } from '../src/screens/home/modules/QarzDaftariXodimlar';
import { formatMln } from '../src/screens/components/StatisticCard';

// Inline (funksiya emas) ifodalarning qotirilgan nusxalari: ListCard.tsx:67, Dalol.tsx:73, StatisticCard.tsx:69.
const legacyListCard = (v: any) => {
  const ed = new Date(v);
  return isNaN(ed.getTime()) ? v : new Date(ed.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
};
const legacyDalol = (v: any) => {
  if (!v) return '';
  const tm = new Date(v).getTime();
  return isNaN(tm) || tm <= 0 ? '' : new Date(tm + 5 * 3600 * 1000).toISOString().slice(0, 10);
};
const legacyStat = (ms: number) => new Date(ms + 5 * 3600 * 1000).toISOString().slice(0, 10);

export const DATES: any[] = [
  '2026-10-31T19:30:00.000Z', '2026-10-31', '2026-12-31T23:59:59Z', '2026-10-31 10:00:00',
  '2026-10-31T10:00:00', '2026-10-31T21:00:00', '2026-10-31 21:00:00', '2026-10-31T00:30:00+05:00', '1970-01-01T00:00:00Z', 0, 1761939000000,
  'invalid', '', null, undefined, '31.10.2026',
];
export const NUMS: any[] = [
  0, 1, 1234.5, '1 234,50', '1234.50', '-5', -1234.5, 1e21, Infinity, '-Infinity', 'Infinity', NaN, 'abc', null,
  undefined, '', true, [], '0x10', -0, 999999.999,
];
export const CARDS: any[] = [
  '8600123456789012', '8600 1234 5678 9012', '8600123456789012345', '8600 **** **** 1234', 'abc', '', null,
  undefined, '12', '1234', '12345', 1234567890123456, ' 8600-1234-5678-9012 ',
];
export const PHONES: any[] = [
  '+998 93 752 44 11', '998937524411', '937524411', '93', '', null, undefined, '+998', '9989',
  '12345678901234', 998937524411,
];
export const THOUSANDS: any[] = ['', '0012', '12345.', '1 234 567', 'abc', '1234567890123456789012', null, undefined, 1234567, '0'];
const ROWS: any[] = [
  [
    { currency: 'UZS', residual_amount: '1000.5', remaining_amount: '1000.5' },
    { currency: 'usd', residual_amount: 10.4, remaining_amount: 10.4 },
    { residual_amount: null, remaining_amount: null },
    { currency: 'USD' },
    { currency: 'EUR', residual_amount: 5, remaining_amount: 5 },
    { currency: 'UZS', residual_amount: 'abc', remaining_amount: 'abc' },
    { currency: 'usd', residual_amount: 0.3, remaining_amount: 0.3 },
  ],
  [],
  undefined,
  [null],
];

const safe = (fn: () => any): any => {
  try {
    return fn();
  } catch (e: any) {
    return { THROWS: e?.constructor?.name };
  }
};
const ser = (v: any): any => {
  if (Object.is(v, -0)) return '__-0__';
  if (typeof v === 'number' && !Number.isFinite(v)) return `__${v}__`;
  if (v === undefined) return '__undefined__';
  if (v instanceof Date) return isNaN(v.getTime()) ? '__InvalidDate__' : `__Date:${v.toISOString()}__`;
  if (Array.isArray(v)) return v.map(ser);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ser(x)]));
  return v;
};

type Table = Record<string, { in: any; out: any }[]>;
const run = (fn: (x: any) => any, inputs: any[]) =>
  inputs.map(i => ({ in: ser(i), out: ser(safe(() => fn(i))) }));
const finiteMs = DATES.filter(d => typeof d === 'number');

const build = (): Table => ({
  'helper.checkDate': run(checkDate, DATES),
  'helper.fmtDateTimeUz': run(fmtDateTimeUz, DATES),
  'QarzDaftariAmaliyot.fmtDate': run(amFmtDate, DATES),
  'QarzDaftariAmaliyot.fmtDateTime': run(amFmtDateTime, DATES),
  'QarzDaftariAmaliyotlar.fmtDateTime': run(amsFmtDateTime, DATES),
  'QarzDaftariMijoz.fmtDate': run(mijFmtDate, DATES),
  'DebtDateLengthAsk.formatDate': run(debtAskFormatDate, DATES),
  'SearchUserScreen.formatDate': run(searchFormatDate, DATES),
  'financeMoney.localDateKey(new Date(x))': run(x => localDateKey(new Date(x)), DATES),
  'financeMoney.parseLocalDate': run(parseLocalDate, DATES),
  'projection.tkYmdOf': run(tkYmdOf, DATES),
  'debtAllocation.ymdOf': run(ymdOf, DATES),
  'debtAllocation.todayTashkent': run(todayTashkent, finiteMs),
  'inline.ListCard': run(legacyListCard, DATES),
  'inline.Dalol': run(legacyDalol, DATES),
  'inline.StatisticCard': run(legacyStat, finiteMs),
  'derive.num': run(deriveNum, NUMS),
  'projection.num': run(projNum, NUMS),
  'smsPools.num': run(smsNum, NUMS),
  'financeMoney.num': run(finNum, NUMS),
  'QarzShartnomasi.num': run(shNum, NUMS),
  'money.groupDigits': run(groupDigits, NUMS.filter(n => typeof n === 'number' && Number.isFinite(n))),
  'money.compactMoney': run(compactMoney, NUMS),
  'StatisticCard.formatMln': run(formatMln, NUMS),
  'QarzDaftariYopish.formatThousands': run(formatThousands, THOUSANDS),
  'QarzShartnomasi.sumCur(UZS)': run(r => shSumCur(r, 'UZS'), ROWS),
  'QarzShartnomasi.sumCur(USD)': run(r => shSumCur(r, 'USD'), ROWS),
  'HomeRedesign.sumCur(UZS)': run(r => homeSumCur(r, 'UZS'), ROWS),
  'HomeRedesign.sumCur(USD)': run(r => homeSumCur(r, 'USD'), ROWS),
  'financeDebtGroups.sumByCur': run(r => sumByCur(r as any), ROWS.filter(Array.isArray)),
  'FinancePayoutCard.fmtCard': run(payoutFmtCard, CARDS),
  'QarzDaftariKarta.fmtCard': run(kartaFmtCard, CARDS),
  'cardBin.fmtCard4': run(fmtCard4, CARDS),
  'cardBin.cardDigits': run(cardDigits, CARDS),
  'QarzDaftariXodimlar.parsePhone9': run(parsePhone9, PHONES),
  'phone.phoneDigits9': run(phoneDigits9, PHONES),
});

const GOLDEN_PATH = path.join(__dirname, 'fixtures', 'refactor_golden.json');
const offset = String(new Date(0).getTimezoneOffset());
const golden: Record<string, Table> = fs.existsSync(GOLDEN_PATH)
  ? JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8'))
  : {};

describe('refactor characterization', () => {
  if (process.env.REFACTOR_GEN) {
    test('generate golden', () => {
      golden[offset] = build();
      fs.writeFileSync(GOLDEN_PATH, JSON.stringify(golden, null, 1));
    });
    return;
  }
  test('golden table exists for this TZ (else this TZ is skipped)', () => {
    if (!golden[offset]) console.warn(`refactor golden: TZ offset ${offset} jadvali yo'q, o'tkazib yuborildi`);
    expect(true).toBe(true);
  });
  const t = golden[offset];
  if (!t) return;
  const actual = build();
  for (const name of Object.keys(t)) {
    test(name, () => {
      expect(actual[name]).toEqual(t[name]);
    });
  }
  test('golden covers every subject', () => {
    expect(Object.keys(actual).sort()).toEqual(Object.keys(t).sort());
  });
});

// --- Yangi tkYmdFromMs ustiga qurilgan wrapper'lar eski inline xulq bilan bir xil ---
import { tkYmdFromMs } from '../src/helper/date';

const newListCard = (v: any) => {
  const ed = new Date(v);
  return isNaN(ed.getTime()) ? v : tkYmdFromMs(ed.getTime());
};
const newDalol = (v: any) => {
  if (!v) return '';
  const tm = new Date(v).getTime();
  return isNaN(tm) || tm <= 0 ? '' : tkYmdFromMs(tm);
};

describe('tkYmdFromMs wrappers (ListCard / Dalol / StatisticCard)', () => {
  const t0 = golden[offset];
  const gold = (name: string) => (t0 ? t0[name].map(r => r.out) : null);
  test('ListCard wrapper == golden', () => {
    if (!t0) return;
    expect(DATES.map(d => ser(safe(() => newListCard(d))))).toEqual(gold('inline.ListCard'));
  });
  test('Dalol wrapper == golden', () => {
    if (!t0) return;
    expect(DATES.map(d => ser(safe(() => newDalol(d))))).toEqual(gold('inline.Dalol'));
  });
  test('StatisticCard expr == golden', () => {
    if (!t0) return;
    expect(finiteMs.map(ms => tkYmdFromMs(ms))).toEqual(gold('inline.StatisticCard'));
  });
  test('tkYmdFromMs == legacy expression over wide ms grid', () => {
    const H = 3600 * 1000;
    const grid = [
      -1e13, -86400000 * 365 * 100, -H * 5 - 1, -H * 5, -1, 0, 1, H * 19 - 1, H * 19, H * 19 + 1,
      1761939000000, 1761940800000 - 1, 1761940800000, 1798761599000, 4102444799999, 4102444800000, 253402300799999,
    ];
    for (let ms = 1761854400000 - 3 * 86400000; ms < 1761854400000 + 3 * 86400000; ms += 1800000) grid.push(ms);
    grid.forEach(ms => expect(tkYmdFromMs(ms)).toBe(legacyStat(ms)));
  });
});
