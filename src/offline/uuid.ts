/**
 * UUID v4 — oflayn amal identifikatori (= serverdagi `Idempotency-Key`).
 * CSPRNG: `crypto.getRandomValues` (RN'da `react-native-get-random-values` polyfill'i
 * index.js'da eng birinchi yuklanadi). Polyfill bo'lmasa (faqat testlar) — Math.random.
 */
const fillRandom = (bytes: Uint8Array): void => {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
    return;
  }
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
};

export function uuidv4(): string {
  const b = new Uint8Array(16);
  fillRandom(b);
  b[6] = (b[6] & 0x0f) | 0x40; // versiya 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 varianti
  const h: string[] = [];
  for (let i = 0; i < 16; i++) h.push(b[i].toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h
    .slice(8, 10)
    .join('')}-${h.slice(10, 16).join('')}`;
}
