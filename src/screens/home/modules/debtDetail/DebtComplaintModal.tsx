import React from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { CheckCircleIcon, WarningIcon } from '../../redesign/icons';
import { fMoney } from '../financeMoney';
import { COMPLAINT_REASONS, GREEN, ROSE } from './debtDetailLogic';
import { styles } from './debtDetailStyles';
import type { DebtDetailState } from './useDebtDetail';

/** SS-DEV (2026-09-24): SHIKOYAT modali — sayt bilan bir xil oqim (klaviatura-xavfsiz). */
const DebtComplaintModal = ({ s }: { s: DebtDetailState }) => {
  const { t, d, showComplaint, setShowComplaint, complaintBusy, complaintSent, complaintTarget, complaintReason } = s;
  const { setComplaintReason, complaintNote, setComplaintNote, complaintCanSend, submitComplaint } = s;
  const { remaining } = s.view!;
  const target = complaintTarget!;
  return (
  <Modal visible={showComplaint} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !complaintBusy && setShowComplaint(false)}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Keyboard.dismiss();
            if (!complaintBusy) setShowComplaint(false);
          }}
        />
        <View style={[styles.confirmCard, styles.complainCard]}>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 0 }}>
            <Pressable onPress={Keyboard.dismiss}>
              <View style={styles.complainIconWrap}>
                <WarningIcon size={rs(26)} color="#b91c1c" />
              </View>
              <Text allowFontScaling={false} style={[styles.confirmTitle, styles.centerText]}>{t('Qarz bo‘yicha shikoyat')}</Text>
              <Text allowFontScaling={false} style={[styles.confirmText, styles.centerText]}>
                «{d.source_name}» — {fMoney(remaining, d.currency)}.
                {!complaintSent ? ' ' + target.hint : ''}
              </Text>
              {!complaintSent ? (
                <>
                  <Text allowFontScaling={false} style={styles.formLabel}>
                    {t('Sababni tanlang')} <Text style={styles.formLabelHint}>({t('yoki pastda izoh yozing')})</Text>:
                  </Text>
                  {COMPLAINT_REASONS.map(r => {
                    const on = complaintReason === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        activeOpacity={0.85}
                        onPress={() => setComplaintReason(on ? '' : r.key)}
                        style={[styles.reasonBtn, on && styles.reasonBtnOn]}>
                        <Text allowFontScaling={false} style={[styles.reasonText, on && styles.reasonTextOn]}>{t(r.text)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TextInput
                    allowFontScaling={false}
                    value={complaintNote}
                    onChangeText={v => setComplaintNote(v.slice(0, 500))}
                    multiline
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={Keyboard.dismiss}
                    placeholder={complaintReason ? t('Qo‘shimcha izoh (ixtiyoriy)') : t('Sabab tanlanmasa — izoh yozing (majburiy)')}
                    placeholderTextColor={rd.color.textTertiary}
                    style={[styles.modalInput, styles.complainInput]}
                  />
                  <View style={[styles.confirmBtns, { marginTop: rs(14) }]}>
                    <TouchableOpacity style={styles.cancelBtn} disabled={complaintBusy} onPress={() => setShowComplaint(false)}>
                      <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmDel, { backgroundColor: ROSE }, (complaintBusy || !complaintCanSend) && { opacity: 0.6 }]}
                      disabled={complaintBusy || !complaintCanSend}
                      onPress={submitComplaint}>
                      <Text allowFontScaling={false} style={styles.confirmDelText}>{complaintBusy ? '...' : t('Yuborish')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* 02.10 (sayt 30.09): ✅ + "…yetkazildi. Qarz bo'yicha o'zgarish bo'lsa, u shu yerda ko'rinadi." */}
                  {/* 03.10 (11/12-rasm): yashil blok — ikonka tepada, matn MARKAZDA */}
                  <View style={styles.complainDone}>
                    <CheckCircleIcon size={rs(22)} color="#16a34a" />
                    <Text allowFontScaling={false} style={styles.complainDoneText}>{target.done}</Text>
                  </View>
                  <TouchableOpacity style={[styles.confirmDel, { backgroundColor: GREEN, marginTop: rs(14) }]} onPress={() => setShowComplaint(false)}>
                    <Text allowFontScaling={false} style={styles.confirmDelText}>{t('Ok')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
  );
};

export default DebtComplaintModal;
