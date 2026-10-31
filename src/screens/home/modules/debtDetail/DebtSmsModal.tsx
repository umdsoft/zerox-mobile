import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { MessageIcon } from '../../redesign/icons';
import { styles } from './debtDetailStyles';
import type { DebtDetailState } from './useDebtDetail';

/** SS10: SMS shablonlar — tanlansa SMS ilovasi tayyor matn bilan ochiladi. */
const DebtSmsModal = ({ s }: { s: DebtDetailState }) => {
  const { t, showSms, setShowSms, sendSms, templates } = s;
  return (
  <Modal visible={showSms} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowSms(false)}>
    <View style={styles.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSms(false)} />
      <View style={styles.confirmCard}>
        <Text allowFontScaling={false} style={styles.confirmTitle}>{t('SMS yuborish')}</Text>
        <Text allowFontScaling={false} style={styles.confirmText}>{t('Tayyor shablonni tanlang:')}</Text>
        <ScrollView style={styles.smsTplList} showsVerticalScrollIndicator={false}>
          {templates().map((tpl, i) => (
            <TouchableOpacity key={i} style={styles.smsTpl} activeOpacity={0.85} onPress={() => sendSms(tpl)}>
              <MessageIcon size={rs(16)} color={rd.color.primary} />
              <Text allowFontScaling={false} style={styles.smsTplText}>{tpl}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={[styles.cancelBtn, { marginTop: rs(12) }]} onPress={() => sendSms()}>
          <Text allowFontScaling={false} style={styles.cancelText}>{t('Bo‘sh SMS yozish')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
  );
};

export default DebtSmsModal;
