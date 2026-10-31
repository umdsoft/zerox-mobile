/**
 * Deadline asosidagi teskari sanoq: qolgan vaqt = deadline - Date.now(), shuning uchun
 * ilova orqa fonga o'tib qaytganda ham to'g'ri (setInterval tick'lari o'tkazib yuborilsa ham).
 * Qaytaradi: to'xtatish funksiyasi.
 */
export const startDeadlineCountdown = (
  seconds: number,
  onTick: (remaining: number) => void,
  onDone: () => void,
  now: () => number = Date.now,
): (() => void) => {
  const deadline = now() + seconds * 1000;
  onTick(seconds);
  const id = setInterval(() => {
    // Tizim soati orqaga surilsa ham boshlang'ich qiymatdan oshmasin.
    const remaining = Math.min(seconds, Math.max(0, Math.ceil((deadline - now()) / 1000)));
    if (remaining <= 0) {
      clearInterval(id);
      onDone();
    } else {
      onTick(remaining);
    }
  }, 1000);
  return () => clearInterval(id);
};
