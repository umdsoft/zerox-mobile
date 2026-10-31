import {missingRouteParams} from '../src/helper/withRequiredParams';

describe('missingRouteParams', () => {
  test('params yo\'q -> yetishmaydi', () => {
    expect(missingRouteParams(undefined, [])).toBe(true);
    expect(missingRouteParams(null, ['id'])).toBe(true);
  });
  test('majburiy kalit yo\'q yoki null', () => {
    expect(missingRouteParams({}, ['id'])).toBe(true);
    expect(missingRouteParams({id: null}, ['id'])).toBe(true);
  });
  test('0 va bo\'sh satr to\'g\'ri qiymat; kalitlarsiz bo\'sh obyekt OK', () => {
    expect(missingRouteParams({type: 0}, ['type'])).toBe(false);
    expect(missingRouteParams({}, [])).toBe(false);
  });
});
