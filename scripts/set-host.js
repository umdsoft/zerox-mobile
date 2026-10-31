#!/usr/bin/env node
// Usage: node scripts/set-host.js test|prod
// src/config/buildHost.ts dagi USE_TEST_HOST_IN_RELEASE bayrog'ini almashtiradi.
const fs = require('fs');
const path = require('path');

const mode = process.argv[2];
if (mode !== 'test' && mode !== 'prod') {
  console.error('Usage: node scripts/set-host.js test|prod');
  process.exit(1);
}
const file = path.join(__dirname, '..', 'src', 'config', 'buildHost.ts');
const src = fs.readFileSync(file, 'utf8');
const re = /export const USE_TEST_HOST_IN_RELEASE = (true|false);/;
if (!re.test(src)) {
  console.error('set-host: USE_TEST_HOST_IN_RELEASE topilmadi: ' + file);
  process.exit(1);
}
fs.writeFileSync(
  file,
  src.replace(re, `export const USE_TEST_HOST_IN_RELEASE = ${mode === 'test'};`),
);
console.log(`set-host: release build -> ${mode === 'test' ? 'TEST (tb.zerox.uz)' : 'PRODUCTION (app.zerox.uz)'}`);
