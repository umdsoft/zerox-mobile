import { useCallback, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

/** Server xabari (`response.data.message`) yoki berilgan zaxira matn. */
export const apiErrorMessage = (err: unknown, fallback = 'Xatolik yuz berdi'): string => {
  const msg = (err as any)?.response?.data?.message;
  return msg || fallback;
};

export interface ActionOptions<T> {
  /** Muvaffaqiyat toast matni (caller beradi). Berilmasa toast yo'q. */
  success?: string | ((data: T) => string);
  /** Xato toast matni (caller beradi; odatda `e => apiErrorMessage(e)`). Berilmasa toast yo'q. */
  error?: string | ((err: unknown) => string);
  /** Xato toast davomiyligi (ms); berilmasa Toast standarti. */
  errorVisibilityTime?: number;
  /** Muvaffaqiyat toast'idan KEYIN (try ichida: undan tashlangan xato xato-toast'ga tushadi). */
  onSuccess?: (data: T) => void;
  onError?: (err: unknown) => void;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: unknown };

/**
 * Bitta API amali uchun `{ run, loading }`: takroriy chaqiruvdan himoya (bajarilayotganda `run` — undefined
 * qaytaradi), `loading` bayrog'i va ixtiyoriy toast'lar ('omad' / 'error2'). Matnlarni caller beradi.
 */
export function useApiAction() {
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(
    async <T>(fn: () => Promise<T>, opts: ActionOptions<T> = {}): Promise<ActionResult<T> | undefined> => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      setLoading(true);
      try {
        const data = await fn();
        const ok = typeof opts.success === 'function' ? opts.success(data) : opts.success;
        if (ok) Toast.show({ type: 'omad', props: { desc: ok } });
        opts.onSuccess?.(data);
        return { ok: true, data };
      } catch (error) {
        const msg = typeof opts.error === 'function' ? opts.error(error) : opts.error;
        if (msg) {
          Toast.show({
            type: 'error2',
            ...(opts.errorVisibilityTime ? { visibilityTime: opts.errorVisibilityTime } : null),
            props: { desc: msg },
          });
        }
        opts.onError?.(error);
        return { ok: false, error };
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [],
  );

  return { run, loading };
}
