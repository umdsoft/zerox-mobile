/**
 * i18n kalitlari tekshiruvi (string-as-key: kalit = o'zbekcha matn).
 * Koddagi HAR BIR literal t('...') kalit ru/en/kr/kaa "translation" obyektida bo'lishi shart —
 * aks holda o'sha tilda o'zbekcha matn qolib ketadi.
 * (Dinamik t(variable) statik tekshirilmaydi — scripts/checkI18n.js hisobotida ro'yxatlanadi.)
 */
const { analyze, LANGS } = require('../scripts/checkI18n.js');

describe('i18n literal t() kalitlari', () => {
  const { res } = analyze();

  test('literal kalitlar yig\'ildi (sanity)', () => {
    expect(res.used).toBeGreaterThan(500);
  });

  test.each(LANGS)('%s: hech bir literal t() kalit yetishmaydi', (lang: string) => {
    expect(res.missing[lang]).toEqual([]);
  });
});

describe('useFio / til kodini normallashtirish', () => {
  const { normalizeFioLang, fioIn, fioMatches } = require('../src/helper/useFio');

  test('i18n kodlari va variantlari 5 ta tilga keltiriladi', () => {
    expect(normalizeFioLang('uz')).toBe('uz');
    expect(normalizeFioLang('ru')).toBe('ru');
    expect(normalizeFioLang('kr')).toBe('kr');
    expect(normalizeFioLang('en')).toBe('en');
    expect(normalizeFioLang('kaa')).toBe('kaa');
    expect(normalizeFioLang('ru-RU')).toBe('ru');
    expect(normalizeFioLang('uz-Cyrl')).toBe('kr');
    expect(normalizeFioLang(undefined)).toBe('uz');
  });

  test('ru: lotin FISh rus kirilligida ko\'rsatiladi, uz/en o\'zgarishsiz', () => {
    expect(fioIn('Boltayev Bunyodbek', 'ru')).toBe('Болтаев Бунёдбек');
    expect(fioIn('Boltayev Bunyodbek', 'uz')).toBe('Boltayev Bunyodbek');
    expect(fioIn('Boltayev Bunyodbek', 'en')).toBe('Boltayev Bunyodbek');
    expect(fioIn(null, 'ru')).toBe('');
  });

  test('qidiruv ham asl lotin, ham translit matn bo\'yicha topadi', () => {
    expect(fioMatches('Boltayev Bunyodbek', 'bolta', 'ru')).toBe(true);
    expect(fioMatches('Boltayev Bunyodbek', 'Болтаев', 'ru')).toBe(true);
    expect(fioMatches('Boltayev Bunyodbek', 'Болтаев', 'uz')).toBe(false);
    expect(fioMatches('Boltayev Bunyodbek', 'xyz', 'ru')).toBe(false);
    expect(fioMatches('Boltayev', '', 'ru')).toBe(true);
  });
});
