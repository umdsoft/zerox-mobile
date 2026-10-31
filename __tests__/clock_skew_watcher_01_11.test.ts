/**
 * 01.11: installClockSkewWatcherOn(client) — WeakSet-himoyali o'rnatuvchi (bir instansiyaga bir marta)
 * va isOwnApi: nisbiy URL + baseURL, protokolsiz '//host', prefiks-aldovga (…zerox.uz.evil.com) chidamli.
 */
jest.mock('../src/screens/constants', () => ({ URL: 'https://app.zerox.uz/api/v1' }));

import axios from 'axios';
import { installClockSkewWatcherOn, isOwnApi } from '../src/helper/clockSkew';

const BASE = 'https://app.zerox.uz/api/v1';

describe('isOwnApi', () => {
  test('mutlaq URL: origin solishtiriladi', () => {
    expect(isOwnApi({ url: `${BASE}/home/my` })).toBe(true);
    expect(isOwnApi({ url: 'https://APP.zerox.uz/x' })).toBe(true);
    expect(isOwnApi({ url: 'http://app.zerox.uz/x' })).toBe(false); // sxema boshqa
    expect(isOwnApi({ url: 'https://app.zerox.uz.evil.com/x' })).toBe(false); // prefiks-aldov
    expect(isOwnApi({ url: 'https://evil.com/https://app.zerox.uz' })).toBe(false);
    expect(isOwnApi({ url: 'https://app.zerox.uz:8443/x' })).toBe(false); // port boshqa
  });
  test('protokolsiz //host: axios buni mutlaq deb biladi (baseURL e\'tiborsiz)', () => {
    expect(isOwnApi({ url: '//app.zerox.uz/api/v1/x' })).toBe(true);
    expect(isOwnApi({ url: '//evil.com/x', baseURL: BASE })).toBe(false);
    expect(isOwnApi({ url: '//app.zerox.uz.evil.com/x', baseURL: BASE })).toBe(false);
  });
  test('nisbiy URL: baseURL orqali', () => {
    expect(isOwnApi({ url: '/home/my', baseURL: BASE })).toBe(true);
    expect(isOwnApi({ url: 'home/my', baseURL: BASE })).toBe(true);
    expect(isOwnApi({ url: '/home/my', baseURL: 'https://evil.com' })).toBe(false);
    expect(isOwnApi({ url: '/home/my', baseURL: '//app.zerox.uz/api/v1' })).toBe(true);
    expect(isOwnApi({ url: '/home/my' })).toBe(false); // baseURL yo'q — noma'lum
  });
  test('noto\'g\'ri turlar', () => {
    expect(isOwnApi({ url: undefined })).toBe(false);
    expect(isOwnApi(undefined)).toBe(false);
    expect(isOwnApi({ url: 42 as any })).toBe(false);
  });
});

describe('installClockSkewWatcherOn', () => {
  test('bir instansiyaga FAQAT bir marta (WeakSet), boshqa instansiyaga alohida', () => {
    const a = axios.create({ baseURL: BASE });
    const b = axios.create({ baseURL: BASE });
    const reqA = jest.spyOn(a.interceptors.request, 'use');
    const resA = jest.spyOn(a.interceptors.response, 'use');
    const reqB = jest.spyOn(b.interceptors.request, 'use');
    installClockSkewWatcherOn(a);
    installClockSkewWatcherOn(a);
    installClockSkewWatcherOn(a);
    expect(reqA).toHaveBeenCalledTimes(1);
    expect(resA).toHaveBeenCalledTimes(1);
    installClockSkewWatcherOn(b);
    expect(reqB).toHaveBeenCalledTimes(1);
  });

  test('so\'rovga __clockSentAt qo\'yiladi; javob/xato sarlavhasi o\'qiladi va xato qayta tashlanadi', async () => {
    const c = axios.create({ baseURL: BASE });
    installClockSkewWatcherOn(c);
    let seen: any;
    c.defaults.adapter = async (config: any) => {
      seen = config;
      return { data: {}, status: 200, statusText: 'OK', headers: { date: new Date().toUTCString() }, config } as any;
    };
    await c.get('/ping');
    expect(typeof seen.__clockSentAt).toBe('number');

    c.defaults.adapter = async (config: any) => {
      const err: any = new Error('boom');
      err.response = { status: 500, headers: {}, config, data: {} };
      throw err;
    };
    await expect(c.get('/ping')).rejects.toThrow('boom');
  });
});
