/**
 * QarzDaftariAmaliyot.tsx — BITTA amaliyot (tranzaksiya) tafsiloti.
 *
 * SS9-2 (2026-09-14): "Amaliyotlar tarixi" ro'yxatidagi har bir qator bosiladigan — shu ekran ochiladi va amaliyot
 * bo'yicha BARCHA ma'lumot ko'rsatiladi: qanday amaliyot, qancha summa, QACHON va KIM (qaysi telefon raqami)
 * bajargan, qarz berilganda qayd etilgan mahsulot/xizmat nomi, bo'lib to'lash qarzlarida bo'lib to'lash sharti va
 * qarzning joriy holati.
 *
 * ⚠️ Qo'shimcha API so'rovi YO'Q (do'kon nomi va bo'lib to'lash grafigidan tashqari): tranzaksiya va unga tegishli
 * qarz obyektlari chaqiruvchi ekranda (`/qarz-daftari/mijozlar/:id/history`) allaqachon yuklangan, shu bois route
 * params orqali uzatiladi. Route params: { tx, qarz, mijoz }
 *
 * 01.11 (wave B): bo'lindi — sof mantiq qarzAmaliyot/amaliyotLogic.ts, ma'lumot+amallar qarzAmaliyot/useQarzAmaliyot.ts,
 * ko'rinish qarzAmaliyot/*.tsx. Xulq o'zgarmagan (__tests__/qarz_daftari_amaliyot.test.tsx).
 */
import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { rd } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import AmaliyotActions from './qarzAmaliyot/AmaliyotActions';
import AmaliyotDetails from './qarzAmaliyot/AmaliyotDetails';
import AmaliyotHero from './qarzAmaliyot/AmaliyotHero';
import AmaliyotPayModal from './qarzAmaliyot/AmaliyotPayModal';
import AmaliyotReceiptModal from './qarzAmaliyot/AmaliyotReceiptModal';
import BolibSection from './qarzAmaliyot/BolibSection';
import { styles } from './qarzAmaliyot/amaliyotStyles';
import { useQarzAmaliyot } from './qarzAmaliyot/useQarzAmaliyot';

// Eski import yo'li saqlanadi (testlar `QarzDaftariAmaliyot.fmtDate/fmtDateTime` ni ishlatadi).
export { fmtDate, fmtDateTime } from './qarzAmaliyot/amaliyotLogic';

const QarzDaftariAmaliyot = () => {
  const s = useQarzAmaliyot();
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={s.t('Amaliyot tafsiloti')} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AmaliyotHero s={s} />
        <AmaliyotDetails s={s} />
        <BolibSection s={s} />
        <AmaliyotPayModal s={s} />
        <AmaliyotActions s={s} />
      </ScrollView>

      <AmaliyotReceiptModal s={s} />
    </View>
  );
};

export default QarzDaftariAmaliyot;
