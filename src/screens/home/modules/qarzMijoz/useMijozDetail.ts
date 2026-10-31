import React from 'react';
import { Linking } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useQarzFetch } from '../../../../offline/useQarzFetch';
import { isOnline } from '../../../../offline/netStatus';
import { isUnsyncedId } from '../../../../offline/submit';
import { URL } from '../../../constants';
import { useQarzTalab } from '../qarzTalab';
import { usePlanFeatures } from '../planGate';
import { BLUE, GREEN } from './mijozLogic';
import { buildMijozSmsTemplates, deriveMijoz } from './mijozDerive';

/** "Mijoz tafsiloti" ekrani holati: history so'rovi, fokusda yangilash, hosila qiymatlar, amallar (yangi qarz / yopish / talab / voz kechish). */
export function useMijozDetail() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const id = route.params?.id;
  const turi: 'berish' | 'olish' = route.params?.turi === 'olish' ? 'olish' : 'berish';
  const fishParam: string = route.params?.fish || '';

  const accent = turi === 'olish' ? GREEN : BLUE;
  const accentBg = turi === 'olish' ? '#F0FDF4' : '#EFF6FF';

  const { data, loading, onRefresh, error, offline } = useQarzFetch({
    url: `${URL}/qarz-daftari/mijozlar/${id}/history`,
    method: 'GET',
  });

  // SS6: yangi qarz qo'shib qaytilganda jami summa VA qarzlar ro'yxati YANGILANSIN. Birinchi fokus o'tkazib yuboriladi.
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      onRefresh({});
    }, [onRefresh]),
  );

  const v = deriveMijoz(data, turi, fishParam, t);
  const { mijoz, fish, telefon, dokonNomi, qoldiqUzs, qoldiqUsd, lastActiveQarz } = v;

  // 02.10: Free / muddati tugagan tarifda talab (qo'lda SMS) YOPIQ — oldindan qulf.
  const plan = usePlanFeatures();
  // 03.10: SMS darhol ketmaydi — karta tekshiruvi + "Talab SMS yuborilsinmi?" (qarzTalab.useQarzTalab).
  // 16.10: talab ruxsati — do'kon EGASINING tarifi (xodim rejimida ham qulf to'g'ri)
  const talab = useQarzTalab({ t, navigation, plan, faoliyatId: mijoz?.savdo_faoliyat_id });
  const talabLoading = talab.demanding;
  const talabQil = () => {
    if (talabLoading) return;
    if (!lastActiveQarz?.id) return;
    talab.start({
      id: lastActiveQarz.id,
      faoliyatId: mijoz?.savdo_faoliyat_id,
      faoliyatNomi: dokonNomi,
      amount: lastActiveQarz.qoldiq != null ? lastActiveQarz.qoldiq : lastActiveQarz.miqdor,
      valyuta: lastActiveQarz.valyuta,
    });
  };

  const goYangi = () => {
    if (!mijoz?.savdo_faoliyat_id || !mijoz?.id) {
      Toast.show({ type: 'error2', props: { desc: t('Mijoz ma’lumotlari topilmadi') } });
      return;
    }
    navigation.navigate('QarzDaftariYangi', {
      faoliyat_id: mijoz.savdo_faoliyat_id,
      mijoz_id: mijoz.id,
      fish,
      turi,
      // SS7-2: formadagi mijoz cardi qoldiqni ko'rsatadi.
      qoldiq_uzs: qoldiqUzs,
      qoldiq_usd: qoldiqUsd,
    });
  };

  /**
   * 03.10: amal tugmalari Shaxsiy qarzdagidek. Aktiv qarz bo'lmasa tugma kulrang, lekin BOSILADI — sababi toast'da.
   * Yopish/voz kechish ENG OXIRGI aktiv qarzga, talab — useQarzTalab oqimi.
   */
  const hint = (msg: string) => Toast.show({ type: 'error2', visibilityTime: 3500, props: { desc: msg } });
  const noActive = !lastActiveQarz;
  const talabOff = noActive || !telefon;
  const onYopish = () => {
    if (!lastActiveQarz) {
      hint(t('Aktiv qarzlar yo‘q'));
      return;
    }
    // 18.10: mijoz kartasidan — JAMI qoldiq bo'yicha yopish (oxirgi qarz qoldig'i EMAS).
    navigation.navigate('QarzDaftariYopish', {
      mode: 'mijoz',
      mijoz_id: mijoz?.id || id,
      turi,
      valyuta: qoldiqUzs > 0 ? 'UZS' : qoldiqUsd > 0 ? 'USD' : lastActiveQarz.valyuta,
      id: lastActiveQarz.id,
    });
  };
  const onTalab = () => {
    if (!lastActiveQarz) {
      hint(t('Aktiv qarzlar yo‘q'));
      return;
    }
    // 23.10 (oflayn rejim): talab SMS navbatga QO'YILMAYDI — oldindan ko'rish va tarif tekshiruvi server bilan.
    if (!isOnline() || isUnsyncedId(lastActiveQarz.id) || isUnsyncedId(id)) {
      hint(t('Talab SMS faqat internet bilan (sinxronlangan qarz uchun) yuboriladi'));
      return;
    }
    if (!telefon) {
      hint(t('Mijoz telefoni yo‘q'));
      return;
    }
    talabQil();
  };
  const onVozKechish = () => {
    if (!lastActiveQarz) {
      hint(t('Aktiv qarzlar yo‘q'));
      return;
    }
    navigation.navigate('QarzDaftariVozKechish', { id: lastActiveQarz.id });
  };

  /**
   * SMS ikonkasi — avval holatga mos TAYYOR SHABLONLAR oynasi (SmsTemplateSheet); SMS ilovasi faqat shablon tanlangandan keyin
   * ochiladi (29.09 hujjat, 3-band).
   */
  const [showSms, setShowSms] = React.useState(false);
  const smsTemplates = showSms ? buildMijozSmsTemplates(t, turi, v) : [];

  return {
    t,
    navigation,
    id,
    turi,
    fishParam,
    accent,
    accentBg,
    data,
    loading,
    error,
    offline,
    onRefresh,
    v,
    talabLocked: talab.locked,
    talabLoading,
    talabModal: talab.modal,
    noActive,
    talabOff,
    goYangi,
    onYopish,
    onTalab,
    onVozKechish,
    showSms,
    setShowSms,
    smsTemplates,
    call: () => Linking.openURL(`tel:${telefon}`),
  };
}
