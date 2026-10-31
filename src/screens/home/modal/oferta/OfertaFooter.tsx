import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import { useTranslation } from 'react-i18next';
import { rd } from '../../../../theme/rd';
import { styles } from './ofertaStyles';

interface Props {
  check: boolean;
  needRead: boolean;
  pdfErr: boolean;
  setCheck: (fn: (c: boolean) => boolean) => void;
  checkReadFallback: () => boolean;
  warnRead: () => void;
  warnCheck: () => void;
  onClose: () => void;
}

/**
 * Rozilik qatori + "Tasdiqlash". Butun qator TouchableOpacity — bosilsa rozilikni toggle qiladi; CheckBox faqat
 * ko'rsatish uchun (pointerEvents:none; Android'da wrapper bosishni "yutardi"). Tugma BOSILADI (disabled emas) —
 * aks holda sababini tushuntiruvchi ogohlantirish chiqmasdi. PDF xato bo'lsa (pdfErr) — rozilik belgilanmaydi.
 */
const OfertaFooter = ({ check, needRead, pdfErr, setCheck, checkReadFallback, warnRead, warnCheck, onClose }: Props) => {
  const { t } = useTranslation();
  const ready = check && !needRead;
  return (
    <View style={styles.footer}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (pdfErr) return;
          // 08.10: zaxira sharti shu zahoti tekshiriladi (ko'ruvchi sahifa hodisasini bermagan holat).
          if (needRead && !checkReadFallback()) {
            warnRead();
            return;
          }
          setCheck(c => !c);
        }}>
        <View style={styles.checkRow} pointerEvents="none">
          <CheckBox
            value={check}
            tintColor={rd.color.border}
            onTintColor={rd.color.primary}
            tintColors={{ true: rd.color.primary, false: rd.color.textTertiary }}
            boxType="square"
            style={styles.checkbox}
          />
          <Text style={styles.checkText} allowFontScaling={false}>
            {t('ofertaaa')}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          if (needRead && !checkReadFallback()) {
            warnRead();
            return;
          }
          if (!check) {
            warnCheck();
            return;
          }
          onClose();
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready }}
        activeOpacity={0.85}
        style={[styles.btn, { backgroundColor: ready ? rd.color.primary : rd.color.textTertiary }, ready ? styles.btnActiveShadow : null]}>
        <Text style={styles.btnText} allowFontScaling={false}>
          {t('93')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OfertaFooter;
