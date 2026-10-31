// Jest: native polyfill (index.js `let module = null` bilan parse xatosi beradi) o'rniga Node crypto.
const nodeCrypto = require('crypto');
if (!global.crypto) {
  global.crypto = {};
}
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = arr => nodeCrypto.randomFillSync(arr);
}
