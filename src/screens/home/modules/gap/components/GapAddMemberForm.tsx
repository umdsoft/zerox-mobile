import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { formatPhone9 } from '../../../../../helper/phone';
import { PlusIcon } from '../../../redesign/icons';
import { amountToDisplay } from '../../financeMoney';
import { styles, TEAL } from '../gapDetailStyles';

interface Props {
  name: string;
  phone: string; // faqat +998 dan keyingi 9 raqam
  amount: string;
  busy: boolean;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onAmount: (v: string) => void;
  onSubmit: () => void;
}

/** Draft holatida tashkilotchi uchun "A'zo qo'shish" formasi. */
const GapAddMemberForm = ({ name, phone, amount, busy, onName, onPhone, onAmount, onSubmit }: Props) => {
  const { t } = useTranslation();
  return (
    <View style={styles.addBox}>
      <TextInput allowFontScaling={false} value={name} onChangeText={onName} placeholder={t('Ism')} placeholderTextColor={rd.color.textTertiary} style={styles.addInput} />
      {/* SS14 (2026-09-14): telefon va summa ALOHIDA QATORDA; "+998" prefiksi + "__ ___ __ __" maskasi.
          ⚠️ allowFontScaling={false} IKKALASIDA ham bo'lishi shart (prefiks va raqam bir xil o'lchamda). */}
      <View style={styles.phoneWrap}>
        <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
        <TextInput
          allowFontScaling={false}
          value={formatPhone9(phone)}
          onChangeText={onPhone}
          placeholder="__ ___ __ __"
          placeholderTextColor={rd.color.textTertiary}
          keyboardType="number-pad"
          maxLength={13}
          style={styles.phoneInput}
        />
      </View>
      <TextInput allowFontScaling={false} value={amount} onChangeText={v => onAmount(amountToDisplay(v))} placeholder={t('Summa')} placeholderTextColor={rd.color.textTertiary} keyboardType="numeric" style={styles.addInput} />
      <TouchableOpacity style={styles.addMemberBtn} onPress={onSubmit} disabled={busy} activeOpacity={0.85}>
        <PlusIcon size={rs(16)} color={TEAL} />
        <Text allowFontScaling={false} style={styles.addMemberText}>{t('A‘zo qo‘shish')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GapAddMemberForm;
