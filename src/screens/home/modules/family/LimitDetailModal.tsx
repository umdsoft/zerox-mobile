import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { fMoney, num } from '../financeMoney';
import { GREEN, personName, RED } from './familyLogic';
import { styles } from './familyStyles';

interface LimitDetailModalProps {
  limitDetail: any;
  onClose: () => void;
  catName: (cid: any) => string;
}
/** SS11c: Limit TAFSILOTI (alohida ko'rinish) — umumiy + kategoriya, progress bilan. */
const LimitDetailModal = ({
  limitDetail,
  onClose,
  catName,
}: LimitDetailModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal visible={!!limitDetail} transparent animationType="slide" statusBarTranslucent onRequestClose={() => onClose()}>
      <View style={styles.sheetBackdrop}>
        {/* SS6/SS7: oynaning IXTIYORIY (tashqi) qismiga bosilganda ham yopiladi. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose()} />
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Menga qo‘yilgan limit')}</Text>
            <Text allowFontScaling={false} style={[styles.sub, { marginBottom: rs(10) }]}>{personName(limitDetail || {})}</Text>
            {!!limitDetail?.monthly_limit && (() => {
              const lim = num(limitDetail.monthly_limit);
              const sp = num(limitDetail.limit_spent);
              const pctv = lim > 0 ? Math.min(100, Math.round((sp / lim) * 100)) : 0;
              const col = limitDetail.over_limit ? RED : pctv >= 80 ? '#f59e0b' : GREEN;
              return (
                <View style={styles.limBlock}>
                  <View style={styles.limHead}>
                    <Text allowFontScaling={false} style={styles.limName}>{t('Umumiy limit')}</Text>
                    <Text allowFontScaling={false} style={[styles.limVal, { color: col }]}>{fMoney(sp, limitDetail.limit_currency)} / {fMoney(lim, limitDetail.limit_currency)}</Text>
                  </View>
                  <View style={styles.limTrack}><View style={[styles.limFill, { width: `${pctv}%`, backgroundColor: col }]} /></View>
                </View>
              );
            })()}
            {Array.isArray(limitDetail?.category_limits) && limitDetail.category_limits.length > 0 && (
              <Text allowFontScaling={false} style={[styles.label, { marginTop: rs(6) }]}>{t('Kategoriya limitlari')}</Text>
            )}
            {(limitDetail?.category_limits || []).map((cl: any, ci: number) => {
              const lim = num(cl.amount);
              const sp = num(cl.spent);
              const pctv = lim > 0 ? Math.min(100, Math.round((sp / lim) * 100)) : 0;
              const col = cl.over ? RED : pctv >= 80 ? '#f59e0b' : GREEN;
              return (
                <View key={ci} style={styles.limBlock}>
                  <View style={styles.limHead}>
                    <Text allowFontScaling={false} style={styles.limName} numberOfLines={1}>{catName(cl.category_id)}</Text>
                    <Text allowFontScaling={false} style={[styles.limVal, { color: col }]}>{fMoney(sp, cl.currency)} / {fMoney(lim, cl.currency)}</Text>
                  </View>
                  <View style={styles.limTrack}><View style={[styles.limFill, { width: `${pctv}%`, backgroundColor: col }]} /></View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.sheetBtns}>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={() => onClose()}><Text style={styles.saveText}>{t('Yopish')}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LimitDetailModal;
