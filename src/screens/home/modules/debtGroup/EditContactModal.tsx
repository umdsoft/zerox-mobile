import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd } from '../../../../theme/rd';
import { BLUE } from './debtGroupLogic';
import { styles } from './debtGroupStyles';

interface EditContactModalProps {
  visible: boolean;
  saving: boolean;
  name: string;
  setName: (v: string) => void;
  phoneEdit: string;
  setPhoneEdit: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

/** Kontragentni (ism + telefon) tahrirlash oynasi. */
const EditContactModal = ({ visible, saving, name, setName, phoneEdit, setPhoneEdit, onSave, onClose }: EditContactModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => onClose()}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !saving && onClose()} />
        <View style={styles.editCard}>
          <Text allowFontScaling={false} style={styles.editTitle}>{t('Tahrirlash')}</Text>

          <Text allowFontScaling={false} style={styles.editLabel}>{t('Ism')}</Text>
          <TextInput
            allowFontScaling={false}
            value={name}
            onChangeText={setName}
            placeholder={t('Familiya Ism')}
            placeholderTextColor={rd.color.textTertiary}
            style={styles.editInput}
          />

          <Text allowFontScaling={false} style={styles.editLabel}>{t('Telefon raqami')}</Text>
          <View style={styles.phoneWrap}>
            <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
            <TextInput
              allowFontScaling={false}
              value={phoneEdit}
              onChangeText={v => setPhoneEdit(v.replace(/\D/g, '').slice(0, 9))}
              keyboardType="number-pad"
              placeholder="__ ___ __ __"
              placeholderTextColor={rd.color.textTertiary}
              style={styles.phoneInput}
            />
          </View>

          <View style={styles.editActions}>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: rd.color.surfaceAlt }]} onPress={() => onClose()}>
              <Text allowFontScaling={false} style={[styles.editBtnText, { color: rd.color.textSecondary }]}>
                {t('Bekor qilish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: BLUE }, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={onSave}>
              <Text allowFontScaling={false} style={[styles.editBtnText, { color: '#fff' }]}>
                {saving ? '...' : t('Saqlash')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditContactModal;
