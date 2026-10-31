/**
 * QarzDaftariKalendar.tsx — SS5-3 (2026-09-21): QARZ DAFTARI kalendari.
 *
 * So'rov: "Muddati yaqin olingan qarzlar kartasidan so'ng xuddi shaxsiy moliya
 * sahifasidagidek kalendar va kunlik-oylik hisobotlarni joylashtirish kerak.
 * Bu kalendar orqali qarz beruvchi 1 kunda, 1 haftada va 1 oyda qancha miqdorda
 * qarz berib, qancha miqdorda qarzni undirishga muvaffaq bo'lganini ko'rishi
 * mumkin bo'ladi."
 *
 * Ko'rinish AYNAN "Shaxsiy moliya" kalendariga mos (FinanceCalendarCard) —
 * uslublar undan olingan, faqat mazmun boshqa:
 *   SS-DEV (2026-09-24): QIZIL = BERILGAN qarz (pul chiqdi),
 *   YASHIL = UNDIRILGAN (qaytdi). Ilgari teskari (berilgan yashil, undirilgan
 *   ko'k) edi — "Yangi mobil xatolar" 6-band bo'yicha almashtirildi: legend,
 *   kun katakchalari, jami kartalar va hisobot summalari — hammasi mos.
 *
 * Ma'lumot: GET /qarz-daftari/kalendar?year=&month=&valyuta=
 * (yangi endpoint — ilgari kunlik kesim umuman mavjud emas edi).
 *
 * SS-DEV (2026-09-24): "Hisobot" kartasidagi KUN va HAFTA qatorlari
 * BOSILADIGAN bo'ldi — pastdan chiqadigan varaq (bottom sheet) ochilib,
 * saytdagi "Kun tahlili" kabi o'sha kun (yoki haftaning 7 kuni) uchun
 * BERILGAN va UNDIRILGAN qarzlar ro'yxati (mijoz, do'kon, summa, vaqt)
 * ko'rsatiladi. Manba: GET /qarz-daftari/kalendar/kun?date=YYYY-MM-DD&valyuta=
 * (hafta uchun 7 kun parallel so'ralib birlashtiriladi). 28.09: qator bosilsa
 * amaliyot tafsiloti (QarzDaftariAmaliyot) ochiladi — ilgari QarzDaftariQarz edi.
 *
 * ⚠️ Valyutalar QO'SHILMAYDI: UZS va USD ni bitta songa jamlash ma'nosiz,
 * shu bois yuqorida valyuta tanlagich turadi.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import CalendarGrid from './kalendar/CalendarGrid';
import CalendarHeader from './kalendar/CalendarHeader';
import CalendarReport from './kalendar/CalendarReport';
import VaraqSheet from './kalendar/VaraqSheet';
import { styles } from './kalendar/kalendarStyles';
import { useKalendarData } from './kalendar/useKalendarData';
import { useVaraq } from './kalendar/useVaraq';

const QarzDaftariKalendar = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const k = useKalendarData();
  const v = useVaraq({
    y: k.y,
    m: k.m,
    cur: k.cur,
    bazaKun: k.bazaKun,
    haftaBosh: k.haftaBosh,
    haftaOxir: k.haftaOxir,
    t,
    navigation,
  });

  return (
    <View style={styles.wrap}>
      <CalendarHeader
        m={k.m}
        y={k.y}
        cur={k.cur}
        setCur={k.setCur}
        changeMonth={k.changeMonth}
        totBer={k.totBer}
        totUnd={k.totUnd}
      />

      <CalendarGrid
        offlineErr={k.offlineErr}
        cells={k.cells}
        byDay={k.byDay}
        maxBer={k.maxBer}
        selDay={k.selDay}
        setSelDay={k.setSelDay}
      />

      <CalendarReport
        m={k.m}
        y={k.y}
        cur={k.cur}
        bazaKun={k.bazaKun}
        haftaBosh={k.haftaBosh}
        haftaOxir={k.haftaOxir}
        kunBer={k.kunBer}
        kunUnd={k.kunUnd}
        haftaBer={k.haftaBer}
        haftaUnd={k.haftaUnd}
        totBer={k.totBer}
        totUnd={k.totUnd}
        openVaraq={v.openVaraq}
      />

      {k.selDay == null ? (
        <Text allowFontScaling={false} style={styles.calHint}>
          {t('Kunni tanlang — o‘sha kungi berilgan va undirilgan qarz ko‘rinadi.')}
        </Text>
      ) : null}

      <VaraqSheet
        varaq={v.varaq}
        closeVaraq={v.closeVaraq}
        openVaraq={v.openVaraq}
        cur={k.cur}
        varaqBer={v.varaqBer}
        varaqUnd={v.varaqUnd}
        varaqJamiBer={v.varaqJamiBer}
        varaqJamiUnd={v.varaqJamiUnd}
        varaqLoading={v.varaqLoading}
        varaqErr={v.varaqErr}
        opening={v.opening}
        goAmaliyot={v.goAmaliyot}
      />
    </View>
  );
};

export default QarzDaftariKalendar;
