/**
 * 01.11: useCountdown (RecoverySmsReset "qayta yuborish" taymeri) deadline (Date.now) asosida:
 * fonda tick'lar to'xtab, tizim vaqti sakrasa ham qolgan vaqt aniq.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useCountdown } from '../src/hooks/useCountdown';

const START = new Date('2026-11-01T10:00:00Z');
let api!: ReturnType<typeof useCountdown>;
const onDone = jest.fn();
const Probe = () => {
  api = useCountdown(120, onDone);
  return null;
};
const mount = () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<Probe />);
  });
  return r;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(START);
  onDone.mockClear();
});
afterEach(() => jest.useRealTimers());

test('start() dan oldin initialSeconds; start() dan so\'ng har soniyada kamayadi', () => {
  mount();
  expect(api.remaining).toBe(120);
  act(() => api.start(120));
  expect(api.remaining).toBe(120);
  act(() => {
    jest.advanceTimersByTime(3000);
  });
  expect(api.remaining).toBe(117);
});

test('fonga o\'tganda tizim vaqti 90s sakrasa — keyingi tick qolgan vaqtni deadline bo\'yicha beradi (30)', () => {
  mount();
  act(() => api.start(120));
  // fon: JS timer'lar to'xtagan, soat 90s oldinga ketdi. setSystemTime timer'larni ishga tushirmaydi.
  act(() => {
    jest.setSystemTime(new Date(START.getTime() + 90_000));
    jest.advanceTimersByTime(1000); // qaytgach birinchi tick (fake soat +1s ham ketadi)
  });
  expect(api.remaining).toBe(29);
  expect(onDone).not.toHaveBeenCalled();
});

test('deadline fonda o\'tib ketsa — tick 0 va onDone bir marta', () => {
  mount();
  act(() => api.start(120));
  act(() => {
    jest.setSystemTime(new Date(START.getTime() + 10 * 60_000));
    jest.advanceTimersByTime(1000);
  });
  expect(api.remaining).toBe(0);
  expect(onDone).toHaveBeenCalledTimes(1);
  act(() => {
    jest.advanceTimersByTime(5000);
  });
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('qayta start() eski intervalni almashtiradi; unmount\'dan keyin start() e\'tiborsiz va interval qolmaydi', () => {
  const r = mount();
  act(() => api.start(10));
  act(() => api.start(120));
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(api.remaining).toBe(118);
  act(() => r.unmount());
  expect(jest.getTimerCount()).toBe(0);
  act(() => api.start(5));
  expect(jest.getTimerCount()).toBe(0);
});
