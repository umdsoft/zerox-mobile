// SEC (2026-10-31): PIN urinishlari ENDI SHIFRLANGAN MMKV'da saqlanadi (ilgari
// SetLocalPassword'da useState(3) edi — ilovani qayta ishga tushirish hisobni
// nollardi). Mantiq sof (pure) modulda: ekran ham, PIN o'zgartirish ekranlari ham
// shu yagona yo'ldan o'tadi.
//
// Qoida: urinish tekshiruvdan OLDIN hisoblanadi (jarayon tekshiruv paytida
// o'ldirilsa ham urinish "yeb" ketadi). Ketma-ket xatolar:
//   3-4 -> 30 soniya, 5-6 -> 5 daqiqa, 7-9 -> 30 daqiqa, 10 -> sessiya o'chiriladi
//   (chaqiruvchi forceLogout('pin-lockout') qiladi; SMS bilan qayta kirish).
//
// SOAT: qulf `lockedAt` (qulf boshlangan devor vaqti) + `lockUntil` bilan saqlanadi.
// Soat qulf boshlanishidan ORQAGA surilsa (now < lockedAt - SKEW) — qulf to'liq
// davomiylikka qaytadi; qolgan vaqt hech qachon davomiylikdan oshmaydi. Soatni
// OLDINGA surish bilan qulfni ochish oflayn to'liq oldini olinmaydi (monotonik
// soat RN'da yo'q) — qoldiq xavf, hisobotda.
import { storage } from './getToken';

const K_FAILS = 'pin_fail_count';
const K_LOCK_UNTIL = 'pin_lock_until';
const K_LOCKED_AT = 'pin_locked_at';
const K_LOCK_MS = 'pin_lock_ms';
// Eski kalit (30 daqiqalik blok) — tozalash uchun.
const LEGACY_TIME = 'time';

export const CLOCK_SKEW_MS = 5000;
export const WIPE_AT = 10;
// [minimal ketma-ket xato soni, qulf davomiyligi ms] — kattadan kichikka.
const TIERS: ReadonlyArray<readonly [number, number]> = [
  [7, 30 * 60 * 1000],
  [5, 5 * 60 * 1000],
  [3, 30 * 1000],
];

export type LockState = { locked: boolean; remainingMs: number; failures: number };
export type AttemptResult =
  | { result: 'ok' }
  | { result: 'wrong'; failures: number; attemptsLeft: number; lockMs: number }
  | { result: 'locked'; remainingMs: number }
  | { result: 'wipe' };

export function lockDurationFor(failures: number): number {
  for (const [min, ms] of TIERS) if (failures >= min) return ms;
  return 0;
}

/** Keyingi qulf bosqichigacha qolgan urinishlar (UI xabari uchun). */
export function attemptsUntilNextLock(failures: number): number {
  const marks = [3, 5, 7, WIPE_AT];
  for (const m of marks) if (failures < m) return m - failures;
  return 0;
}

export function getLockState(now: number = Date.now()): LockState {
  const failures = storage.getNumber(K_FAILS) ?? 0;
  const until = storage.getNumber(K_LOCK_UNTIL);
  const lockedAt = storage.getNumber(K_LOCKED_AT);
  const duration = storage.getNumber(K_LOCK_MS);
  if (until === undefined || lockedAt === undefined || duration === undefined) {
    return { locked: false, remainingMs: 0, failures };
  }
  let remaining = until - now;
  // Soat qulf boshlanishidan oldingi vaqtga surilgan — to'liq muddat.
  if (now < lockedAt - CLOCK_SKEW_MS) remaining = duration;
  if (remaining > duration) remaining = duration;
  if (remaining <= 0) return { locked: false, remainingMs: 0, failures };
  return { locked: true, remainingMs: remaining, failures };
}

export function resetPinLockout(): void {
  try {
    storage.delete(K_FAILS);
    storage.delete(K_LOCK_UNTIL);
    storage.delete(K_LOCKED_AT);
    storage.delete(K_LOCK_MS);
    storage.delete(LEGACY_TIME);
  } catch {}
}

/**
 * PIN'ni qulf/urinish hisobi bilan tekshiradi. `verify` — masalan `verifyPin`.
 * Muvaffaqiyatda hisob nollanadi; 'wipe' qaytsa chaqiruvchi forceLogout qiladi.
 */
export function attemptPin(
  verify: (pin: string) => boolean,
  pin: string,
  now: number = Date.now(),
): AttemptResult {
  const state = getLockState(now);
  if (state.locked) return { result: 'locked', remainingMs: state.remainingMs };

  // Urinishni TEKSHIRUVDAN OLDIN yozamiz.
  const failures = state.failures + 1;
  storage.set(K_FAILS, failures);

  let ok = false;
  try {
    ok = verify(pin);
  } catch {
    ok = false;
  }
  if (ok) {
    resetPinLockout();
    return { result: 'ok' };
  }
  if (failures >= WIPE_AT) return { result: 'wipe' };

  const lockMs = lockDurationFor(failures);
  if (lockMs > 0) {
    storage.set(K_LOCKED_AT, now);
    storage.set(K_LOCK_MS, lockMs);
    storage.set(K_LOCK_UNTIL, now + lockMs);
  }
  return { result: 'wrong', failures, attemptsLeft: attemptsUntilNextLock(failures), lockMs };
}

export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
