import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { formatAmountInput, sanitizeAmountInput } from '../../../../helper/money';
import { rd, rs } from '../../../../theme/rd';
import { LockIcon } from '../../redesign/icons';
import { DateField } from '../financeForm';
import { fMoney } from '../financeMoney';
import { BLUE, GREEN } from './debtDetailLogic';
import { styles } from './debtDetailStyles';
import type { DebtDetailState } from './useDebtDetail';

/** 02.10: "Qarzni yopish / qaytarish" — sayt oynasi: To'liq | Qisman, summa, sana, izoh, SMS. */
const DebtPayModal = ({ s }: { s: DebtDetailState }) => {
  const { t, d, showPay, setShowPay, paying, payFull, payVal, setPayVal, payDate, setPayDate, payNotes, setPayNotes } = s;
  const { paySms, smsLocked, payAmount, payOver, choosePayMode, togglePaySms, submitPay } = s;
  const { settleTitle, remaining, payUsd } = s.view!;
  return (
  <Modal visible={showPay} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !paying && setShowPay(false)}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !paying && setShowPay(false)} />
        <View style={[styles.confirmCard, styles.payCard]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{settleTitle}</Text>
            <Text allowFontScaling={false} style={styles.paySub}>
              {t('Qoldiq')}: <Text style={styles.paySubStrong}>{fMoney(remaining, d.currency)}</Text>
            </Text>
            <View style={styles.seg}>
              {[true, false].map(full => (
                <TouchableOpacity
                  key={String(full)}
                  activeOpacity={0.85}
                  onPress={() => choosePayMode(full)}
                  style={[styles.segBtn, payFull === full && styles.segBtnOn]}>
                  <Text allowFontScaling={false} style={[styles.segText, payFull === full && styles.segTextOn]}>
                    {full ? t('To‘liq') : t('Qisman')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text allowFontScaling={false} style={styles.formLabel}>{t('To‘lov summasi')} *</Text>
            <View style={[styles.amountWrap, payOver && { borderColor: '#f87171' }, payFull && { backgroundColor: '#F9FAFB' }]}>
              <TextInput
                allowFontScaling={false}
                value={payFull ? formatAmountInput(String(remaining), payUsd) : formatAmountInput(payVal, payUsd)}
                editable={!payFull}
                onChangeText={v => setPayVal(sanitizeAmountInput(v, payUsd))}
                keyboardType={payUsd ? 'decimal-pad' : 'number-pad'}
                placeholder={formatAmountInput(String(remaining), payUsd)}
                placeholderTextColor={rd.color.textTertiary}
                style={styles.amountInput}
              />
              <Text allowFontScaling={false} style={styles.amountCur}>{d.currency || 'UZS'}</Text>
            </View>
            {payOver ? (
              <Text allowFontScaling={false} style={styles.errText}>
                {t('Summa qoldiqdan oshmasligi kerak')} ({fMoney(remaining, d.currency)})
              </Text>
            ) : null}
            <Text allowFontScaling={false} style={styles.formLabel}>{t('To‘lov sanasi')}</Text>
            <DateField value={payDate} onChange={setPayDate} label={t('To‘lov sanasi')} accent={GREEN} placeholder={t('Sanani tanlang')} />
            <Text allowFontScaling={false} style={styles.formLabel}>{t('Izoh (ixtiyoriy)')}</Text>
            <TextInput
              allowFontScaling={false}
              value={payNotes}
              onChangeText={v => setPayNotes(v.slice(0, 255))}
              placeholder={t('Qo‘shimcha ma\'lumot...')}
              placeholderTextColor={rd.color.textTertiary}
              style={styles.modalInput}
            />
            {/* SS5 / 03.10 (10-rasm): "SMS yuborish" — standart O'CHIQ, tarif qulfi bilan. Ko'zguda ham
                (qarshi tomon raqami); `mirror-payment` hozircha SMS yubormaydi — natija toastda aytiladi. */}
            {!!d.phone && (
              <View style={styles.smsRow}>
                <View style={{ flex: 1, paddingRight: rs(10) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                    <Text allowFontScaling={false} style={styles.smsLabel}>{t('SMS yuborish')}</Text>
                    {smsLocked && <LockIcon size={rs(13)} color={rd.color.textTertiary} />}
                  </View>
                  <Text allowFontScaling={false} style={styles.smsSub}>
                    {t('Yoqilsa, {{phone}} raqamiga to‘lov va qoldiq qarz haqida SMS yuboriladi.', { phone: d.phone })}
                  </Text>
                </View>
                <Switch
                  value={paySms && !smsLocked}
                  onValueChange={togglePaySms}
                  trackColor={{ true: BLUE, false: rd.color.border }}
                  thumbColor="#fff"
                  accessibilityLabel={t('SMS yuborish')}
                />
              </View>
            )}
          </ScrollView>
          <View style={[styles.confirmBtns, { marginTop: rs(16) }]}>
            <TouchableOpacity style={styles.cancelBtn} disabled={paying} onPress={() => setShowPay(false)}>
              <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmDel, { backgroundColor: GREEN }, (paying || payOver || !(payAmount > 0)) && { opacity: 0.6 }]}
              onPress={submitPay}
              disabled={paying || payOver || !(payAmount > 0)}>
              <Text allowFontScaling={false} style={styles.confirmDelText}>
                {paying ? '...' : payFull ? t('Yopish') : t('Qayd etish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
  );
};

export default DebtPayModal;
