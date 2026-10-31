import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { BLUE } from './debtGroupLogic';
import { styles } from './debtGroupStyles';

interface SmsTemplatesModalProps {
  visible: boolean;
  templates: string[];
  /** `text` berilmasa — bo'sh SMS. */
  onSend: (text?: string) => void;
  onClose: () => void;
}

/** SS4/SS5: tayyor SMS shablonlari. */
const SmsTemplatesModal = ({ visible, templates, onSend, onClose }: SmsTemplatesModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => onClose()}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose()} />
        <View style={styles.editCard}>
          <Text allowFontScaling={false} style={styles.editTitle}>
            {t('Tayyor SMS shablonlari')}
          </Text>
          <ScrollView style={{ maxHeight: rs(330) }} showsVerticalScrollIndicator={false}>
            {templates.map((tpl, i) => (
              <TouchableOpacity key={i} activeOpacity={0.85} style={styles.tplRow} onPress={() => onSend(tpl)}>
                <Text allowFontScaling={false} style={styles.tplText}>{tpl}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.editActions}>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: rd.color.surfaceAlt }]} onPress={() => onClose()}>
              <Text allowFontScaling={false} style={[styles.editBtnText, { color: rd.color.textSecondary }]}>
                {t('Bekor qilish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: BLUE }]} onPress={() => onSend()}>
              <Text allowFontScaling={false} style={[styles.editBtnText, { color: '#fff' }]}>
                {t('Bo‘sh SMS yozish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SmsTemplatesModal;
