import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { groupDigits } from '../../../../../helper/money';
import { CheckIcon, CoinIcon, ContractIcon, WalletIcon } from '../../../redesign/icons';
import { styles } from './tariffsStyles';

interface ContractTariffsCardProps {
  balance: number;
  onTopUp: () => void;
}

/** Qarz shartnomasi tariflari (ENG PASTDA) + Mobil hisob balansi va "To'ldirish". */
const ContractTariffsCard = ({ balance, onTopUp }: ContractTariffsCardProps) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.card, { marginTop: rs(18) }]}>
      <View style={styles.cardHead}>
        <View style={styles.headIcon}>
          <ContractIcon size={rs(20)} color={rd.color.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.cardTitle}>
            {t('Qarz shartnomasi tariflari')}
          </Text>
        </View>
      </View>

      <View style={styles.contractRow}>
        <View style={styles.contractDot}>
          <CheckIcon size={rs(15)} color={rd.color.success} />
        </View>
        <View style={{ flex: 1 }}>
          {/* "Bepul shartnomalar" sarlavhasi olib tashlandi (so'rov). */}
          <Text
            allowFontScaling={false}
            style={[styles.contractValue, { color: rd.color.success }]}>
            {t('Mutlaqo bepul')}
          </Text>
          <Text allowFontScaling={false} style={styles.contractNote}>
            {t('Barcha foydalanuvchilarga qarz berishda')}
          </Text>
        </View>
      </View>

      <View style={styles.contractRow}>
        <View style={[styles.contractDot, { backgroundColor: rd.color.primaryTint }]}>
          <CoinIcon size={rs(15)} color={rd.color.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.contractLabel}>
            {t('Shartnoma narxi')}
          </Text>
          <View style={styles.priceLine}>
            <Text allowFontScaling={false} style={styles.priceTerm}>
              {t('1 mln so‘mgacha')}
            </Text>
            <Text allowFontScaling={false} style={styles.priceVal}>
              1 000 UZS
            </Text>
          </View>
          <View style={styles.priceLine}>
            <Text allowFontScaling={false} style={styles.priceTerm}>
              {t('1 mln – 100 mln so‘m')}
            </Text>
            <Text allowFontScaling={false} style={styles.priceVal}>
              0.1%
            </Text>
          </View>
          <View style={styles.priceLine}>
            <Text allowFontScaling={false} style={styles.priceTerm}>
              {t('100 mln so‘mdan ortiq')}
            </Text>
            <Text allowFontScaling={false} style={styles.priceVal}>
              100 000 UZS
            </Text>
          </View>
        </View>
      </View>

      {/* Mobil hisob balansi (REAL) + to'ldirish. */}
      <View style={styles.balanceBar}>
        <View style={styles.balanceLeft}>
          <WalletIcon size={rs(18)} color={rd.color.primary} />
          <View style={{ marginLeft: rs(10) }}>
            <Text allowFontScaling={false} style={styles.balanceLabel}>
              {t('Mobil hisob balansingiz')}
            </Text>
            <Text allowFontScaling={false} style={styles.balanceValue}>
              {t('{{amount}} so‘m', { amount: groupDigits(balance) })}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onTopUp}
          style={styles.topUpBtn}>
          <Text allowFontScaling={false} style={styles.topUpText}>
            {t('To‘ldirish')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ContractTariffsCard;
