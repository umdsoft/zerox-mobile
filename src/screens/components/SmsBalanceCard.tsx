import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { t } from 'i18next';
import { rd, rs } from '../../theme/rd';
import { useFetch } from '../../hooks/useFetch';
import { URL } from '../constants';
import { StarIcon, MessageIcon, ChevronRight } from '../home/redesign/icons';

/**
 * SMS balans kartasi — "Tariflar" (Types.tsx) va "Mobil hisob" (UserMoneyResult.tsx)
 * ekranlarida BIR XIL ko'rinishi uchun umumiy komponentga ajratildi. Ma'lumot
 * /qarz-daftari/sms-balance dan olinadi; "SMS xabarlar tarixi" -> SmsHistory ekrani.
 */
const SmsBalanceCard = () => {
  const navigation = useNavigation<any>();
  const smsRes = useFetch({ method: 'GET', url: URL + '/qarz-daftari/sms-balance' });
  const smsB: any = (smsRes.data as any)?.data || {};
  const smsTotal = Number(smsB.total || 0);
  const smsRemaining = Number(smsB.remaining || 0);
  const smsUsed = Number(smsB.used ?? Math.max(smsTotal - smsRemaining, 0));
  const smsBarPct =
    smsTotal > 0 ? Math.min(100, Math.round((smsUsed / smsTotal) * 100)) : 0;

  return (
    // BUTUN karta bosiladi -> SMS xabarlar tarixi (so'rov bo'yicha: kartaning istalgan
    // qismiga bosilса ochilsin). Ko'rinishi 3 ta menyu kartasidan biroz FARQ qiladi
    // (yumshoq ko'k tint fon).
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate('SmsHistory')}
      style={styles.smsCard}
    >
      <View style={styles.smsTop}>
        <View style={styles.smsStar}>
          <StarIcon size={rs(16)} color="#f5a623" />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.smsLabel}>
            {t('SMS balansingiz')}
          </Text>
          <Text allowFontScaling={false} style={styles.smsPlan}>
            {t('Jami {{n}} ta SMS yuborilgan', { n: smsUsed })}
          </Text>
        </View>
        <View style={styles.smsCountWrap}>
          <Text allowFontScaling={false} style={styles.smsCount}>
            {`${smsRemaining} / ${smsTotal}`}
          </Text>
          <Text allowFontScaling={false} style={styles.smsCountLabel}>
            {t('SMS qoldi')}
          </Text>
        </View>
      </View>
      <View style={styles.smsBarTrack}>
        <View style={[styles.smsBarFill, { width: `${smsBarPct}%` }]} />
      </View>
      {/* Butun karta bosiladigan bo'lgani uchun bu endi TUGMA emas — vizual ko'rsatma
          (o'ngда chevron). */}
      <View style={styles.smsHistoryRow}>
        <View style={styles.smsHistoryLeft}>
          <MessageIcon size={rs(15)} color={rd.color.primary} />
          <Text allowFontScaling={false} style={styles.smsHistoryText}>
            {t('SMS xabarlar tarixi')}
          </Text>
        </View>
        <ChevronRight size={rs(18)} color={rd.color.primary} />
      </View>
    </TouchableOpacity>
  );
};

export default SmsBalanceCard;

const styles = StyleSheet.create({
  // Yuqoridagi 3 ta oq menyu kartasidan biroz FARQ qiladi: yumshoq ko'k tint fon.
  smsCard: {
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.primaryBorder ?? rd.color.border,
    padding: rs(16),
    marginTop: rs(18),
    marginBottom: rs(6),
  },
  smsTop: { flexDirection: 'row', alignItems: 'center' },
  smsStar: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(12),
    backgroundColor: '#fdf2df',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  smsLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  smsPlan: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    marginTop: rs(1),
  },
  smsCountWrap: { alignItems: 'flex-end' },
  smsCount: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    color: rd.color.primary,
  },
  smsCountLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(10.5),
    color: rd.color.textTertiary,
    marginTop: -rs(2),
  },
  smsBarTrack: {
    height: rs(7),
    borderRadius: rs(4),
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(14),
    overflow: 'hidden',
  },
  smsBarFill: {
    height: '100%',
    width: '100%',
    borderRadius: rs(4),
    backgroundColor: rd.color.primary,
  },
  smsHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12),
  },
  smsHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
  },
  smsHistoryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.primary,
  },
});
