/**
 * FISh (ism-familiya) transliteratsiyasi: o'zbek LOTIN yozuvidagi ism -> sayt/ilova tiliga.
 *
 * Identifikatsiyadan o'tgan foydalanuvchilar FISh'i bazada o'zbek lotinida saqlanadi (MyID).
 * Sayt/ilova tili o'zgarganda FISh ham shu tilda ko'rinishi kerak:
 *   ru  -> rus kirilligi        (Boltayev Bunyodbek  -> Болтаев Бунёдбек, O'g'li -> Угли)
 *   kr  -> o'zbek kirilligi     (O'tamuratov         -> Ўтамуратов,      O'g'li -> Ўғли)
 *   kaa -> qoraqalpoq lotini    (O'tamuratov         -> Ótamuratov,      O'g'li -> Óǵli)
 *   uz, en -> o'zgarishsiz (lotin)
 * Harf registri saqlanadi (BOLTAYEV -> БОЛТАЕВ, Boltayev -> Болтаев). Matnda kirill harf bo'lsa — tegilmaydi.
 *
 * ⚠️ Bu fayl sayt (frontend/utils/nameTranslit.js) va ilova (ZeroX_mobile/src/helper/nameTranslit.ts)
 * da BIR XIL mantiq: o'zgartirsangiz ikkalasini yangilang (test: ZeroX_mobile/__tests__/nameTranslit.test.ts).
 */

const APOS_ALL = /[ʻʼ‘’`´]/g; // o'/g' belgisi va tutuq belgisining Unicode ko'rinishlari -> oddiy '
const CYRILLIC = /[Ѐ-ӿ]/;
const LATIN = /[A-Za-z]/;
const VOWELS = 'aeiou';

// [uz-kirill, ru-kirill]
const PAIRS: Record<string, [string, string]> = {
  "o'": ['ў', 'у'],
  "g'": ['ғ', 'г'],
  sh: ['ш', 'ш'],
  ch: ['ч', 'ч'],
  ng: ['нг', 'нг'],
  yo: ['ё', 'ё'],
  yu: ['ю', 'ю'],
  ya: ['я', 'я'],
  ye: ['е', 'е'],
  ts: ['ц', 'ц'],
};

const SINGLE: Record<string, [string, string]> = {
  a: ['а', 'а'], b: ['б', 'б'], c: ['с', 'ц'], d: ['д', 'д'], f: ['ф', 'ф'], g: ['г', 'г'],
  h: ['ҳ', 'х'], i: ['и', 'и'], j: ['ж', 'ж'], k: ['к', 'к'], l: ['л', 'л'], m: ['м', 'м'],
  n: ['н', 'н'], o: ['о', 'о'], p: ['п', 'п'], q: ['қ', 'к'], r: ['р', 'р'], s: ['с', 'с'],
  t: ['т', 'т'], u: ['у', 'у'], v: ['в', 'в'], w: ['в', 'в'], x: ['х', 'х'], y: ['й', 'й'], z: ['з', 'з'],
};

const isUpper = (c?: string): boolean => !!c && c !== c.toLowerCase();
const title = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Manba harflar registri bo'yicha natija: ikkalasi katta -> KATTA, faqat birinchisi -> Sarlavha. */
function caseLike(out: string, first: string, second?: string): string {
  if (!isUpper(first)) return out;
  return second === undefined || isUpper(second) ? out.toUpperCase() : title(out);
}

function toCyrillic(text: string, col: 0 | 1): string {
  const src = String(text).replace(APOS_ALL, "'");
  let out = '';
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const low = ch.toLowerCase();
    const nextCh = src[i + 1];
    const pair = nextCh ? low + nextCh.toLowerCase() : '';
    const prev = src[i - 1] || '';
    const wordStart = !LATIN.test(prev);

    if (pair && PAIRS[pair]) {
      // "o'" / "g'" — bitta harf (ikkinchi belgi tutuq); boshqalari — ikki harf
      const isApos = nextCh === "'";
      out += caseLike(PAIRS[pair][col], ch, isApos ? undefined : nextCh);
      i += 2;
      continue;
    }
    if (ch === "'") {
      // harflar orasidagi tutuq (a'lo -> аъло); boshqa joyda o'z holicha
      out += LATIN.test(prev) && LATIN.test(nextCh || '') ? 'ъ' : ch;
      i += 1;
      continue;
    }
    if (low === 'e') {
      // so'z boshida yoki unlidan keyin — э, undoshdan keyin — е
      const e = wordStart || VOWELS.includes(prev.toLowerCase()) ? 'э' : 'е';
      out += caseLike(e, ch);
      i += 1;
      continue;
    }
    const m = SINGLE[low];
    out += m ? caseLike(m[col], ch) : ch;
    i += 1;
  }
  return out;
}

function toKaraKalpak(text: string): string {
  return String(text)
    .replace(/([Oo])[ʻʼ‘’`´']/g, (_: string, c: string) => (c === 'O' ? 'Ó' : 'ó'))
    .replace(/([Gg])[ʻʼ‘’`´']/g, (_: string, c: string) => (c === 'G' ? 'Ǵ' : 'ǵ'));
}

/**
 */
function translitName(name: string | null | undefined, lang: string): string {
  if (name === null || name === undefined) return '';
  const s = String(name);
  if (!s || CYRILLIC.test(s)) return s; // allaqachon kirill (yoki bo'sh) — tegmaymiz
  if (lang === 'ru') return toCyrillic(s, 1);
  if (lang === 'kr') return toCyrillic(s, 0);
  if (lang === 'kaa') return toKaraKalpak(s);
  return s; // uz, en
}

export { translitName };
export default translitName;
