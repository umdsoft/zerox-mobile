#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * i18n tekshiruvchi (string-as-key: kalit = o'zbekcha matn).
 *  1) src dagi literal t('...') / i18n.t('...') kalitlarini yig'adi
 *  2) ru/en/kr/kaa "translation" obyektida yo'q kalitlarni topadi            (XATO -> exit 1)
 *  3) qiymati kalitga teng (tarjima qilinmagan bo'lishi mumkin) yozuvlar      (ogohlantirish)
 *  4) t() siz o'zbekcha literallar (JSX matn / prop / mapper obyekt / return) (heuristika)
 *  5) t(var) ishlatilgan fayllardagi lug'atda YO'Q o'zbekcha literallar       (XATO -> exit 1)
 *  6) mapper maydoni t() siz chiqarilgan JSX joylar: {x.label}, 'A' : 'B'      (heuristika)
 *  7) dinamik t(variable) chaqiruvlari ro'yxati (statik tekshirib bo'lmaydi)
 * Ishlatish: node scripts/checkI18n.js [--verbose] [--json] [--src <src papka>]
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const srcIdx = argv.indexOf('--src');
const SRC = srcIdx >= 0 ? path.resolve(argv[srcIdx + 1]) : path.join(__dirname, '..', 'src');
const ROOT = path.dirname(SRC);
const LANGS = ['ru', 'en', 'kr', 'kaa'];

// Brend / kod / texnik so'zlar: qiymat kalitga teng bo'lishi mumkin.
const SAME_OK = [
  /^[\d\s.,:;%+\-–—/()*#№@₩$€₽×x]*$/, // raqam / belgilar
  /^(ZeroX|UZS|USD|SMS|QR|PDF|Excel|CSV|ID|PIN|OK|Telegram|Click|Payme|Uzum|MyID|Free|Start|Premium|Business|Pro|Plus|Lite|Standard|Basic|Gold|VIP|Face ID|Touch ID|Google|Apple|Android|iOS|WhatsApp|Instagram|Facebook|YouTube)$/i,
  /^[A-Za-z]{1,4}$/, // qisqartmalar
  /[Ѐ-ӿ]/, // kirillcha qism bor (masalan "Gap (Чёрная касса)")
  /^(\{\{\w+\}\}[\s:.,\-/·]*)+$/, // faqat {{placeholder}}
];
const MARKERS = /(o['‘ʻ’`]|g['‘ʻ’`]|\bqarz|shaxsiy|muddati|jarayonda|berilgan|olingan|to['‘ʻ’`]lov|\bmijoz|do['‘ʻ’`]kon|kiritilgan|eslatma|\bsana\b|\bsumma\b|\bbo['‘ʻ’`]lim|\bxato\b|\bsaqlash|\bbekor|\btasdiq|\bnomi\b|\bkategoriya|\bxatolik|\bfaol\b|\bnofaol)/i;

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === 'node_modules') continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f.name) && !/\.d\.ts$/.test(f.name)) out.push(p);
  }
  return out;
}

function loadLang(l) {
  const j = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n', 'new', `${l}.json`), 'utf8'));
  return j.translation || {};
}

// Izohlarni bo'shatadi (qatorlar soni saqlanadi). Satr literali ichidagi '//' (URL) ga tegmaydi.
function stripComments(txt) {
  const noBlock = txt.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  return noBlock
    .split('\n')
    .map(ln => ln.replace(/(^|[\s;{(,])\/\/.*$/, (m, p) => p + ' '.repeat(m.length - p.length)))
    .join('\n');
}
function readSrc(f) {
  return stripComments(fs.readFileSync(f, 'utf8').replace(/\r/g, ''));
}
const relOf = f => path.relative(ROOT, f).replace(/\\/g, '/');

// Satr literalini ochish; \' \" \\ \n escape'larini hal qiladi.
function unescapeStr(s, q) {
  return s.replace(/\\(.)/g, (m, c) => (c === 'n' ? '\n' : c === 't' ? '\t' : c === q || c === '\\' || c === "'" || c === '"' ? c : m));
}

const T_CALL = /(?<![\w.$])(?:i18n\.|i18next\.)?t\(\s*(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`([^`$]*)`)/g;
const T_DYN = /(?<![\w.$])(?:i18n\.|i18next\.)?t\(\s*([A-Za-z_$][\w$.\[\]?!]*)\s*[,)]/g;

function collect(files) {
  const keys = new Map(); // key -> [file:line]
  const dyn = [];
  for (const f of files) {
    const txt = readSrc(f);
    const rel = relOf(f);
    let m;
    T_CALL.lastIndex = 0;
    while ((m = T_CALL.exec(txt))) {
      const raw = m[1] !== undefined ? unescapeStr(m[1], "'") : m[2] !== undefined ? unescapeStr(m[2], '"') : m[3];
      const line = txt.slice(0, m.index).split('\n').length;
      if (!keys.has(raw)) keys.set(raw, []);
      keys.get(raw).push(`${rel}:${line}`);
    }
    T_DYN.lastIndex = 0;
    while ((m = T_DYN.exec(txt))) {
      const line = txt.slice(0, m.index).split('\n').length;
      dyn.push(`${rel}:${line}  t(${m[1]})`);
    }
  }
  return { keys, dyn };
}

// "Uzbekcha matn"ga o'xshaydimi (identifikator / marshrut nomi / fayl nomi emas)?
function looksUzbekText(v) {
  if (!v || !MARKERS.test(v) || !/[A-Za-z]/.test(v)) return false;
  if (!/[\s‘ʻ’'`]/.test(v)) return false; // bitta so'z, apostrofsiz -> identifikator
  if (/^[A-Za-z0-9_]+$/.test(v) || /^[a-z0-9]+([-_.][a-z0-9]+)+$/i.test(v)) return false;
  if (/\.(pdf|png|jpg|xlsx|csv)$/i.test(v)) return false;
  return true;
}

const PROP = /\b(title|label|placeholder|subtitle|text|message|hint|description|headerTitle)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*(?:'([^']*)'|"([^"]*)")\s*\})/g;
const JSXTEXT = />\s*([^<>{}\n]*[A-Za-z‘ʻ’'][^<>{}\n]*?)\s*</g;
const RET = /\breturn\s+(?:'([^'\n]*)'|"([^"\n]*)")\s*;?/g;
const OBJ = /\b(?:label|title|text|status|desc|hint|detail|subtitle|msg|word|confirmLabel|placeholder|error|reason|l)\s*:\s*(?:'([^'\n]*)'|"([^"\n]*)")/g;

// 4) t() siz o'zbekcha literallar; dicts berilsa lug'atda YO'Qlari alohida qaytariladi.
function scanRaw(files, dicts) {
  const hits = [];
  for (const f of files) {
    const rel = relOf(f);
    if (/__tests__|\.test\./.test(rel)) continue;
    readSrc(f).split('\n').forEach((ln, i) => {
      const stripped = ln.replace(T_CALL, 't(__)');
      const push = (val, tag) => {
        if (!looksUzbekText(val)) return;
        const miss = LANGS.filter(l => !(val in dicts[l]));
        hits.push({ at: `${rel}:${i + 1}`, val: tag + val, miss });
      };
      for (const re of [PROP, RET, OBJ]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(stripped))) push(m.slice(1).find(x => x !== undefined), '');
      }
      JSXTEXT.lastIndex = 0;
      let m;
      while ((m = JSXTEXT.exec(stripped))) {
        if (/=>|&&|\|\||[;=]/.test(m[1])) continue;
        push(m[1], '<jsx> ');
      }
    });
  }
  return hits;
}

// 5) t(var) ishlatilgan fayllardagi har qanday o'zbekcha literal lug'atda bormi?
function scanDynamicLiterals(files, dyn, dicts) {
  const dynFiles = new Set(dyn.map(d => d.split(':')[0]));
  const out = [];
  const LIT = /(?<![\w.$])(?:'((?:[^'\\\n]|\\.){3,80})'|"((?:[^"\\\n]|\\.){3,80})")/g;
  const SKIP = /^(import )/;
  const SKIP2 = /\b(require|testID|navigate)\s*[=(:]/;
  for (const f of files) {
    const rel = relOf(f);
    if (!dynFiles.has(rel)) continue;
    readSrc(f).split('\n').forEach((ln, i) => {
      if (SKIP.test(ln.trim()) || SKIP2.test(ln)) return;
      LIT.lastIndex = 0;
      let m;
      while ((m = LIT.exec(ln))) {
        const raw = m[1] !== undefined ? unescapeStr(m[1], "'") : unescapeStr(m[2], '"');
        if (!looksUzbekText(raw)) continue;
        const miss = LANGS.filter(l => !(raw in dicts[l]));
        if (miss.length) out.push(`${rel}:${i + 1}  ${raw}  [${miss.join(',')}]`);
      }
    });
  }
  return out;
}

// 6) mapper maydoni t() siz chiqarilgan JSX joylar
const FIELD_RENDER = />\s*\{\s*[\w$]+(\??\.[\w$]+)*\.(label|title|name|text|desc|hint|l|word|statusText)\s*\}\s*</g;
const TERNARY_LIT = /\{[^{}]*\?\s*(['"])[^'"]+\1\s*:\s*(['"])[^'"]+\2\s*\}/g;
function scanRenderSites(files) {
  const out = [];
  for (const f of files) {
    const rel = relOf(f);
    if (/__tests__|\.test\./.test(rel)) continue;
    readSrc(f).split('\n').forEach((ln, i) => {
      if (/\bt\(/.test(ln.replace(/\{\s*t\([^)]*\)\s*\}/g, ''))) {
        // t() bor, lekin boshqa raw bo'lak ham bo'lishi mumkin — pastda baribir tekshiramiz
      }
      FIELD_RENDER.lastIndex = 0;
      let m;
      while ((m = FIELD_RENDER.exec(ln))) out.push(`${rel}:${i + 1}  ${m[0].trim()}`);
      TERNARY_LIT.lastIndex = 0;
      while ((m = TERNARY_LIT.exec(ln))) {
        if (/[A-Za-zА-Яа-я]{3}/.test(m[0]) && !/\bt\(/.test(m[0]) && !/(color|style|opacity|Math|px|%)/i.test(m[0]) && /\s*>/.test(ln)) {
          out.push(`${rel}:${i + 1}  ${m[0].trim()}`);
        }
      }
    });
  }
  return out;
}

function analyze() {
  const files = walk(SRC);
  const { keys, dyn } = collect(files);
  const dicts = {};
  for (const l of LANGS) dicts[l] = loadLang(l);
  const res = { used: keys.size, missing: {}, same: {}, dynamic: dyn };
  for (const l of LANGS) {
    const tr = dicts[l];
    res.missing[l] = [...keys.keys()].filter(k => !(k in tr));
    res.same[l] = Object.entries(tr)
      .filter(([k, v]) => typeof v === 'string' && v === k && keys.has(k) && !SAME_OK.some(re => re.test(k)))
      .map(([k]) => k);
  }
  const raw = scanRaw(files, dicts);
  res.raw = raw.map(h => `${h.at}  ${h.val}`);
  res.rawUntranslated = raw.filter(h => h.miss.length).map(h => `${h.at}  ${h.val}  [${h.miss.join(',')}]`);
  res.dynMissing = scanDynamicLiterals(files, dyn, dicts);
  res.renderRaw = scanRenderSites(files);
  return { res, keys };
}

function main() {
  const verbose = argv.includes('--verbose');
  const { res, keys } = analyze();
  if (argv.includes('--json')) {
    console.log(JSON.stringify(res, null, 2));
    return;
  }
  console.log(`literal t() kalitlar: ${res.used}`);
  for (const l of LANGS) console.log(`[${l}] yo'q kalit: ${res.missing[l].length} | qiymat=kalit (shubhali): ${res.same[l].length}`);
  console.log(`t() siz o'zbekcha literal (heuristika): ${res.raw.length} (shundan lug'atda YO'Q: ${res.rawUntranslated.length})`);
  console.log(`t(var) fayllaridagi lug'atda YO'Q o'zbekcha literallar: ${res.dynMissing.length}`);
  console.log(`mapper maydoni / ternary t() siz chiqarilgan JSX (ko'z bilan tekshirish): ${res.renderRaw.length}`);
  console.log(`dinamik t(var): ${res.dynamic.length}`);
  if (verbose) {
    for (const l of LANGS) {
      console.log(`\n== ${l} missing ==`);
      res.missing[l].forEach(k => console.log('  ' + JSON.stringify(k) + '  <- ' + keys.get(k)[0]));
      console.log(`== ${l} same ==`);
      res.same[l].forEach(k => console.log('  ' + JSON.stringify(k)));
    }
    console.log('\n== raw ==');
    res.raw.forEach(x => console.log('  ' + x));
    console.log('\n== rawUntranslated ==');
    res.rawUntranslated.forEach(x => console.log('  ' + x));
    console.log("\n== dynMissing (lug'atda yo'q) ==");
    res.dynMissing.forEach(x => console.log('  ' + x));
    console.log('\n== renderRaw ==');
    res.renderRaw.forEach(x => console.log('  ' + x));
    console.log('\n== dynamic ==');
    res.dynamic.forEach(x => console.log('  ' + x));
  }
  const bad = LANGS.some(l => res.missing[l].length) || res.dynMissing.length > 0;
  process.exitCode = bad ? 1 : 0;
}

if (require.main === module) main();
module.exports = { collect, walk, loadLang, analyze, LANGS, SRC };
