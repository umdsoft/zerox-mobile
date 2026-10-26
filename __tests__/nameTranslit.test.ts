import translitName from '../src/helper/nameTranslit';

describe('translitName — FISh o‘zbek lotinidan sayt/ilova tiliga', () => {
  test('rus kirilligi', () => {
    expect(translitName('BOLTAYEV BUNYODBEK JUMABOYEVICH', 'ru')).toBe('БОЛТАЕВ БУНЁДБЕК ЖУМАБОЕВИЧ');
    expect(translitName('O‘tamuratov Nurbek Amat O‘G‘LI', 'ru')).toBe('Утамуратов Нурбек Амат УГЛИ');
    expect(translitName("Jumanazarov Dostonbek Mo'minboy O'g'li", 'ru')).toBe('Жуманазаров Достонбек Муминбой Угли');
    expect(translitName('Shoxrux Xolmatov', 'ru')).toBe('Шохрух Холматов');
    expect(translitName('Valiyev Ergash', 'ru')).toBe('Валиев Эргаш');
  });
  test('o‘zbek kirilligi', () => {
    expect(translitName("Jumanazarov Dostonbek Mo'minboy O'g'li", 'kr')).toBe('Жуманазаров Достонбек Мўминбой Ўғли');
    expect(translitName('Qodirov Hamid', 'kr')).toBe('Қодиров Ҳамид');
    expect(translitName("Sa'dullayev", 'kr')).toBe('Саъдуллаев');
  });
  test('qoraqalpoq lotini', () => {
    expect(translitName("Mo'minboy O'g'li", 'kaa')).toBe('Móminboy Óǵli');
    expect(translitName("O'G'LI", 'kaa')).toBe('ÓǴLI');
  });
  test('uz va en — o‘zgarishsiz; kirill matn — tegilmaydi; bo‘sh qiymat', () => {
    expect(translitName("O'tamuratov", 'uz')).toBe("O'tamuratov");
    expect(translitName("O'tamuratov", 'en')).toBe("O'tamuratov");
    expect(translitName('Иванов Иван', 'ru')).toBe('Иванов Иван');
    expect(translitName('', 'ru')).toBe('');
    expect(translitName(null, 'ru')).toBe('');
  });
});
