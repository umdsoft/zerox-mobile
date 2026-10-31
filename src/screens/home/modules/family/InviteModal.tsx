import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { BLUE } from './familyLogic';
import { fmtPhone } from './familyLogic';
import { styles } from './familyStyles';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  phone: string;
  setPhone: (v: string) => void;
  role: 'watched' | 'watcher';
  setRole: (r: 'watched' | 'watcher') => void;
  relation: string;
  setRelation: (v: string) => void;
  perms: any;
  setPerms: (fn: any) => void;
  togglePerm: (sec: string, val: boolean) => void;
  setPermDetail: (sec: string, d: string) => void;
  saving: boolean;
  onSubmit: () => void;
}
/** Taklif modali: telefon, maqom, munosabat va ruxsatlar. */
const InviteModal = ({
  visible: invite,
  onClose: closeInvite,
  phone,
  setPhone,
  role,
  setRole,
  relation,
  setRelation,
  perms,
  setPerms,
  togglePerm,
  setPermDetail,
  saving,
  onSubmit: submitInvite,
}: InviteModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal visible={invite} transparent animationType="slide" statusBarTranslucent onRequestClose={closeInvite}>
      <View style={styles.sheetBackdrop}>
        {/* SS4: oynadan tashqari bo‘sh joyga bosilganda ham yopiladi. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeInvite} />
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
          <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Taklif yuborish')}</Text>

          <Text allowFontScaling={false} style={styles.label}>{t('Telefon raqami')}</Text>
          <View style={styles.phoneWrap}>
            <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
            <TextInput allowFontScaling={false} value={phone} onChangeText={t => setPhone(fmtPhone(t))} keyboardType="phone-pad" placeholder="__ ___ __ __" placeholderTextColor={rd.color.textTertiary} style={styles.phoneInput} />
          </View>

          {/* So'rov N8: sayt kabi "Kuzatuvdagi a'zo"/"Kuzatuvchi" (izoh bilan). */}
          <Text allowFontScaling={false} style={styles.label}>{t('Maqom')}</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity style={[styles.roleBtn, role === 'watched' && { borderColor: BLUE, backgroundColor: BLUE + '12' }]} onPress={() => setRole('watched')}>
              <Text allowFontScaling={false} style={[styles.roleText, role === 'watched' && { color: BLUE }]}>{t('Kuzatuvdagi a‘zo')}</Text>
              <Text allowFontScaling={false} style={styles.roleSub}>{t('Siz uning moliyasini kuzatasiz')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleBtn, role === 'watcher' && { borderColor: BLUE, backgroundColor: BLUE + '12' }]} onPress={() => setRole('watcher')}>
              <Text allowFontScaling={false} style={[styles.roleText, role === 'watcher' && { color: BLUE }]}>{t('Kuzatuvchi')}</Text>
              <Text allowFontScaling={false} style={styles.roleSub}>{t('U sizning moliyangizni kuzatadi')}</Text>
            </TouchableOpacity>
          </View>

          <Text allowFontScaling={false} style={styles.label}>{t('Munosabat (ixtiyoriy)')}</Text>
          <TextInput allowFontScaling={false} value={relation} onChangeText={setRelation} placeholder={t('Masalan: O‘g‘lim, Rafiqam')} placeholderTextColor={rd.color.textTertiary} style={styles.input} />

          {/* So'rov N8: Ruxsatlar (sayt kabi) — qaysi bo'lim + to'liq/summa. */}
          <Text allowFontScaling={false} style={styles.label}>{t('Ruxsatlar')}</Text>
          {[
            { key: 'income', label: 'Daromadlar', detail: true },
            { key: 'expense', label: 'Xarajatlar', detail: true },
            // SS12: bu 3 bo'lim ham "To'liq (kategoriya)"/"Faqat summa" tanlovi bilan.
            { key: 'scheduled_income', label: 'Kutilayotgan daromad', detail: true },
            { key: 'scheduled_payment', label: 'Rejalashtirilgan to‘lov', detail: true },
            { key: 'goals', label: 'Maqsadlar', detail: true },
          ].map(sec => (
            <View key={sec.key} style={styles.permBlock}>
              <View style={styles.permRow}>
                <Text allowFontScaling={false} style={styles.permLabel}>{t(sec.label)}</Text>
                <Switch value={!!perms[sec.key]?.view} onValueChange={v => togglePerm(sec.key, v)} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
              </View>
              {sec.detail && perms[sec.key]?.view && (
                <View style={styles.detailChips}>
                  {[{ k: 'full', l: 'To‘liq (kategoriya)' }, { k: 'summary', l: 'Faqat summa' }].map(d => {
                    const on = (perms[sec.key]?.detail || 'summary') === d.k;
                    return (
                      <TouchableOpacity key={d.k} style={[styles.detailChip, on && { borderColor: BLUE, backgroundColor: BLUE + '12' }]} onPress={() => setPermDetail(sec.key, d.k)}>
                        <Text allowFontScaling={false} style={[styles.detailChipText, on && { color: BLUE }]}>{t(d.l)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
          <View style={styles.permRow}>
            <View style={{ flex: 1, paddingRight: rs(10) }}>
              <Text allowFontScaling={false} style={styles.permLabel}>{t('Limit o‘rnatish')}</Text>
              {/* SS12: hint MAQOMga bog'liq — Kuzatuvdagi a'zo (siz limit qo'yasiz) /
                  Kuzatuvchi (u sizga limit qo'yadi). */}
              <Text allowFontScaling={false} style={styles.permSub}>
                {role === 'watched'
                  ? t('U taklifni qabul qilgach, ushbu a‘zoga oylik limit o‘rnata olasiz.')
                  : t('Ushbu kuzatuvchi sizga oylik limit o‘rnata oladi.')}
              </Text>
            </View>
            <Switch value={!!perms.set_limit} onValueChange={v => setPerms((p: any) => ({ ...p, set_limit: v }))} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
          </View>
          </ScrollView>

          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeInvite}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={submitInvite} disabled={saving}><Text style={styles.saveText}>{t('Yuborish')}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InviteModal;
