import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fMoney, num } from '../../financeMoney';
import { styles } from '../gapDetailStyles';

interface Props {
  g: Record<string, any>;
  memberCount: number;
  isDraft: boolean;
}

/** Sarlavha kartasi: nom, holat · a'zolar soni, gap summasi. */
const GapHeadCard = ({ g, memberCount, isDraft }: Props) => {
  const { t } = useTranslation();
  return (
    <View style={styles.headCard}>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={styles.headName}>{g.name}</Text>
        <Text allowFontScaling={false} style={styles.headSub}>
          {isDraft ? t('Qoralama') : g.status === 'active' ? t('Faol') : t('Tugallangan')} · {memberCount} {t('a‘zo')}
        </Text>
      </View>
      {num(g.amount) > 0 && <Text allowFontScaling={false} style={styles.headAmt}>{fMoney(g.amount, g.currency)}</Text>}
    </View>
  );
};

export default GapHeadCard;
