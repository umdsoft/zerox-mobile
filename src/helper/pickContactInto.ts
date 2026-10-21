/**
 * pickContactInto.ts — 21.10: kontakt-tanlagichdan F.I.Sh + telefonni formaga to'ldirish
 * (YAGONA manba). Ilgari bir xil mantiq QarzDaftariMijozYangi, QarzDaftariXodimYangi va
 * FinanceDebtAdd'da alohida nusxa edi.
 *
 *  - Bekor qilinsa — jim.
 *  - Tanlagich ochilmasa (native xato) — "Kontaktlarni ochib bo'lmadi" toast.
 *  - Xorijiy raqam — `phone9` bo'sh keladi (telefon maydoni buzilmaydi), ism baribir
 *    to'ldiriladi va "O'zbekiston formatiga mos emas" ogohlantirishi ko'rsatiladi.
 */
import { t } from 'i18next';
import Toast from 'react-native-toast-message';
import {
  isContactPickerAvailable,
  pickContactResult,
  PickedContact,
} from '../nativemodule/contactPicker';

export { isContactPickerAvailable };

export const pickContactInto = async (apply: (c: PickedContact) => void): Promise<void> => {
  const r = await pickContactResult();
  if (r.status === 'cancel') return;
  if (r.status !== 'ok') {
    Toast.show({ type: 'error2', props: { desc: t('Kontaktlarni ochib bo‘lmadi') } });
    return;
  }
  apply(r.contact);
  if (!r.contact.isUzPhone) {
    Toast.show({
      type: 'error2',
      props: { desc: t('Tanlangan raqam O‘zbekiston formatiga mos emas') },
    });
  }
};
