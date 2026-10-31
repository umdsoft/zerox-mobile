import React from 'react';
import { Text, View } from 'react-native';
import { CalendarIcon, ClockIcon } from '../../redesign/icons';
import { fmtDate, fmtDateTime, money } from './amaliyotLogic';
import { Row, Section } from './AmaliyotRows';
import { styles } from './amaliyotStyles';
import type { QarzAmaliyotState } from './useQarzAmaliyot';

/** 2. Amaliyot — qachon va KIM bajargan; 3. Qarz ma'lumotlari (FAQAT yangi qarz beruvchi amaliyotda, SS10). */
const AmaliyotDetails = ({ s }: { s: QarzAmaliyotState }) => {
  const { t, tx, dokonNomi } = s;
  const { isNewDebt, opMiqdor, valyuta, opBerilgan, opQaytarish, opMahsulot, statusColor, statusLabelKey } = s.view;
  const qarz = s.qarz;
  const statusLabel = t(statusLabelKey);
  return (
    <>
  <Section title={t('Amaliyot ma’lumotlari')} Icon={ClockIcon}>
        <Row label={t('Sana va vaqt')} value={fmtDateTime(tx?.created_at)} />
        {/* Kim bajargan: xodim bo'lsa uning telefoni, aks holda do'kon egasiniki.
            Backend `bajaruvchi_telefon` ni aynan shu qoida bilan hisoblaydi. */}
        <Row label={t('Kim bajargan')} value={tx?.bajaruvchi_telefon || '—'} />
        {/* 03.10 (3-band): amaliyot QAYSI DO'KONDA (savdo faoliyati) bajarilgan —
            barcha turlarda (qarz berildi / qaytarildi / voz kechildi). */}
        <Row label={t('Do‘kon')} value={dokonNomi || '—'} />
        {/* SS-C: yangi qarz amaliyotida `izoh` = mahsulot nomi, u quyida
            "Mahsulot yoki xizmat" qatorida ko'rsatiladi — takrorlamaymiz. */}
        {!!tx?.izoh && String(tx.izoh) !== String(opMahsulot || '') && (
          <Row label={t('Izoh')} value={String(tx.izoh)} />
        )}
      </Section>

      {/* 3. Qarz ma'lumotlari — FAQAT yangi qarz beruvchi amaliyotda.
          SS10 (2026-09-17): "Qarz qaytarildi" va "Qarzdan voz kechildi"
          amaliyotlarida bu bo'lim KERAK EMAS — u amaliyotning o'ziga emas,
          YIG'MA qarzga tegishli va chalkashlik tug'diradi (so'rov). */}
      {isNewDebt && (
      <Section title={t('Qarz ma’lumotlari')} Icon={CalendarIcon}>
        <Row label={t('Qarz summasi')} value={money(opMiqdor, valyuta)} />
        {/* "Qoldiq qarz" YIG'MA qarzniki — yangi qarz berish amaliyotida u
            boshqa amaliyotlarning summasini ham o'z ichiga oladi, shu bois
            bu ekranda ko'rsatilmaydi (so'rov: faqat shu amaliyot ma'lumoti). */}
        {!isNewDebt && (
          <Row label={t('Qoldiq qarz')} value={money(qarz?.qoldiq, qarz?.valyuta)} />
        )}
        <Row label={t('Berilgan sana')} value={fmtDate(opBerilgan)} />
        <Row label={t('Qaytarish sanasi')} value={fmtDate(opQaytarish)} />
        {/* Mahsulot/xizmat nomi — qarz berilayotganda ixtiyoriy kiritiladi. */}
        <Row
          label={t('Mahsulot yoki xizmat')}
          value={opMahsulot ? String(opMahsulot) : t('Kiritilmagan')}
        />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('Holati')}</Text>
          <View style={[styles.pill, { backgroundColor: statusColor + '1A' }]}>
            <Text style={[styles.pillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </Section>
      )}
    </>
  );
};

export default AmaliyotDetails;
