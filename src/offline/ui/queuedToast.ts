/**
 * "Oflayn saqlandi" xabari — navigatsiyadan KEYIN ko'rsatiladi.
 * App.tsx har navigatsiyada `Toast.hide()` qiladi (helper/finishAction.toastAfterBack izohiga qarang),
 * shuning uchun toast goBack/replace dan oldin ko'rsatilsa, foydalanuvchi uni ko'rmay qoladi —
 * oflayn rejimda esa "saqlandi, keyin yuboriladi" xabari muhim.
 */
import Toast from 'react-native-toast-message';

export function showQueuedToast(desc: string, delayMs = 450): void {
  setTimeout(() => {
    Toast.show({ type: 'omad', position: 'bottom', visibilityTime: 4000, props: { desc } });
  }, delayMs);
}
