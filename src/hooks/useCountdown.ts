import { useCallback, useEffect, useRef, useState } from 'react';
import { startDeadlineCountdown } from '../helper/deadlineCountdown';

/**
 * Deadline asosidagi teskari sanoq hooki (01.11). Qolgan vaqt = deadline - Date.now(), shuning uchun ilova
 * orqa fonda bo'lib qaytganda yoki tizim vaqti sakrasa ham to'g'ri (setState-dekrement EMAS).
 * - `remaining`: `start()` dan oldin `initialSeconds`; `onDone` deadline o'tganda bir marta chaqiriladi.
 * - unmount'da interval tozalanadi; unmount'dan keyingi `start()` e'tiborsiz.
 */
export function useCountdown(initialSeconds = 0, onDone?: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const stopRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const start = useCallback(
    (seconds: number) => {
      stop();
      if (!mountedRef.current) return;
      stopRef.current = startDeadlineCountdown(
        seconds,
        setRemaining,
        () => {
          stopRef.current = null;
          setRemaining(0);
          onDoneRef.current?.();
        },
      );
    },
    [stop],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [stop]);

  return { remaining, start, stop };
}
