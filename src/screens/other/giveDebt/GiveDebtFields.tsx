import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import CheckBox from '@react-native-community/checkbox';
import { formatAmountInput, sanitizeAmountInput } from '../../../helper/money';
import { settingDate } from '../../../helper';
import { rd, rs } from '../../../theme/rd';
import { CoinIcon } from '../../home/redesign/icons';
import MainText from '../../components/MainText';
import TransText from '../../components/TransText';
import { spaceThousands } from './giveDebtLogic';
import { styles } from './giveDebtStyles';

interface CurrencyProps {
  isUzs: boolean;
  onUzs: () => void;
  onUsd: () => void;
}

/** UZS / USD segment tanlovi. */
export const CurrencyToggle = ({ isUzs, onUzs, onUsd }: CurrencyProps) => (
  <View style={styles.currencyRow}>
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onUzs}
      style={[styles.currencyOption, isUzs && styles.currencyOptionActive]}
    >
      <Text allowFontScaling={false} style={[styles.currencyText, isUzs && styles.currencyTextActive]}>
        {t('uzs')}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onUsd}
      style={[styles.currencyOption, !isUzs && styles.currencyOptionActive]}
    >
      <Text allowFontScaling={false} style={[styles.currencyText, !isUzs && styles.currencyTextActive]}>
        {t('usd')}
      </Text>
    </TouchableOpacity>
  </View>
);

interface AmountProps {
  isUzs: boolean;
  amount: string;
  onChange: (v: string) => void;
}

/** Summa maydoni. */
export const AmountField = ({ isUzs, amount, onChange }: AmountProps) => (
  <View style={styles.field}>
    <Text allowFontScaling={false} style={styles.label}>
      {t('276')}
    </Text>
    <View style={styles.inputWrap}>
      <View style={{ flex: 1 }}>
        <TextInput
          allowFontScaling={false}
          // USD — tsentlar (655,77), UZS — butun (egasi hujjati 2026-10-18).
          value={formatAmountInput(amount, !isUzs)}
          placeholder={isUzs ? 'UZS' : 'USD'}
          placeholderTextColor={rd.color.textTertiary}
          keyboardType={isUzs ? 'numeric' : 'decimal-pad'}
          onChangeText={text => {
            const raw = sanitizeAmountInput(text, !isUzs);
            // "0" / "0," / "0,0" — USD da yozish davom etmoqda, tozalanmaydi.
            onChange(raw === '0' && isUzs ? '' : raw);
          }}
          style={styles.TextInput}
        />
      </View>
    </View>
  </View>
);

interface DateProps {
  date: Date;
  isPlaceholder: boolean;
  onPress: () => void;
}

/** Qaytarish sanasi qatori. */
export const DateRow = ({ date, isPlaceholder, onPress }: DateProps) => (
  <View style={styles.field}>
    <Text allowFontScaling={false} style={styles.label}>
      {t('279')}
    </Text>
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.inputWrap}>
      <Text allowFontScaling={false} style={[styles.inputText, isPlaceholder && styles.inputPlaceholder]}>
        {isPlaceholder ? t('kk.oo.yyyy') : settingDate(date)}
      </Text>
    </TouchableOpacity>
  </View>
);

interface AgreeProps {
  checked: boolean;
  onToggle: () => void;
  onOpenContract: () => void;
}

/** "Shartnoma bilan tanishdim" belgisi. */
export const AgreeRow = ({ checked, onToggle, onOpenContract }: AgreeProps) => (
  <View style={styles.agreeRow}>
    <CheckBox
      value={checked}
      tintColor={'#DBDBDB'}
      onTintColor={rd.color.primary}
      tintColors={{ true: rd.color.primary, false: rd.color.border }}
      style={{ height: 20, width: 20 }}
      boxType="square"
      onValueChange={onToggle}
    />
    <Text allowFontScaling={false} onPress={onOpenContract} style={styles.agreeText}>
      {t('282') as string}
    </Text>
  </View>
);

/** Qolgan bepul shartnomalar soni. */
export const CntRow = ({ cnt }: { cnt: number }) => (
  <View style={styles.cntRow}>
    <Text allowFontScaling={false} style={styles.cntText}>
      <Trans
        i18nKey={'717'}
        values={{ nx: cnt }}
        components={{ nx: <Text style={{ fontFamily: rd.font.semibold }} /> }}
      />
    </Text>
  </View>
);

/** Xizmat haqi bildirishnomasi (info-karta). */
export const FeeCard = ({ fee }: { fee: number }) => (
  <View style={styles.feeCard}>
    <View style={styles.feeIconWrap}>
      <CoinIcon size={rs(18)} color={rd.color.warning} />
    </View>
    <View style={styles.feeTextWrap}>
      <TransText
        textAlign="left"
        tKey={291}
        values={{ amount: spaceThousands(fee) }}
        components={{
          amount: <MainText size={rs(14)} color={rd.color.warning} ft={rd.font.bold} />,
        }}
      />
    </View>
  </View>
);
