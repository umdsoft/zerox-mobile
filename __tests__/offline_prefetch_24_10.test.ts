/**
 * 24.10 — "Oflayn uchun tayyorlash": URL rejasi (kesh kalitlari ekranlar bilan AYNAN mos),
 * mijoz tanlash, kesh chegarasi va throttle. Hamda oflayn telefon dublikati qidiruvi (sof qism).
 */
jest.mock('../src/offline/offlineStore', () => ({
  cachedOrDerived: jest.fn(() => null),
  currentActor: jest.fn(() => null),
  getOutbox: jest.fn(),
}));

import { findByPhone, phoneKey } from '../src/offline/customerLookup';
import {
  buildBaseUrls,
  buildMijozlarUrls,
  HISTORY_CAP,
  historyCap,
  historyUrl,
  pickHistoryIds,
  pickShopIds,
  PREFETCH_INTERVAL_MS,
  qarzlarUrl,
  RESERVED_ENTRIES,
  shouldPrefetch,
  throttleKey,
} from '../src/offline/prefetchPlan';
import { CACHE_LIMITS, normalizeUrl } from '../src/offline/responseCache';

const BASE = 'https://app.zerox.uz/api/v1';

describe('prefetch URL rejasi', () => {
  test('do‘kon tanlangan: dashboard/qarzlar URL’lari ekrandagi bilan bir xil kesh kalitida', () => {
    const urls = buildBaseUrls(BASE, 5).map(normalizeUrl);
    // QarzDaftari.tsx: `${URL}/qarz-daftari/dashboard${shopQuery('?')}`
    expect(urls).toContain(normalizeUrl(`${BASE}/qarz-daftari/dashboard?faoliyat_id=5`));
    expect(urls).toContain(normalizeUrl(`${BASE}/qarz-daftari/near-expiration?faoliyat_id=5`));
    expect(urls).toContain(normalizeUrl(`${BASE}/qarz-daftari/savdo-faoliyat`));
    // QarzDaftariQarzlar.tsx: turi, status, faoliyat_id tartibida
    expect(urls).toContain(normalizeUrl(`${BASE}/qarz-daftari/qarzlar?turi=berish&faoliyat_id=5`));
    expect(urls).toContain(normalizeUrl(`${BASE}/qarz-daftari/qarzlar?turi=olish&status=muddati-otgan&faoliyat_id=5`));
    expect(urls).toHaveLength(7);
  });

  test('do‘kon tanlanmagan (yoki xodim sessiyasi): filtrsiz URL’lar', () => {
    const urls = buildBaseUrls(BASE, null);
    expect(urls).toContain(`${BASE}/qarz-daftari/dashboard`);
    expect(urls).toContain(`${BASE}/qarz-daftari/qarzlar?turi=berish`);
    expect(urls.some(u => u.includes('faoliyat_id'))).toBe(false);
  });

  test('qarzlarUrl va tarix URL’i', () => {
    expect(qarzlarUrl(BASE, 'olish', 'muddati-otgan', null)).toBe(
      `${BASE}/qarz-daftari/qarzlar?turi=olish&status=muddati-otgan`,
    );
    expect(historyUrl(BASE, 42)).toBe(`${BASE}/qarz-daftari/mijozlar/42/history`);
  });

  test('mijozlar ro‘yxatlari — har do‘kon uchun berish va olish', () => {
    expect(buildMijozlarUrls(BASE, [3])).toEqual([
      `${BASE}/qarz-daftari/savdo-faoliyat/3/mijozlar?turi=berish`,
      `${BASE}/qarz-daftari/savdo-faoliyat/3/mijozlar?turi=olish`,
    ]);
  });
});

describe('pickShopIds', () => {
  const shops = [{ id: 1 }, { id: '2' }, { id: 3 }, { id: null }];
  test('tanlangan do‘kon ro‘yxatda bo‘lsa — faqat u', () => {
    expect(pickShopIds(shops, 2)).toEqual([2]);
  });
  test('tanlov yo‘q / ro‘yxatda yo‘q — barcha do‘konlar (chegara bilan)', () => {
    expect(pickShopIds(shops, null)).toEqual([1, 2, 3]);
    expect(pickShopIds(shops, 99, 2)).toEqual([1, 2]);
    expect(pickShopIds(undefined as any, null)).toEqual([]);
  });
});

describe('pickHistoryIds', () => {
  test('faqat aktiv qarzlilar, takrorsiz, eng ko‘p qarzdor birinchi, temp id yo‘q', () => {
    const berish = [
      { id: 1, qoldiq_uzs: 100_000, aktiv_qarz_soni: 1 },
      { id: 2, qoldiq_uzs: 0, aktiv_qarz_soni: 0 }, // qarzsiz
      { id: 3, qoldiq_usd: 100 }, // 100 USD ≈ 1 250 000 UZS
      { id: -4, qoldiq_uzs: 9_999_999 }, // temp
    ];
    const olish = [
      { id: 1, qoldiq_uzs: 500_000 }, // 1-mijoz olishda ko'proq
      { id: 5, aktiv_qarz_soni: 2 }, // aktiv, summa noma'lum
    ];
    expect(pickHistoryIds([berish, olish], 10)).toEqual([3, 1, 5]);
  });
  test('cap', () => {
    const list = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, qoldiq_uzs: 1000 }));
    // teng summa — yangisi (katta id) birinchi
    expect(pickHistoryIds([list], 3)).toEqual([10, 9, 8]);
    expect(pickHistoryIds([list], 0)).toEqual([]);
  });
});

describe('historyCap', () => {
  test('kesh yozuvlari chegarasiga sig‘adi', () => {
    expect(historyCap(11)).toBe(Math.min(HISTORY_CAP, CACHE_LIMITS.maxEntries - 11 - RESERVED_ENTRIES));
    expect(historyCap(11)).toBeLessThan(CACHE_LIMITS.maxEntries);
    expect(historyCap(10, 10_000)).toBe(HISTORY_CAP);
    expect(historyCap(10, 250)).toBe(250 - 10 - RESERVED_ENTRIES);
    expect(historyCap(500, 250)).toBe(0);
  });
});

describe('throttle', () => {
  const now = 1_700_000_000_000;
  test('hech qachon ishlamagan — ishlaydi', () => {
    expect(shouldPrefetch(undefined, now, PREFETCH_INTERVAL_MS)).toBe(true);
  });
  test('30 daqiqa ichida — yo‘q; keyin — ha', () => {
    expect(shouldPrefetch(now - 10 * 60_000, now, PREFETCH_INTERVAL_MS)).toBe(false);
    expect(shouldPrefetch(now - PREFETCH_INTERVAL_MS, now, PREFETCH_INTERVAL_MS)).toBe(true);
  });
  test('soat orqaga ketgan — ishlaydi (abadiy bloklanmaydi)', () => {
    expect(shouldPrefetch(now + 60_000, now, PREFETCH_INTERVAL_MS)).toBe(true);
  });
  test('kalit aktor + do‘kon bo‘yicha', () => {
    expect(throttleKey('7:0', 5)).toBe('7:0|5');
    expect(throttleKey('7:0', null)).toBe('7:0|all');
  });
});

describe('oflayn telefon dublikati (findByPhone)', () => {
  const lists = [
    [{ id: 1, fish: 'Ali', telefon: '+998 90 123 45 67', qoldiq_uzs: 5000 }],
    [{ id: -2, fish: 'Vali', telefon: '+998931112233' }],
  ];
  test('+998 va bo‘shliqlarsiz solishtiradi', () => {
    expect(phoneKey('+998 90 123-45-67')).toBe('901234567');
    expect(findByPhone(lists, '901234567')).toMatchObject({ id: 1, fish: 'Ali', qoldiq_uzs: 5000 });
  });
  test('navbatdagi (temp) mijoz ham topiladi', () => {
    expect(findByPhone(lists, '931112233')).toMatchObject({ id: -2, fish: 'Vali' });
  });
  test('topilmasa / to‘liq bo‘lmagan raqam — null', () => {
    expect(findByPhone(lists, '991112233')).toBeNull();
    expect(findByPhone(lists, '90123')).toBeNull();
  });
});
