import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { isUsd } from '../../../../helper/money';
import { CalendarIcon } from '../../redesign/icons';
import { fmtDate, money, scheduleRowState } from './amaliyotLogic';
import { Section, Row } from './AmaliyotRows';
import { styles } from './amaliyotStyles';
import type { QarzAmaliyotState } from './useQarzAmaliyot';

/** 4. Bo'lib to'lash — faqat shunday qarzlarda: shartlar + MUDDATLI TO'LOV GRAFIGI (SS4) va "To'lovni kiritish" (SS3-1). */
const BolibSection = ({ s }: { s: QarzAmaliyotState }) => {
  const { t, qarz, grafik, grafikLoading, grafikMissing, openPay } = s;
  const { bolib, oylar, boshlangich, oylik } = s.view;
  if (!bolib) return null;
  return (
    <Section title={t('Bo‘lib to‘lash')} Icon={CalendarIcon}>
      <Row label={t('Oylar soni')} value={`${oylar} ${t('oy')}`} />
      <Row label={t('Boshlang‘ich to‘lov')} value={money(boshlangich, qarz?.valyuta)} />
      <Row label={t('Oylik to‘lov')} value={money(isUsd(qarz?.valyuta) ? oylik : Math.round(oylik), qarz?.valyuta)} />

      {/* 24.10: grafik keshda yo'q / yuklanmadi — aniq izoh (jim bo'sh joy emas). */}
      {!grafik.length && !grafikLoading && grafikMissing && (
        <Text style={styles.grafikNote}>
          {grafikMissing === 'offline'
            ? t('Bu ma’lumot oflayn saqlanmagan — internet tiklanganda yuklanadi')
            : t('Ma’lumotni yuklab bo‘lmadi')}
        </Text>
      )}

      {/* SS4: TO'LOV GRAFIGI — har oyning holati bilan. */}
      {!!grafik.length && (
        <View style={styles.schedule}>
          <Text allowFontScaling={false} style={styles.scheduleTitle}>
            {t('To‘lov grafigi')}
          </Text>
          {/* SS3-1: saytdagidek USTUN SARLAVHALARI. */}
          <View style={styles.schHead}>
            <Text allowFontScaling={false} style={[styles.schHeadText, { width: rs(26) }]}>#</Text>
            <Text allowFontScaling={false} style={[styles.schHeadText, { flex: 1 }]}>
              {t('To‘lov sanasi')}
            </Text>
            <Text allowFontScaling={false} style={[styles.schHeadText, styles.schColAmt, styles.schHeadAmt]}>
              {t('Summa')}
            </Text>
          </View>
          {grafik.map((g: any, i: number) => {
            const { paid, color, label } = scheduleRowState(g, t);
            return (
              <View key={g?.id ?? i} style={styles.schRow}>
                <View style={[styles.schNo, { backgroundColor: color + '1A' }]}>
                  <Text allowFontScaling={false} style={[styles.schNoText, { color }]}>
                    {g?.tartib_raqami ?? i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text allowFontScaling={false} style={styles.schDate}>
                    {fmtDate(g?.tolov_sanasi)}
                  </Text>
                  <View style={[styles.schBadge, { backgroundColor: color + '18' }]}>
                    <Text allowFontScaling={false} style={[styles.schStatus, { color }]}>
                      {label}
                    </Text>
                  </View>
                </View>
                <View style={styles.schColAmt}>
                  <Text allowFontScaling={false} style={styles.schAmount} numberOfLines={1}>
                    {money(g?.summa, qarz?.valyuta)}
                  </Text>
                  {/* SS3-1: to'lanmagan bo'lakda amal tugmasi. */}
                  {!paid && (
                    <TouchableOpacity activeOpacity={0.85} style={styles.schPayBtn} onPress={() => openPay(g)}>
                      {/* SS-DEV (2026-09-23): tugma matni AMAL nomi + konturli ko'rinish (ilgari "To'landi" edi). */}
                      <Text allowFontScaling={false} style={styles.schPayText}>
                        {t('To‘lovni kiritish')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Section>
  );
};

export default BolibSection;
