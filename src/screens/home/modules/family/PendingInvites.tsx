import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BLUE, GREEN, initials, personName, RED } from './familyLogic';
import { styles } from './familyStyles';

interface PendingInvitesProps {
  pending: any[];
  busy: boolean;
  respond: (item: any, action: 'accept' | 'reject') => void;
}
/** Kelgan takliflar (qabul qilish / rad etish). */
const PendingInvites = ({ pending, busy, respond }: PendingInvitesProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text allowFontScaling={false} style={styles.sectionTitle}>{t('Kelgan takliflar')}</Text>
      {pending.map((it, i) => (
        <View key={it.id ?? i} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.avatar, { backgroundColor: BLUE + '14' }]}><Text style={[styles.avatarText, { color: BLUE }]}>{initials(personName(it))}</Text></View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{personName(it)}</Text>
              <Text allowFontScaling={false} style={styles.sub}>{it.relation_label || (it.my_role === 'target' ? 'Sizni kuzatmoqchi' : 'Kuzatuvga taklif')}</Text>
            </View>
          </View>
          <View style={styles.respondRow}>
            <TouchableOpacity style={[styles.respBtn, { backgroundColor: GREEN }]} onPress={() => respond(it, 'accept')} disabled={busy}>
              <Text allowFontScaling={false} style={styles.respText}>{t('Qabul qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.respBtn, styles.respGhost]} onPress={() => respond(it, 'reject')} disabled={busy}>
              <Text allowFontScaling={false} style={[styles.respText, { color: RED }]}>{t('Rad etish')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

export default PendingInvites;
