/** 30.10: SMS pul (tarif/paket) yordamchilari, yetkazilmagan belgisi, bildirishnoma payload parseri. */
import { categoryPools, mapType, poolLine, toPair, toPools } from '../src/screens/home/drawer/drawerScreens/smsPools';
import { isSmsUndelivered, smsFailureText } from '../src/screens/home/modules/components/smsDeliveryFormat';

jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/screens/components/NotificationShell', () => ({ __esModule: true, default: () => null, NotifButton: () => null }));
jest.mock('../src/screens/home/modules/qarzAmaliyot', () => ({ openCreationAmaliyot: jest.fn() }));
jest.mock('../src/theme/rd', () => ({
  rd: { color: new Proxy({}, { get: () => '#000' }), font: new Proxy({}, { get: () => 'F' }), radius: new Proxy({}, { get: () => 8 }) },
  rs: (n: number) => n,
}));
jest.mock('../src/theme/style', () => ({ style: { fontSize: { xx: 14 } } }));

import { parseSmsUndelivered } from '../src/screens/home/notifications/all/SmsUndelivered';

const L = { plan: 'Tarif', package: 'Paket' };

describe('smsPools', () => {
  test('toPools: pools yo\'q (eski backend) -> hasSplit=false', () => {
    expect(toPools({ total: 10 }).hasSplit).toBe(false);
    expect(toPools(null).hasSplit).toBe(false);
  });
  test('toPools: plan+package o\'qiladi', () => {
    const p = toPools({ pools: { plan: { total: 100, used: 10, remaining: 90 }, package: { total: 50, used: 5, remaining: 45 } } });
    expect(p.hasSplit).toBe(true);
    expect(p.plan.remaining).toBe(90);
    expect(p.package.used).toBe(5);
  });
  test('poolLine: Tarif doim, Paket faqat > 0; pair yo\'q -> undefined', () => {
    expect(poolLine({ plan: 7, package: 3 }, L)).toBe('Tarif 7 · Paket 3');
    expect(poolLine({ plan: 7, package: 0 }, L)).toBe('Tarif 7');
    expect(poolLine(null, L)).toBeUndefined();
  });
  test('toPair / categoryPools: turlar kategoriyaga yig\'iladi', () => {
    expect(toPair(undefined)).toBeNull();
    const c = categoryPools({ registration: { plan: 2, package: 1 }, auto: { plan: 4, package: 0 }, qarz_tolandi: { plan: 1, package: 1 } });
    expect(c).toEqual({ register: { plan: 2, package: 1 }, due: { plan: 4, package: 0 }, paid: { plan: 1, package: 1 } });
    expect(categoryPools(undefined)).toBeNull();
    expect(mapType('manual')).toBe('demand');
  });
});

describe('yetkazilmagan belgisi', () => {
  test('isSmsUndelivered', () => {
    expect(isSmsUndelivered({ delivery_status: 'undelivered' })).toBe(true);
    expect(isSmsUndelivered({ delivery_status: 'rejected' })).toBe(true);
    expect(isSmsUndelivered({ status: 'failed' })).toBe(true);
    expect(isSmsUndelivered({ status: 'sent', delivery_status: 'delivered' })).toBe(false);
    expect(isSmsUndelivered(null)).toBe(false);
  });
  test('smsFailureText: kodlar -> sabab; noma\'lum/null -> umumiy', () => {
    const t = (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n]));
    expect(smsFailureText(t, 'blocked')).toBe('Operator yetkazmadi — raqam bloklangan');
    expect(smsFailureText(t, 'invalid_number')).toBe('Yuborilmadi: telefon raqami noto‘g‘ri');
    expect(smsFailureText(t, null)).toBe('Operator yetkazmadi');
  });
});

describe('parseSmsUndelivered', () => {
  test('to\'g\'ridan-to\'g\'ri maydonlar', () => {
    expect(parseSmsUndelivered({ contract: null, ud_qarz_id: 55, failure_reason: 'blocked', ud_mijoz: ' Ali ' })).toEqual({ qarzId: 55, reason: 'blocked', name: 'Ali' });
  });
  test('JSON payload ichidan', () => {
    expect(parseSmsUndelivered({ payload: JSON.stringify({ qarz_id: 9, reason: 'invalid_number' }) })).toEqual({ qarzId: 9, reason: 'invalid_number', name: '' });
  });
  test('bo\'sh/yaroqsiz kirish yiqilmaydi', () => {
    expect(parseSmsUndelivered(null)).toEqual({ qarzId: null, reason: null, name: '' });
    expect(parseSmsUndelivered({ payload: '{bad' }).qarzId).toBeNull();
  });
});
