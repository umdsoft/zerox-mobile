import React from 'react';
import { Text, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { BG_BY_COLOR, DESC_BY_TURI, money, TITLE_BY_TURI } from './amaliyotLogic';
import { styles } from './amaliyotStyles';
import type { QarzAmaliyotState } from './useQarzAmaliyot';

/** 1. Bosh karta — amaliyot turi va summasi (ixcham bitta qator; SS-DEV 2026-10-04, 04.10 hujjat 2-band). */
const AmaliyotHero = ({ s }: { s: QarzAmaliyotState }) => {
  const { t, tx } = s;
  const { color, Icon, turi, sign, valyuta } = s.view;
  return (
  <View
    style={[
      styles.hero,
      {
        borderLeftColor: color,
        borderColor: color + '33',
        backgroundColor: BG_BY_COLOR[color] || rd.color.surface,
      },
    ]}>
    <View style={[styles.heroIcon, { backgroundColor: color + '1F' }]}>
      <Icon size={rs(20)} color={color} />
    </View>
    <View style={styles.heroBody}>
      <View style={[styles.heroBadge, { backgroundColor: color + '1F' }]}>
        <Text allowFontScaling={false} style={[styles.heroTitle, { color }]} numberOfLines={1}>
          {t(TITLE_BY_TURI[turi] || 'Amaliyot')}
        </Text>
      </View>
      <Text
        allowFontScaling={false}
        style={styles.heroAmount}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {sign}
        {money(tx?.summa, valyuta)}
      </Text>
      {!!DESC_BY_TURI[turi] && (
        <Text allowFontScaling={false} style={styles.heroDesc} numberOfLines={2}>
          {t(DESC_BY_TURI[turi])}
        </Text>
      )}
    </View>
  </View>
  );
};

export default AmaliyotHero;
