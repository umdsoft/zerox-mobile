import { Toast } from 'react-native-toast-message/lib/src/Toast';

/**
 * O'qish vaqti — toast matni UZUNLIGIGA MUTANOSIB (uzun matn = ko'proq vaqt).
 * ~55ms/belgi + baza; 1.6s..4.5s oralig'iда cheklangan.
 */
const readMsFor = (text?: string) => {
  const len = String(text || '').trim().length;
  return Math.min(4500, Math.max(1600, 700 + len * 55));
};

/**
 * Amal muvaffaqiyatли tugagach: TOAST ko'rsatiladi -> foydalanuvchi O'QIShGA
 * ulguradi (matn uzunligiga qarab) -> toast YO'QOLADI -> so'ng (fade tugagach)
 * HOME ochiladi. Sahifalar QOTMAYDI (navigate, reset EMAS).
 *
 * SHART: chaqiruvчi success toast'ni `autoHide: false` bilan ko'rsatadi (toast
 * o'zi erta o'chmasin — biz hide qilamiz), va toast matnini `desc` sifatida
 * uzatadi (o'qish vaqti shunга qarab hisoblanadi).
 */
/**
 * Amal tugagach ORQAGA qaytib, SO'NG muvaffaqiyat toastini ko'rsatish.
 *
 * 🔴 NEGA KERAK: `App.tsx` navigatsiya 'state' listeneri HAR navigatsiyada
 * `Toast.hide()` chaqiradi (osilib qolgan toastlarga qarshi global himoya).
 * Shu sabab `Toast.show(...)` dan keyin darhol `goBack()` qilinsa, toast
 * ko'rinmasdan o'chib ketadi — foydalanuvchi hech narsa ko'rmaydi.
 * Yechim: avval navigatsiya, keyin (holat o'rnashgach) toast.
 */
export const toastAfterBack = (
  navigation: any,
  show: () => void,
  delayMs = 420,
) => {
  navigation.goBack();
  setTimeout(show, delayMs);
};

export const goHomeSmooth = (navigation: any, desc?: string) => {
  const readMs = readMsFor(desc);
  setTimeout(() => {
    Toast.hide(); // fade boshlanadi (~250-300ms)
    setTimeout(() => {
      navigation.navigate('BottomTabNavigator'); // toast yo'qolgach HOME
    }, 350);
  }, readMs);
};
