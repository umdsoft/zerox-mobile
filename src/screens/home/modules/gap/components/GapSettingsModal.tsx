import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { DateField } from '../../financeForm';
import { styles, TEAL } from '../gapDetailStyles';

interface Props {
  settings: Record<string, any> | null;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  saving: boolean;
  onSave: () => void;
}

const FREQUENCIES = [['monthly', 'Har oyda'], ['15days', 'Har 15 kunda'], ['10days', 'Har 10 kunda']] as const;

/** SS11: Gap SOZLAMALARI (sayt ⚙️ bilan bir xil) — faqat boshlanmasdan oldin. */
const GapSettingsModal = ({ settings, setSettings, saving, onSave }: Props) => {
  const { t } = useTranslation();
  const close = () => setSettings(null);
  const patch = (p: Record<string, any>) => setSettings((f: any) => ({ ...f, ...p }));
  return (
    <Modal visible={!!settings} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
        <View style={styles.confirmCard}>
          <Text allowFontScaling={false} style={styles.confirmTitle}>{t('⚙️ Gap sozlamalari')}</Text>

          {/* SS6: maydonlar ko'paydi — kichik ekranda modal chetidan chiqib ketmasligi uchun SCROLL. */}
          <ScrollView style={styles.settingsScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Gap nomi')}</Text>
            <TextInput
              allowFontScaling={false}
              value={settings?.name}
              onChangeText={v => patch({ name: v })}
              placeholder={t('Gap nomi')}
              placeholderTextColor={rd.color.textTertiary}
              style={styles.venueInput}
              maxLength={150}
            />

            {/* SS6: sayt bilan bir xil atamalar — "Aylanish davri". */}
            <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Aylanish davri')}</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map(([k, label]) => {
                const on = settings?.frequency === k;
                return (
                  <TouchableOpacity
                    key={k}
                    activeOpacity={0.85}
                    onPress={() => patch({ frequency: k })}
                    style={[styles.freqBtn, on && { borderColor: TEAL, backgroundColor: TEAL + '12' }]}>
                    <Text allowFontScaling={false} style={[styles.freqText, on && { color: TEAL }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {settings?.frequency === 'monthly' && (
              <>
                <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Oyning kuni')}</Text>
                <TextInput
                  allowFontScaling={false}
                  value={String(settings?.day_of_month ?? '')}
                  onChangeText={v => patch({ day_of_month: v.replace(/\D/g, '').slice(0, 2) })}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={rd.color.textTertiary}
                  style={styles.venueInput}
                />
                <Text allowFontScaling={false} style={styles.settingsHint}>{t('Har oyning shu kunida to‘lov (1–31)')}</Text>
              </>
            )}

            {/* SS6: "Boshlanish sanasi" — BARCHA aylanish davrlari uchun. Bo'sh bo'lsa gap bugundan boshlanadi. */}
            <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Boshlanish sanasi')}</Text>
            <DateField
              value={settings?.start_date || null}
              onChange={d => patch({ start_date: d })}
              label={t('Boshlanish sanasi')}
              accent={TEAL}
              placeholder={t('kun.oy.yil')}
            />
            <Text allowFontScaling={false} style={styles.settingsHint}>
              {/* SS13 (2026-09-14): "Bo'sh — bugundan boshlanadi." jumlasi olib tashlangan (sayt bilan bir xil matn). */}
              Avval boshlangan gap bo‘lsa — o‘sha sanani tanlang (o‘tgan davralar
              avtomatik belgilanadi).
            </Text>
          </ScrollView>

          <View style={[styles.confirmBtns, { marginTop: rs(18) }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={close}>
              <Text style={styles.cancelText}>{t('Bekor qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmDel, { backgroundColor: TEAL }, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={onSave}>
              <Text style={styles.confirmDelText}>{t('Saqlash')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default GapSettingsModal;
