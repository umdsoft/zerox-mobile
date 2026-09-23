import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';

import ScreenLayout from '../../components/ScreenLayout';
import DebitorList from '../../components/List/DebitorList';
import StatisticDebitor from '../../components/List/StatisticDebitor';
import Dollar from '../../../images/Dollar';
import AskTime from '../../../images/AskTime';
import CharityDollar from '../../../images/CharityDollar';
import {rd, rs} from '../../../theme/rd';
import {t} from 'i18next';

const Debitor = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {type, item, status, person, isHave, report} = route.params;

  // HISOBOT (report) rejimida TUGALLANGAN (status===2) yoki RAD etilган (3/4)
  // kontraktда amal tugmalari (qaytarishni talab / muddat uzaytirish / voz kechish)
  // YASHIRILADI — bu shartnomalar yakunlangan, ular ustidan amal bajarib bo'lmaydi.
  // Faol ro'yxatда (report yo'q) esa tugmalar avvalgidek ko'rinadi.
  const hideActions = !!report && [2, 3, 4].includes(Number(item?.status));

  return (
    <ScreenLayout title={t('153').replace('\n', ' ')}>
      {/* FAOL qarz -> DETAIL variant (saytdagi modal bilan bir xil: Qaytarilgan,
          Qoldiq qarz miqdori, Qarz berilgan sana, Qarzni qaytarish sanasi). Ilgari
          `type===1` doim STATISTIC ko'rsatardi — unda Qoldiq va Qaytarish sanasi YO'Q
          edi. Faqat TUGALLANGAN (status===2) bo'lsa hisobot-uslub statistic qoldiriladi. */}
      {item?.status === 2 ? (
        <StatisticDebitor
          type={type}
          item={item}
          status={status}
          person={person}
          isHave={isHave}
        />
      ) : (
        <DebitorList
          type={type}
          item={item}
          status={status}
          person={person}
          isHave={isHave}
        />
      )}

      {/* Amal tugmalari (so'rov bo'yicha, saytdagidek): "Qarzni qaytarishni talab
          qilish", "Qarz muddatini uzaytirish", "Qarzdan voz kechish". Ilgari `type===1`
          (Berilgan qarz) da YASHIRILGAN edi (redizayn statistic-rejim) — endi BERILGAN
          qarz kontrakt-detalида ham ko'rinadi. Amal ekranlari (FullDebtSelect/
          DebtDateLength/CharityDebt) allaqachon mavjud va ro'yxatdan o'tgan. */}
      {/* SS18: KREATIV joylashuv — asosiy amal (talab qilish) to'liq kenglikda,
          ikkilamchi 2 amal (uzaytirish/voz kechish) yonma-yon, rang bilan ajratilган. */}
      {!hideActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('FullDebtSelect', {item: item})}
            activeOpacity={0.85}
            style={styles.primaryBtn}>
            <Dollar />
            <Text allowFontScaling={false} style={styles.primaryText} numberOfLines={1} adjustsFontSizeToFit>
              {t('351')}
            </Text>
          </TouchableOpacity>
          <View style={styles.secRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('DebtDateLength', {item: item, id: item.id})}
              activeOpacity={0.85}
              style={[styles.secBtn, {backgroundColor: rd.color.primary}]}>
              <AskTime />
              <Text allowFontScaling={false} style={styles.secText} numberOfLines={2}>
                {t('363')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('CharityDebt', {item: item})}
              activeOpacity={0.85}
              style={[styles.secBtn, {backgroundColor: rd.color.primary}]}>
              <CharityDollar />
              <Text allowFontScaling={false} style={styles.secText} numberOfLines={2}>
                {t('378')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};

export default Debitor;

const styles = StyleSheet.create({
  // SS18: kreativ amal-tugmalar joylashuvi
  actions: {
    paddingHorizontal: rs(16),
    marginTop: rs(16),
    gap: rs(12),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    paddingVertical: rs(16),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
  },
  primaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.onPrimary,
    textAlign: 'center',
  },
  secRow: {
    flexDirection: 'row',
    gap: rs(12),
  },
  secBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    paddingVertical: rs(14),
    paddingHorizontal: rs(8),
    borderRadius: rd.radius.lg,
    minHeight: rs(84),
  },
  secText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.onPrimary,
    textAlign: 'center',
    lineHeight: rs(16),
  },
});
