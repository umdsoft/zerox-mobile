/**
 * Aktor — oflayn amal QAYSI SESSIYADA yaratilgani.
 *
 * Oddiy token: `{ id: userId }`; xodim tokeni (POST /qarz-daftari/xodim/enter yoki /xodim/login):
 * `{ id: egaId, role: 'xodim', xodim_id }`. Amal faqat AYNAN shu aktor tokeni bilan yuboriladi —
 * aks holda xodim kiritgan qarz egasi tokeni bilan ketib, `xodim_id` atributsiyasi yo'qolardi
 * (yoki boshqa akkauntga yozilardi). Imzo TEKSHIRILMAYDI (faqat lokal kalit; ruxsatni server tekshiradi).
 */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** base64url -> UTF-8 satr (JWT payload ASCII/JSON; global atob RN'da kafolatlanmagan). */
const b64urlDecode = (seg: string): string => {
  const s = seg.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  const bytes: number[] = [];
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < s.length; i++) {
    const v = B64.indexOf(s[i]);
    if (v < 0) throw new Error('bad base64');
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buf >> bits) & 0xff);
    }
  }
  // Bizga faqat raqamli `id`/`xodim_id` kerak — payload ASCII JSON, UTF-8 dekodlash shart emas.
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
};

export interface ActorInfo {
  key: string;
  userId: number;
  xodimId: number | null;
}

export function actorFromToken(token: string | null | undefined): ActorInfo | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(b64urlDecode(parts[1])) as { id?: unknown; xodim_id?: unknown };
    const userId = Number(payload.id);
    if (!Number.isFinite(userId) || userId <= 0) return null;
    const xRaw = Number(payload.xodim_id);
    const xodimId = Number.isFinite(xRaw) && xRaw > 0 ? xRaw : null;
    return { key: `u${userId}:x${xodimId ?? 0}`, userId, xodimId };
  } catch {
    return null;
  }
}
