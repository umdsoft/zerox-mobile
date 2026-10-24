/**
 * "Oflayn saqlandi" xabari — navigatsiyadan KEYIN ko'rsatiladi.
 * App.tsx har navigatsiyada `Toast.hide()` qiladi (helper/finishAction.toastAfterBack izohiga qarang),
 * shuning uchun toast goBack/replace dan oldin ko'rsatilsa, foydalanuvchi uni ko'rmay qoladi —
 * oflayn rejimda esa "saqlandi, keyin yuboriladi" xabari muhim.
 */
import Toast from 'react-native-toast-message';
import { OutboxFullError, OutboxPersistError } from '../outbox';

export function showQueuedToast(desc: string, delayMs = 450): void {
  setTimeout(() => {
    Toast.show({ type: 'omad', position: 'bottom', visibilityTime: 4000, props: { desc } });
  }, delayMs);
}

/**
 * 24.10: navbatga tushgan amal natijasi. Amal `blocked` bo'lsa (shu mijozning oldingi amali xato —
 * CUSTOMER_BLOCKED) — "saqlandi" deb aldamaymiz: ogohlantirish (hal qilish Oflayn rejim sahifasida).
 */
export function showQueuedResult(
  op: { status?: string } | undefined,
  desc: string,
  t: (k: string) => string,
  delayMs = 450,
): void {
  if (op?.status !== 'blocked') {
    showQueuedToast(desc, delayMs);
    return;
  }
  setTimeout(() => {
    Toast.show({
      type: 'error2',
      position: 'bottom',
      visibilityTime: 5500,
      props: { desc: t('Saqlandi, lekin shu mijozning oldingi amali xato — Oflayn rejim sahifasida hal qiling') },
    });
  }, delayMs);
}

/**
 * 24.10: navbat (outbox) xatolari uchun aniq matn: to'lgan navbat / qurilma xotirasiga yozilmadi.
 * Boshqa xato bo'lsa — `null` (ekran o'z xabarini ko'rsatadi).
 */
export function outboxErrorText(error: unknown, t: (k: string) => string): string | null {
  if (error instanceof OutboxFullError) return t('Oflayn navbat to‘lgan — avval sinxronlang');
  if (error instanceof OutboxPersistError) return t('Qurilma xotirasiga yozib bo‘lmadi — amal saqlanmadi');
  return null;
}
