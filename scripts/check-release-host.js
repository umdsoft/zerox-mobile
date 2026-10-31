#!/usr/bin/env node
// Release build oldidan statik tekshiruv: release bundle test serverga (tb.zerox.uz /
// test.zerox.uz) ulanib qolmasligi kerak. Bundle'ni grep qilish noto'g'ri signal beradi
// (konstantalar modullar orasida inline bo'lmaydi), shuning uchun manba tekshiriladi.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const errors = [];

// 1) Override prod bo'lishi shart.
const override = read('src/config/buildHost.ts');
if (!/export const USE_TEST_HOST_IN_RELEASE = false;/.test(override)) {
  errors.push('src/config/buildHost.ts: USE_TEST_HOST_IN_RELEASE false bo\'lishi shart (npm run set-host:prod).');
}

// 2) constants.ts: HOST ifodasi __DEV__/override orqali, test host faqat shartli.
const constants = read('src/screens/constants.ts')
  .split('\n')
  .filter(l => !/^\s*\/\//.test(l))
  .join('\n');
if (!/const IS_TEST_ENV\s*=\s*__DEV__\s*\|\|\s*USE_TEST_HOST_IN_RELEASE;/.test(constants)) {
  errors.push('constants.ts: IS_TEST_ENV = __DEV__ || USE_TEST_HOST_IN_RELEASE bo\'lishi shart.');
}
if (!/const HOST\s*=\s*IS_TEST_ENV\s*\?\s*TEST_HOST\s*:\s*PROD_HOST;/.test(constants)) {
  errors.push('constants.ts: HOST = IS_TEST_ENV ? TEST_HOST : PROD_HOST bo\'lishi shart.');
}
if (!/const PROD_HOST\s*=\s*'https:\/\/app\.zerox\.uz';/.test(constants)) {
  errors.push('constants.ts: PROD_HOST app.zerox.uz bo\'lishi shart.');
}

// 3) Test host literal'lari constants.ts'dan boshqa joyda bo'lmasin (src/, App.tsx).
const bad = /(?<!\/\/.*)(tb\.zerox\.uz|test\.zerox\.uz)/;
const walk = d =>
  fs.readdirSync(path.join(root, d), {withFileTypes: true}).flatMap(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(ts|tsx|js)$/.test(e.name) ? [p] : [];
  });
for (const f of [...walk('src'), 'App.tsx']) {
  const norm = f.split(path.sep).join('/');
  if (norm === 'src/screens/constants.ts') continue;
  const lines = read(norm).split('\n');
  lines.forEach((l, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;
    if (bad.test(l)) errors.push(`${norm}:${i + 1}: test host literal`);
  });
}

if (errors.length) {
  console.error('check-release-host: XATO — release build test serverga ulanishi mumkin:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log('check-release-host: OK (release -> app.zerox.uz)');
