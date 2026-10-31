import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockToast = jest.fn();
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));

import { apiErrorMessage, useApiAction } from '../src/hooks/useApiAction';

let api!: ReturnType<typeof useApiAction>;
const Probe = () => {
  api = useApiAction();
  return null;
};
const mount = () => {
  act(() => {
    TestRenderer.create(<Probe />);
  });
};
beforeEach(() => mockToast.mockClear());

describe('apiErrorMessage', () => {
  test('server xabari, aks holda zaxira', () => {
    expect(apiErrorMessage({ response: { data: { message: 'Band' } } })).toBe('Band');
    expect(apiErrorMessage({ response: { data: {} } })).toBe('Xatolik yuz berdi');
    expect(apiErrorMessage(new Error('x'), 'Zaxira')).toBe('Zaxira');
    expect(apiErrorMessage(null)).toBe('Xatolik yuz berdi');
    expect(apiErrorMessage({ response: { data: { message: '' } } }, 'Z')).toBe('Z');
  });
});

describe('useApiAction', () => {
  test('muvaffaqiyat: natija, loading o\'zgarishi, caller matni bilan toast, onSuccess toast\'dan keyin', async () => {
    mount();
    const order: string[] = [];
    mockToast.mockImplementation(() => order.push('toast'));
    let res: any;
    let pending!: Promise<any>;
    await act(async () => {
      pending = api.run(async () => 42, { success: n => `OK ${n}`, onSuccess: () => order.push('onSuccess') });
      res = await pending;
    });
    expect(res).toEqual({ ok: true, data: 42 });
    expect(order).toEqual(['toast', 'onSuccess']);
    expect(mockToast).toHaveBeenCalledWith({ type: 'omad', props: { desc: 'OK 42' } });
    expect(api.loading).toBe(false);
  });

  test('xato: error2 toast (matn/funksiya), visibilityTime faqat berilganda; xato qaytariladi, tashlanmaydi', async () => {
    mount();
    const boom = { response: { data: { message: 'Mumkin emas' } } };
    let res: any;
    await act(async () => {
      res = await api.run(async () => { throw boom; }, { error: e => apiErrorMessage(e) });
    });
    expect(res).toEqual({ ok: false, error: boom });
    expect(mockToast).toHaveBeenLastCalledWith({ type: 'error2', props: { desc: 'Mumkin emas' } });
    await act(async () => {
      await api.run(async () => { throw boom; }, { error: 'Qat\'iy', errorVisibilityTime: 5000 });
    });
    expect(mockToast).toHaveBeenLastCalledWith({ type: 'error2', visibilityTime: 5000, props: { desc: 'Qat\'iy' } });
  });

  test('matn berilmasa toast yo\'q; onSuccess ichidagi xato error toast\'ga tushadi', async () => {
    mount();
    await act(async () => {
      await api.run(async () => 1);
      await api.run(async () => { throw new Error('x'); });
    });
    expect(mockToast).not.toHaveBeenCalled();
    await act(async () => {
      await api.run(async () => 1, { error: 'Xato', onSuccess: () => { throw new Error('nav'); } });
    });
    expect(mockToast).toHaveBeenCalledWith({ type: 'error2', props: { desc: 'Xato' } });
  });

  test('bajarilayotganda ikkinchi run — undefined (fn chaqirilmaydi); loading true -> false', async () => {
    mount();
    let release!: () => void;
    const first = jest.fn(() => new Promise<void>(r => { release = r; }));
    const second = jest.fn(async () => 1);
    let p1!: Promise<any>;
    await act(async () => {
      p1 = api.run(first);
    });
    expect(api.loading).toBe(true);
    let r2: any = 'x';
    await act(async () => {
      r2 = await api.run(second);
    });
    expect(r2).toBeUndefined();
    expect(second).not.toHaveBeenCalled();
    await act(async () => {
      release();
      await p1;
    });
    expect(api.loading).toBe(false);
    await act(async () => {
      await api.run(second);
    });
    expect(second).toHaveBeenCalledTimes(1);
  });
});
