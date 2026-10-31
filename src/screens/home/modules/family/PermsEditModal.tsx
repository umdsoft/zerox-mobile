import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { BLUE, personName } from './familyLogic';
import { styles } from './familyStyles';

interface PermsEditModalProps {
  target: any;
  onClose: () => void;
  perms: any;
  setPerms: (fn: any) => void;
  togglePerm: (sec: string, val: boolean) => void;
  setPermDetail: (sec: string, d: string) => void;
  saving: boolean;
  onSave: () => void;
}
/** Kuzatuvchiga berilgan RUXSATLARNI TAHRIRLASH modali (as_target). */
const PermsEditModal = ({
  target: editTarget,
  onClose,
  perms,
  setPerms,
  togglePerm,
  setPermDetail,
  saving: savingPerms,
  onSave: savePerms,
}: PermsEditModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal visible={!!editTarget} transparent animationType="slide" statusBarTranslucent onRequestClose={() => onClose()}>
      <View style={styles.sheetBackdrop}>
        {/* SS6/SS7: oynaning IXTIYORIY (tashqi) qismiga bosilganda ham yopiladi. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose()} />
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Ruxsatlarni tahrirlash')}</Text>
            <Text allowFontScaling={false} style={[styles.sub, { marginBottom: rs(6) }]}>{personName(editTarget || {})}</Text>
            {[
              { key: 'income', label: 'Daromadlar' },
              { key: 'expense', label: 'Xarajatlar' },
              { key: 'scheduled_income', label: 'Kutilayotgan daromad' },
              { key: 'scheduled_payment', label: 'Rejalashtirilgan to‘lov' },
              { key: 'goals', label: 'Maqsadlar' },
            ].map(sec => (
              <View key={sec.key} style={styles.permBlock}>
                <View style={styles.permRow}>
                  <Text allowFontScaling={false} style={styles.permLabel}>{t(sec.label)}</Text>
                  <Switch value={!!perms[sec.key]?.view} onValueChange={v => togglePerm(sec.key, v)} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
                </View>
                {perms[sec.key]?.view && (
                  <View style={styles.detailChips}>
                    {[{ k: 'full', l: 'To‘liq (kategoriya)' }, { k: 'summary', l: 'Faqat summa' }].map(dch => {
                      const on = (perms[sec.key]?.detail || 'summary') === dch.k;
                      return (
                        <TouchableOpacity key={dch.k} style={[styles.detailChip, on && { borderColor: BLUE, backgroundColor: BLUE + '12' }]} onPress={() => setPermDetail(sec.key, dch.k)}>
                          <Text allowFontScaling={false} style={[styles.detailChipText, on && { color: BLUE }]}>{t(dch.l)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
            {/* img6b: "Limit o'rnatish" ruxsatini TAHRIRLASHDA ham (ilgari faqat taklifda edi). */}
            <View style={styles.permRow}>
              <View style={{ flex: 1, paddingRight: rs(10) }}>
                <Text allowFontScaling={false} style={styles.permLabel}>{t('Limit o‘rnatish')}</Text>
                <Text allowFontScaling={false} style={styles.permSub}>{t('Ushbu kuzatuvchi sizga oylik va kategoriya limitlarini o‘rnata oladi.')}</Text>
              </View>
              <Switch value={!!perms.set_limit} onValueChange={v => setPerms((p: any) => ({ ...p, set_limit: v }))} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
            </View>
          </ScrollView>
          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onClose()}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, savingPerms && { opacity: 0.6 }]} onPress={savePerms} disabled={savingPerms}><Text style={styles.saveText}>{t('Saqlash')}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PermsEditModal;
