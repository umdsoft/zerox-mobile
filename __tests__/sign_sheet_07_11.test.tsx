/**
 * 07.11 — elektron imzo (bir martalik kod): signFlow (challenge API, xato tasnifi, global oyna holati)
 * va SignSheet oqimi (rozilik -> "Kod olish" -> kod -> asosiy endpoint `sign` bilan; SIGN_* xatolari).
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockPost = jest.fn();
const mockToast = jest.fn();
jest.mock('axios', () => ({ __esModule: true, default: { post: (...a: unknown[]) => mockPost(...a) } }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
const tr = (k: string, o?: any) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n]));
jest.mock('i18next', () => ({ t: (k: string, o?: any) => k.replace(/\{\{(\w+)\}\}/g, (_m: string, n: string) => String(o?.[n])) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: any) => k.replace(/\{\{(\w+)\}\}/g, (_m: string, n: string) => String(o?.[n])) }),
}));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));

import SignSheet from '../src/screens/components/SignSheet';
import {
  classifySignError,
  signAndSend,
  signDate,
  signMoney,
  SignRequest,
} from '../src/helper/sign/signFlow';
import { classifyContractActionError } from '../src/helper/contractActionError';

const CH = { success: true, challenge_id: 'ch1', channel: 'telegram', destination_masked: '+998 ** *** ** 12', expires_in: 300, doc_hash: 'h' };
const headers = { headers: { Authorization: 'Bearer tok' } };
const err = (status: number, data: any) => ({ response: { status, data } });

const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const byId = (r: TestRenderer.ReactTestRenderer, id: string) => r.root.findAll(n => n.props.testID === id && typeof n.type !== 'string')[0] ?? r.root.findAll(n => n.props.testID === id)[0];
const has = (r: TestRenderer.ReactTestRenderer, id: string) => r.root.findAll(n => n.props.testID === id).length > 0;
const allText = (r: TestRenderer.ReactTestRenderer) => textOf(r.toJSON() as any);

const press = async (r: TestRenderer.ReactTestRenderer, id: string) => {
  await act(async () => {
    byId(r, id).props.onPress();
  });
  await act(async () => {
    await Promise.resolve();
  });
};
const typeCode = async (r: TestRenderer.ReactTestRenderer, v: string) => {
  await act(async () => {
    byId(r, 'sign-code').props.onChangeText(v);
  });
  await act(async () => {
    await Promise.resolve();
  });
};

const mkReq = (send: jest.Mock): SignRequest<any> => ({
  purpose: 'debt_extend',
  target: { contract: 5, payload: { contract: 5, end_date: '2027-01-01' } },
  summary: { docType: 'Qarz muddatini uzaytirish', number: 'N-5', lender: 'Ali', borrower: 'Vali', amount: '1 000', currency: 'UZS', dueDate: '01.01.2027' },
  send,
});

let r: TestRenderer.ReactTestRenderer;
const mountSheet = async () => {
  await act(async () => {
    r = TestRenderer.create(<SignSheet />);
  });
};
/** Oynani ochadi, rozilik + "Kod olish" (challenge muvaffaqiyatli). */
const openToCode = async (send: jest.Mock) => {
  const p = signAndSend(mkReq(send));
  const out = { settled: false, value: undefined as any, error: undefined as any };
  p.then(v => { out.settled = true; out.value = v; }, e => { out.settled = true; out.error = e; });
  await act(async () => {
    await Promise.resolve();
  });
  mockPost.mockResolvedValueOnce({ data: CH });
  await press(r, 'sign-agree');
  await press(r, 'sign-get-code');
  return out;
};

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-07T10:00:00Z') });
  mockPost.mockReset();
  mockToast.mockReset();
});
afterEach(() => {
  if (r) act(() => r.unmount());
  jest.useRealTimers();
});

describe('signFlow', () => {
  test('oyna o\'rnatilmagan bo\'lsa — xato (amal kodsiz yuborilmaydi)', async () => {
    await expect(signAndSend(mkReq(jest.fn()))).rejects.toThrow('sign-sheet-not-mounted');
  });

  test.each([
    [err(400, { code: 'SIGN_INVALID', attempts_left: 3 }), { kind: 'invalid', attemptsLeft: 3 }],
    [err(410, { code: 'SIGN_EXPIRED' }), { kind: 'expired' }],
    [err(429, { code: 'SIGN_LOCKED' }), { kind: 'locked' }],
    [err(409, { code: 'SIGN_DOC_CHANGED' }), { kind: 'doc_changed' }],
    [err(428, { code: 'SIGN_REQUIRED', purpose: 'x' }), { kind: 'required' }],
    [err(428, {}), { kind: 'required' }],
    [err(403, { code: 'FORBIDDEN', msg: 'only-lender' }), null],
    [new Error('net'), null],
  ])('classifySignError %#', (e, expected) => {
    expect(classifySignError(e)).toEqual(expected);
  });

  test('contractActionError: SIGN_* kodlari aniq matnga', () => {
    expect(classifyContractActionError(err(428, { code: 'SIGN_REQUIRED' })).message).toBe('Bu amal elektron imzo talab qiladi');
    expect(classifyContractActionError(err(429, { code: 'SIGN_LOCKED' })).message).toBe('Urinishlar tugadi, keyinroq urinib ko‘ring');
    expect(classifyContractActionError(err(409, { code: 'SIGN_DOC_CHANGED', msg: 'x' })).message).toBe('Hujjat o‘zgargan, qaytadan oching');
  });

  test('signMoney / signDate', () => {
    expect(signMoney(1500000)).toBe('1 500 000');
    expect(signMoney('655.77')).toBe('655,77');
    expect(signMoney(null)).toBeUndefined();
    expect(signDate('2027-01-01')).toBe('01.01.2027');
    expect(signDate('xyz')).toBeUndefined();
    expect(signDate(undefined)).toBeUndefined();
  });
});

describe('SignSheet', () => {
  test('to\'liq oqim: shartlar -> rozilik majburiy -> challenge -> kod -> send(sign)', async () => {
    await mountSheet();
    const send = jest.fn().mockResolvedValue({ status: 201, data: { success: true } });
    const p = signAndSend(mkReq(send));
    await act(async () => {
      await Promise.resolve();
    });
    const txt = allText(r);
    for (const s of ['Elektron imzo', 'Qarz muddatini uzaytirish №N-5', 'Ali', 'Vali', '1 000 UZS', '01.01.2027']) {
      expect(txt).toContain(s);
    }
    // rozilik belgisisiz "Kod olish" o'chiq
    expect(byId(r, 'sign-get-code').props.disabled).toBe(true);
    await press(r, 'sign-agree');
    expect(byId(r, 'sign-get-code').props.disabled).toBe(false);
    mockPost.mockResolvedValueOnce({ data: CH });
    await press(r, 'sign-get-code');
    expect(mockPost).toHaveBeenCalledWith(
      'http://x/sign/challenge',
      { purpose: 'debt_extend', contract: 5, payload: { contract: 5, end_date: '2027-01-01' } },
      headers,
    );
    expect(allText(r)).toContain(tr('Kod Telegram orqali {{dest}} ga yuborildi', { dest: '+998 ** *** ** 12' }));
    expect(allText(r)).toContain('Kod amal qilish muddati: 5:00');
    const input = byId(r, 'sign-code');
    expect(input.props.textContentType).toBe('oneTimeCode');
    expect(input.props.maxLength).toBe(6);
    expect(input.props.keyboardType).toBe('number-pad');
    // qayta yuborish 60 s o'tmaguncha o'chiq
    expect(byId(r, 'sign-resend').props.disabled).toBe(true);
    await typeCode(r, '12 34a56');
    expect(send).toHaveBeenCalledWith({ challenge_id: 'ch1', code: '123456' });
    await expect(p).resolves.toEqual({ status: 201, data: { success: true } });
    expect(has(r, 'sign-sheet')).toBe(false);
  });

  test('SMS kanal matni; 60 s dan keyin qayta yuborish yangi challenge so\'raydi', async () => {
    await mountSheet();
    const p = signAndSend(mkReq(jest.fn()));
    await act(async () => {
      await Promise.resolve();
    });
    mockPost.mockResolvedValueOnce({ data: { ...CH, channel: 'sms' } });
    await press(r, 'sign-agree');
    await press(r, 'sign-get-code');
    expect(allText(r)).toContain(tr('Kod SMS orqali {{dest}} ga yuborildi', { dest: '+998 ** *** ** 12' }));
    await act(async () => {
      jest.advanceTimersByTime(61000);
    });
    expect(byId(r, 'sign-resend').props.disabled).toBe(false);
    expect(allText(r)).toContain('Kod amal qilish muddati: 3:59');
    mockPost.mockResolvedValueOnce({ data: { ...CH, challenge_id: 'ch2' } });
    await press(r, 'sign-resend');
    expect(mockPost).toHaveBeenCalledTimes(2);
    await press(r, 'sign-cancel');
    await expect(p).resolves.toBeNull();
  });

  test('SIGN_INVALID: "N urinish qoldi", oyna qoladi; keyingi kod muvaffaqiyatli', async () => {
    await mountSheet();
    const send = jest
      .fn()
      .mockRejectedValueOnce(err(400, { success: false, code: 'SIGN_INVALID', attempts_left: 3 }))
      .mockResolvedValueOnce({ data: { success: true } });
    const out = await openToCode(send);
    await typeCode(r, '111111');
    expect(textOf(byId(r, 'sign-error'))).toBe(tr('Kod noto‘g‘ri, {{n}} urinish qoldi', { n: 3 }));
    expect(byId(r, 'sign-code').props.value).toBe('');
    expect(out.settled).toBe(false);
    await typeCode(r, '222222');
    expect(send).toHaveBeenLastCalledWith({ challenge_id: 'ch1', code: '222222' });
    expect(out.value).toEqual({ data: { success: true } });
  });

  test('SIGN_EXPIRED: xabar, qayta yuborish darhol mumkin', async () => {
    await mountSheet();
    const send = jest.fn().mockRejectedValueOnce(err(410, { code: 'SIGN_EXPIRED' }));
    const out = await openToCode(send);
    await typeCode(r, '111111');
    expect(allText(r)).toContain('Kod muddati o‘tdi, qaytadan oling');
    expect(byId(r, 'sign-resend').props.disabled).toBe(false);
    expect(out.settled).toBe(false);
  });

  test.each([
    ['SIGN_LOCKED', 429, 'Urinishlar tugadi, keyinroq urinib ko‘ring'],
    ['SIGN_DOC_CHANGED', 409, 'Hujjat o‘zgargan, qaytadan oching'],
  ])('%s: oyna yopiladi (null) + toast', async (code, status, msg) => {
    await mountSheet();
    const send = jest.fn().mockRejectedValueOnce(err(status as number, { code }));
    const out = await openToCode(send);
    await typeCode(r, '111111');
    expect(out.value).toBeNull();
    expect(mockToast.mock.calls.pop()[0].props.desc).toBe(msg);
    expect(has(r, 'sign-sheet')).toBe(false);
  });

  test('imzoga aloqasiz xato (403 only-lender) — ekranga qaytariladi (reject)', async () => {
    await mountSheet();
    const e = err(403, { code: 'FORBIDDEN', msg: 'only-lender' });
    const out = await openToCode(jest.fn().mockRejectedValueOnce(e));
    await typeCode(r, '111111');
    expect(out.error).toBe(e);
  });

  test('challenge rad etildi — oyna yopiladi, xato ekranga', async () => {
    await mountSheet();
    const caught = signAndSend(mkReq(jest.fn())).then(() => 'resolved', x => x);
    await act(async () => {
      await Promise.resolve();
    });
    const e = err(403, { code: 'FORBIDDEN', msg: 'only-lender' });
    mockPost.mockRejectedValueOnce(e);
    await press(r, 'sign-agree');
    await press(r, 'sign-get-code');
    await expect(caught).resolves.toBe(e);
    expect(has(r, 'sign-sheet')).toBe(false);
  });

  test('bekor qilish — null, send chaqirilmaydi', async () => {
    await mountSheet();
    const send = jest.fn();
    const p = signAndSend(mkReq(send));
    await act(async () => {
      await Promise.resolve();
    });
    await press(r, 'sign-cancel');
    await expect(p).resolves.toBeNull();
    expect(send).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });
});
