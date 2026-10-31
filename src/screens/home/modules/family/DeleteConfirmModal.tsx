import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { personName, RED } from './familyLogic';
import { styles } from './familyStyles';

interface DeleteConfirmModalProps {
  delTarget: any;
  onClose: () => void;
  doDelete: () => void;
}
/** Aloqani uzish / taklifni bekor qilish tasdig'i. */
const DeleteConfirmModal = ({
  delTarget,
  onClose,
  doDelete,
}: DeleteConfirmModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal visible={!!delTarget} transparent animationType="fade" statusBarTranslucent onRequestClose={() => onClose()}>
      <View style={styles.backdrop}>
        {/* SS5: oynadan tashqari bo‘sh joyga bosilganda ham yopiladi. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose()} />
        <View style={styles.confirmCard}>
          <Text allowFontScaling={false} style={styles.sheetTitle}>{delTarget?.status === 'pending' ? t('Taklifni bekor qilish') : t('Aloqani uzish')}</Text>
          <Text allowFontScaling={false} style={styles.confirmText}>"{personName(delTarget || {})}" bilan oilaviy aloqani uzasizmi?</Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onClose()}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.confirmDel, { backgroundColor: RED }]} onPress={doDelete}><Text style={styles.confirmDelText}>{t('Uzish')}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteConfirmModal;
