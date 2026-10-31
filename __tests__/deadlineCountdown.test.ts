import {startDeadlineCountdown} from '../src/helper/deadlineCountdown';

describe('startDeadlineCountdown', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('fon rejimida tick o\'tkazib yuborilsa ham qolgan vaqt to\'g\'ri', () => {
    let t = 1_000_000;
    const ticks: number[] = [];
    const done = jest.fn();
    startDeadlineCountdown(120, r => ticks.push(r), done, () => t);
    t += 90_000; // 90s fonda
    jest.advanceTimersByTime(1000);
    expect(ticks[ticks.length - 1]).toBe(30);
    expect(done).not.toHaveBeenCalled();
  });

  test('deadline o\'tgach onDone bir marta va interval to\'xtaydi', () => {
    let t = 0;
    const done = jest.fn();
    startDeadlineCountdown(2, () => {}, done, () => t);
    t += 3000;
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  test('stop() intervalni tozalaydi', () => {
    const done = jest.fn();
    const stop = startDeadlineCountdown(1, () => {}, done);
    stop();
    jest.advanceTimersByTime(5000);
    expect(done).not.toHaveBeenCalled();
  });
});
