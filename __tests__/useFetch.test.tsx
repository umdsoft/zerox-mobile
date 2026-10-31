import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';

const mockAxios = jest.fn();
jest.mock('axios', () => ({
  __esModule: true,
  default: Object.assign((...a: unknown[]) => mockAxios(...a), {isCancel: () => false}),
}));
jest.mock('../src/store/api/token/getToken', () => ({storage: {getString: () => 'tok'}}));

import {useFetch, clearFetchCache, invalidateFetchCache} from '../src/hooks/useFetch';

let latest: any;
const Probe = ({url}: {url: string}) => {
  latest = useFetch({url, method: 'GET'});
  return null;
};
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const mount = async (url: string) => {
  let r: any;
  await act(async () => { r = TestRenderer.create(<Probe url={url} />); });
  await flush();
  return r;
};

beforeEach(() => {
  clearFetchCache();
  mockAxios.mockReset();
  latest = undefined;
});

test('url bor, kesh yo\'q -> birinchi renderdanoq loading=true', async () => {
  mockAxios.mockReturnValue(new Promise(() => {}));
  let first: any;
  const Spy = () => { first = first ?? useFetch({url: '/a', method: 'GET'}); return null; };
  await act(async () => { TestRenderer.create(<Spy />); });
  expect(first.loading).toBe(true);
});

test('url bo\'sh -> loading=false, so\'rov yo\'q', async () => {
  await mount('');
  expect(latest.loading).toBe(false);
  expect(mockAxios).not.toHaveBeenCalled();
});

test('javobdan keyin loading=false va data', async () => {
  mockAxios.mockResolvedValue({status: 200, data: {n: 1}});
  await mount('/b');
  expect(latest.loading).toBe(false);
  expect(latest.data).toEqual({n: 1});
});

test('onRefresh 30s keshni va in-flight dedupe\'ni chetlab o\'tadi', async () => {
  mockAxios.mockResolvedValueOnce({status: 200, data: {n: 1}});
  await mount('/c');
  expect(mockAxios).toHaveBeenCalledTimes(1);
  mockAxios.mockResolvedValueOnce({status: 200, data: {n: 2}});
  await act(async () => { latest.onRefresh({}); });
  await flush();
  expect(mockAxios).toHaveBeenCalledTimes(2);
  expect(latest.data).toEqual({n: 2});
});

test('refresh({force:true}) ham ishlaydi', async () => {
  mockAxios.mockResolvedValueOnce({status: 200, data: 1});
  await mount('/d');
  mockAxios.mockResolvedValueOnce({status: 200, data: 2});
  await act(async () => { latest.refresh({force: true}); });
  await flush();
  expect(latest.data).toBe(2);
});

test('invalidateFetchCache prefiks bo\'yicha keshni tozalaydi', async () => {
  mockAxios.mockResolvedValue({status: 200, data: 'x'});
  await mount('/e/1');
  invalidateFetchCache('/e');
  // yangi mount keshdan boshlamaydi -> loading=true
  let first: any;
  const Spy = () => { first = first ?? useFetch({url: '/e/1', method: 'GET'}); return null; };
  await act(async () => { TestRenderer.create(<Spy />); });
  expect(first.loading).toBe(true);
});

test('onRefresh uchib yurgan (pending) so\'rovni ulashmaydi; eski javob data va keshni bosib o\'tmaydi', async () => {
  let resolveStale: (v: any) => void = () => {};
  mockAxios.mockImplementationOnce(() => new Promise(res => { resolveStale = res; }));
  await mount('/f');
  expect(mockAxios).toHaveBeenCalledTimes(1);
  mockAxios.mockResolvedValueOnce({status: 200, data: 'fresh'});
  await act(async () => { latest.onRefresh({}); });
  await flush();
  expect(mockAxios).toHaveBeenCalledTimes(2);
  expect(latest.data).toBe('fresh');
  await act(async () => { resolveStale({status: 200, data: 'stale'}); });
  await flush();
  expect(latest.data).toBe('fresh');
  // keshga ham stale yozilmagan: yangi mount darhol 'fresh' bilan boshlanadi
  let first: any;
  const Spy = () => { first = first ?? useFetch({url: '/f', method: 'GET'}); return null; };
  await act(async () => { TestRenderer.create(<Spy />); });
  expect(first.data).toBe('fresh');
});

test('url bo\'shga o\'tsa loading qolib ketmaydi', async () => {
  mockAxios.mockReturnValue(new Promise(() => {}));
  let r: any;
  await act(async () => { r = TestRenderer.create(<Probe url="/g" />); });
  expect(latest.loading).toBe(true);
  await act(async () => { r.update(<Probe url="" />); });
  expect(latest.loading).toBe(false);
});
