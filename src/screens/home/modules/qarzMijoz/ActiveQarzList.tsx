import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AnimatedEmpty from '../../../components/AnimatedEmpty';
import ActiveQarzRow from './ActiveQarzRow';
import { styles } from './mijozStyles';

interface ActiveQarzListProps {
  aktivQarzlar: any[];
  accent: string;
  /** Bosilganda "Qarz berildi" AMALIYOT tafsiloti ochiladi. */
  onOpen: (q: any) => void;
}

/** FAQAT AKTIV qarzlar ro'yxati (28.09 hujjati, 3-band). */
const ActiveQarzList = ({ aktivQarzlar, accent, onOpen }: ActiveQarzListProps) => {
  const { t } = useTranslation();
  return (
  <View style={styles.aqSection}>
    <Text style={styles.aqTitle}>
      {`${t('Aktiv qarzlar')} (${aktivQarzlar.length})`}
    </Text>
    {aktivQarzlar.length === 0 ? (
      <>
        <AnimatedEmpty variant="loan" compact />
        <Text style={styles.aqEmpty}>{t('Aktiv qarzlar yo‘q')}</Text>
      </>
    ) : (
      aktivQarzlar.map(q => (
        <ActiveQarzRow
          key={String(q?.id)}
          q={q}
          accent={accent}
          t={t}
          onPress={() => onOpen(q)}
        />
      ))
    )}
  </View>
  );
};

export default ActiveQarzList;
