import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import PendingBadge from '../../../../offline/ui/PendingBadge';
import { CircleIcon } from '../../../../components/ui/CircleIcon';
import { MessageIcon, PencilIcon, PhoneCallIcon, PhoneIcon, StorefrontIcon, UserIcon } from '../../redesign/icons';
import { styles } from './mijozStyles';

interface ClientCardProps {
  mijoz: any;
  fish: string;
  telefon: string;
  dokonNomi: string;
  accent: string;
  accentBg: string;
  /** Amal tugmalari bloki (MijozActions). */
  actions: React.ReactNode;
  onEdit: () => void;
  onSms: () => void;
  onCall: () => void;
}

/** 1. Mijoz kartasi: FISH + tahrirlash, telefon (SMS / qo'ng'iroq), do'kon va AMALLAR. */
const ClientCard = ({ mijoz, fish, telefon, dokonNomi, accent, accentBg, actions, onEdit, onSms, onCall }: ClientCardProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={styles.clientHead}>
        <CircleIcon size={rs(52)} bg={accentBg}>
          <UserIcon size={rs(26)} color={accent} />
        </CircleIcon>
        <View style={{ flex: 1 }}>
          {/* SS-A3: FISH tagidagi "Qarz oluvchi/beruvchi" va "Aktiv" belgilari
              OLIB TASHLANdi — faqat FISH qoladi (rol endi sarlavhada). */}
          <Text style={styles.clientName} numberOfLines={2}>
            {fish}
          </Text>
          <PendingBadge item={mijoz} style={{ marginTop: rs(4) }} />
        </View>
        {/* SS8-1 (2026-09-14): FISH yonida TAHRIRLASH tugmasi — mijozning
            ismi/telefoni noto'g'ri kiritilgan bo'lsa shu yerdan tuzatiladi.
            Forma "Yangi mijoz" ekranining EDIT rejimi (bir xil maydonlar,
            bir xil validatsiya). */}
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.editBtn, { backgroundColor: accentBg }]}
          onPress={onEdit}>
          <PencilIcon size={rs(18)} color={accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.clientDivider} />

      <View style={styles.clientRow}>
        <PhoneIcon size={rs(16)} color={rd.color.textTertiary} />
        <Text style={[styles.clientPhone, { flex: 1 }]} numberOfLines={1}>
          {telefon || '—'}
        </Text>
        {/* Qarz shartnomasi bo'limidagidek — qo'ng'iroq (yashil) + SMS (ko'k) tugmalari.
            Bosilganda telefon/sms ilovasi ochiladi (so'rov bo'yicha). */}
        {!!telefon && (
          <View style={styles.phoneActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('SMS yuborish')}
              onPress={onSms}
              style={styles.smsBtn}>
              <MessageIcon size={rs(16)} color={rd.color.onPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onCall}
              style={styles.callBtn}>
              <PhoneCallIcon size={rs(16)} color={rd.color.onPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* SS6: do'kon (savdo faoliyati) — qaysi do'konga tegishli mijoz. */}
      {!!dokonNomi && (
        <View style={[styles.clientRow, { marginTop: rs(12) }]}>
          {/* SS8-2: bino ikonasi o'rniga DO'KONCHA ikonasi — bu qator
              aynan savdo do'konini bildiradi. */}
          <StorefrontIcon size={rs(16)} color={rd.color.textTertiary} />
          <Text style={[styles.clientPhone, { flex: 1 }]} numberOfLines={1}>
            {dokonNomi}
          </Text>
        </View>
      )}

      {/* 03.10: AMALLAR — Shaxsiy qarzdagidek karta ichida, ajratgich ostida. */}
      <View style={styles.actDivider} />
      {actions}
    </View>
  );
};

export default ClientCard;
