import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import ScreenLayout from '../../components/ScreenLayout';
import CreditorList from '../../components/List/CreditorList';
import StatisticCreditor from '../../components/List/StatisticCreditor';
import Dollar from '../../../images/givedebt';
import AskTime from '../../../images/AskTime';
import {rd, rs} from '../../../theme/rd';
import {t} from 'i18next';

const CreditorDebitor = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {type, item, report} = route.params || {};
  console.log(item, 'item in creditor debitor');

  // HISOBOT rejimida TUGALLANGAN (status===2) yoki RAD etilган (3/4) kontraktда
  // amal tugmalari (muddat uzaytirishni so'rash / qaytarish) YASHIRILADI — yakunlangan
  // shartnoma. Faol ro'yxatда avvalgidek ko'rinadi.
  const hideActions = !!report && [2, 3, 4].includes(Number(item?.status));

  return (
    <ScreenLayout title={t('156')}>
      {/* FAOL qarz -> DETAIL variant (saytdagi modal bilan bir xil: Qaytarilgan,
          Qoldiq qarz miqdori, Qarz olingan sana, Qarzni qaytarish sanasi). Faqat
          TUGALLANGAN (status===2) bo'lsa hisobot-uslub statistic qoldiriladi. */}
      {item?.status === 2 ? (
        <StatisticCreditor {...route.params} />
      ) : (
        <CreditorList {...route.params} />
      )}
      {/* Amal tugmalari (so'rov bo'yicha, saytdagidek): "Qarz muddatini uzaytirishni
          so'rash", "Qarzni qaytarish". Ilgari FAQAT `type===2` da ko'rinardi — OLINGAN
          qarz (type=3) da yashirin edi; endi olingan qarz kontrakt-detalида ham
          ko'rinadi. Amal ekranlari (DebtDateLengthAsk/DebtTakeSelect) mavjud va ro'yxatda. */}
      {!hideActions && (
        <View style={styles.buttonContainer}>
          <View style={styles.buttonInsideContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('DebtDateLengthAsk', {item: item});
              }}
              activeOpacity={0.8}
              style={styles.registerButton}>
              <AskTime />
              <Text
                allowFontScaling={false}
                style={styles.buttonText}
                numberOfLines={1}>
                {t('459')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonInsideContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('DebtTakeSelect', {item: item});
              }}
              activeOpacity={0.8}
              style={styles.registerButton}>
              <Dollar />
              <Text
                allowFontScaling={false}
                style={styles.buttonText}
                numberOfLines={1}>
                {t('438')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};

export default CreditorDebitor;

const styles = StyleSheet.create({
  buttonContainer: {
    justifyContent: 'center',
  },
  buttonInsideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(16),
  },
  registerButton: {
    width: '90%',
    paddingVertical: rs(16),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.onPrimary,
    marginLeft: rs(8),
    textAlign: 'center',
  },
});
