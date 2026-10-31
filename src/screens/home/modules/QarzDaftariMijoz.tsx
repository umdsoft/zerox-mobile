/**
 * QarzDaftariMijoz.tsx — "Mijoz tafsiloti" (web pages/qarz-daftari/mijoz/_id/index.vue).
 *
 * Bitta mijozning qarz oldi-berdi tafsiloti:
 *   GET /qarz-daftari/mijozlar/:id/history → mijoz + stats + qarzlar + tranzaksiyalar.
 *
 * Route params: { id, turi, fish }. accent = turi==='olish' ? YASHIL : KO'K.
 *
 * Web rang semantikasi: berish/berilgan = KO'K, olish/olingan = YASHIL, muddati o'tgan = QIZIL.
 */
import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { isUnsyncedId, resolveLocalId } from '../../../offline/submit';
import OfflineBanner from '../../../offline/ui/OfflineBanner';
import NotSavedOffline, { isDerivedBody, PartialDataNote } from '../../../offline/ui/NotSavedOffline';
import { rd } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { creationParams } from './qarzAmaliyot';
import DemandConfirmModal from '../../components/DemandConfirmModal';
import SmsTemplateSheet from '../../components/SmsTemplateSheet';
import QarzMijozTavsiyaCard from './QarzMijozTavsiyaCard'; // 21.10: Tavsiya kartasi (sayt bilan bir xil)
import ActiveQarzList from './qarzMijoz/ActiveQarzList';
import ClientCard from './qarzMijoz/ClientCard';
import HistoryLink from './qarzMijoz/HistoryLink';
import MijozActions from './qarzMijoz/MijozActions';
import SumCards from './qarzMijoz/SumCards';
import { styles } from './qarzMijoz/mijozStyles';
import { useMijozDetail } from './qarzMijoz/useMijozDetail';

export { fmtDate } from './qarzMijoz/mijozLogic';

const QarzDaftariMijoz = () => {
  const m = useMijozDetail();
  const { navigation, v, id, turi, accent } = m;

  if (m.loading) return <Loading />;

  // 24.10: mijoz tarixi oflayn saqlanmagan / yuklanmadi — "0 qarz, aktiv qarzlar yo'q" EMAS
  // (bu yolg'on bo'lardi va yopish/voz kechish tugmalari noto'g'ri holatda turardi).
  if (m.error) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        <RdHeader title={v.role.label} />
        <OfflineBanner />
        <NotSavedOffline offline={m.offline} onRetry={() => m.onRefresh({})} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS-A2: sarlavha turiga qarab — Berilgan qarzda "Qarz oluvchi", Olingan qarzda "Qarz beruvchi". */}
      <RdHeader title={v.role.label} />
      <OfflineBanner />
      {/* 24.10: saqlangan ro'yxatdan hosil qilingan tarix — summalar taxminiy bo'lishi mumkin. */}
      {isDerivedBody(m.data) && <PartialDataNote style={styles.partialNote} />}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ClientCard
          mijoz={v.mijoz}
          fish={v.fish}
          telefon={v.telefon}
          dokonNomi={v.dokonNomi}
          accent={accent}
          accentBg={m.accentBg}
          actions={
            <MijozActions
              turi={turi}
              noActive={m.noActive}
              talabOff={m.talabOff}
              talabLoading={m.talabLoading}
              talabLocked={m.talabLocked}
              goYangi={m.goYangi}
              onYopish={m.onYopish}
              onTalab={m.onTalab}
              onVozKechish={m.onVozKechish}
            />
          }
          onEdit={() =>
            navigation.navigate('QarzDaftariMijozYangi', {
              edit: true,
              mijoz_id: v.mijoz?.id ?? id,
              faoliyat_id: v.mijoz?.savdo_faoliyat_id,
              fish: v.mijoz?.fish || m.fishParam,
              telefon: v.telefon,
              turi,
            })
          }
          onSms={() => m.setShowSms(true)}
          onCall={m.call}
        />

        <SumCards turi={turi} accent={accent} sum={v.sum} sumValueSize={v.sumValueSize} sumSubSize={v.sumSubSize} />

        <HistoryLink
          onPress={() => navigation.navigate('QarzDaftariAmaliyotlar', { mijoz_id: v.mijoz?.id ?? id, turi })}
        />

        <ActiveQarzList
          aktivQarzlar={v.aktivQarzlar}
          accent={accent}
          onOpen={q =>
            navigation.navigate('QarzDaftariAmaliyot', {
              ...creationParams(q, v.tranzaksiyalar),
              mijoz: v.mijoz,
            })
          }
        />

        {/* 21.10: sahifa oxirida "Tavsiya" — saytdagi mijoz sahifasi bilan bir xil (GET .../mijozlar/:id/tavsiya). */}
        {/* 23.10: oflayn yaratilgan (hali server id'siz) mijozda tavsiya so'ralmaydi. */}
        <QarzMijozTavsiyaCard mijozId={isUnsyncedId(id) ? null : resolveLocalId(id)} />
      </ScrollView>

      {/* SS-DEV (2026-09-29): SMS ikonkasi → avval tayyor shablonlar oynasi. */}
      <SmsTemplateSheet
        visible={m.showSms}
        onClose={() => m.setShowSms(false)}
        phone={v.telefon}
        templates={m.smsTemplates}
      />
      {/* 03.10: "Talab SMS yuborilsinmi?" — OK yuboradi, X yubormaydi, kartani o'zgartirish. */}
      {/* 21.10: karta yo'q izohi (egasi/xodim) va "Boshqa ko'rsatilmasin" (30 kun) — talab.modal ichida (qarzTalab.ts). */}
      <DemandConfirmModal {...m.talabModal} />
    </View>
  );
};

export default QarzDaftariMijoz;
