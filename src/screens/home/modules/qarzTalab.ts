/**
 * qarzTalab.ts — "Qaytarishni talab qilish" (POST /qarz-daftari/qarz/:id/talab)
 * xatolarini foydalanuvchiga TUSHUNARLI qilib ko'rsatish.
 *
 * 29.09 (3-band): ilgari faqat 3 ta kod tanilardi, qolgan HAMMASI "Xatolik yuz
 * berdi" edi. Backend kontrakti (qarzDaftari.controller.js `talab`):
 *   402 no-sms-package — SMS paket tugagan
 *   428 no-card        — plastik karta kiritilmagan (`can_set_card` — egasimi)
 *   400 sms-not-sent   — SMS provayderi (Eskiz) rad etdi (`reason`)
 *   400 no-phone / not-active / wrong-type, 429 — juda ko'p urinish
 * Mijoz sahifasi (QarzDaftariMijoz) va qarz sahifasi (QarzDaftariQarz) — YAGONA mantiq.
 */
import Toast from 'react-native-toast-message';

type Ctx = {
  t: (k: string) => string;
  navigation: { navigate: (name: string, params?: object) => void };
  faoliyatId?: number | string | null;
  faoliyatNomi?: string;
};

const MSG_BY_CODE: Record<string, string> = {
  'no-sms-package': 'SMS paket yetarli emas',
  'no-phone': 'Mijoz telefoni yo‘q',
  'not-active': 'Faqat aktiv qarz uchun talab yuborish mumkin',
  'wrong-type': 'Talab faqat siz bergan qarzlar uchun yuboriladi',
  'sms-not-sent': 'SMS yuborilmadi. Birozdan so‘ng qayta urinib ko‘ring.',
  'sms-failed': 'SMS yuborilmadi. Birozdan so‘ng qayta urinib ko‘ring.',
};

export const showTalabError = (error: any, { t, navigation, faoliyatId, faoliyatNomi }: Ctx) => {
  const res = error?.response;
  const code: string | undefined = res?.data?.code;

  // Karta kiritilmagan — egasini to'g'ridan-to'g'ri karta ekraniga olib o'tamiz.
  if (code === 'no-card') {
    const canSet = !!res?.data?.can_set_card && faoliyatId != null;
    Toast.show({
      type: 'error2',
      props: {
        desc: t(
          canSet
            ? 'Talab SMS’ida karta ko‘rsatilishi uchun plastik karta raqamini kiriting.'
            : 'Do‘kon egasi plastik karta raqamini kiritishi kerak.',
        ),
      },
    });
    if (canSet) {
      navigation.navigate('QarzDaftariKarta', {
        faoliyat_id: faoliyatId,
        faoliyat_nomi: faoliyatNomi,
      });
    }
    return;
  }

  let desc = 'Xatolik yuz berdi';
  if (!res) desc = 'Internet aloqasini tekshiring';
  else if (res.status === 429) desc = 'Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.';
  else if (code && MSG_BY_CODE[code]) desc = MSG_BY_CODE[code];
  Toast.show({ type: 'error2', props: { desc: t(desc) } });
};
