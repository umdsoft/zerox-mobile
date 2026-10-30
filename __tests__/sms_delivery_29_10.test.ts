/**
 * Yetkazilmagan SMS: sana/tur/sabab xaritalari, sahifalash qo'shilishi va so'rov parametrlari.
 */
import { fmtDateTimeUz } from '../src/helper';
import {
  debtRouteParams,
  smsScreenParams,
  mergeSmsRows,
  smsParams,
  smsReason,
  smsTypeCode,
} from '../src/screens/home/modules/components/smsDeliveryFormat';

describe('smsDeliveryFormat', () => {
  test('sana DD.MM.YYYY HH:mm (UTC+5)', () => {
    expect(fmtDateTimeUz('2026-10-25T10:05:00Z')).toBe('25.10.2026 15:05');
    expect(fmtDateTimeUz(null)).toBe('');
  });

  test('sms turi: noma\'lum -> other', () => {
    expect(smsTypeCode('registration')).toBe('registration');
    expect(smsTypeCode('payment_link')).toBe('payment_link');
    expect(smsTypeCode('zzz')).toBe('other');
    expect(smsTypeCode(undefined)).toBe('other');
  });

  test('sabab: operator yetkazmadi + raw tafsilot', () => {
    expect(smsReason({ state: 'undelivered', raw: 'undeliv' })).toEqual({ kind: 'operator', detail: 'undeliv' });
    expect(smsReason({ state: 'undelivered', raw: 'REJECTD' })).toEqual({ kind: 'operator', detail: 'rejected' });
    expect(smsReason({ state: 'undelivered', raw: 'x' })).toEqual({ kind: 'operator', detail: null });
  });

  test('sabab: yuborilmadi + kod', () => {
    expect(smsReason({ state: 'failed', reason: 'NO_PACKAGE' })).toEqual({ kind: 'failed', code: 'NO_PACKAGE' });
    expect(smsReason({ state: 'failed', reason: 'weird' })).toEqual({ kind: 'failed', code: 'other' });
  });

  test('mergeSmsRows id bo\'yicha takrorsiz', () => {
    const merged = mergeSmsRows([{ id: 1 }, { id: 2 }], [{ id: 2 }, { id: 3 }]);
    expect(merged.map(r => r.id)).toEqual([1, 2, 3]);
  });

  test('smsParams: faoliyat_id faqat do\'kon tanlanganda', () => {
    expect(smsParams(2, null)).toEqual({ days: 7, scope: 'period', page: 2, limit: 20 });
    expect(smsParams(1, 5)).toEqual({ days: 7, scope: 'period', page: 1, limit: 20, faoliyat_id: 5 });
  });

  test('debtRouteParams: qarz_id bo\'lsa {id}, aks holda null', () => {
    expect(debtRouteParams(101)).toEqual({ id: 101 });
    expect(debtRouteParams(null)).toBeNull();
    expect(debtRouteParams(undefined)).toBeNull();
  });

  test('smsScreenParams: shopId yo\'q/0 -> null', () => {
    expect(smsScreenParams(7)).toEqual({ shopId: 7 });
    expect(smsScreenParams(0)).toEqual({ shopId: null });
    expect(smsScreenParams(null)).toEqual({ shopId: null });
  });
});
