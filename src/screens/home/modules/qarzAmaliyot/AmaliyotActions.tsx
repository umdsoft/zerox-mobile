import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { ArrowUpRight, ShieldIcon } from '../../redesign/icons';
import { BLUE, GREEN } from './amaliyotLogic';
import { styles } from './amaliyotStyles';
import type { QarzAmaliyotState } from './useQarzAmaliyot';

/** SS13 (2026-09-17): KVITANSIYA va ULASHISH — barcha amaliyot turlarida. */
const AmaliyotActions = ({ s }: { s: QarzAmaliyotState }) => {
  const { t, sharing, shareReceipt, setShowReceipt } = s;
  return (
  <View style={styles.actRow}>
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.actBtn, { borderColor: GREEN + '55', backgroundColor: GREEN + '10' }]}
      onPress={() => setShowReceipt(true)}>
      <ShieldIcon size={rs(17)} color={GREEN} />
      <Text allowFontScaling={false} style={[styles.actText, { color: GREEN }]}>
        {t('Kvitansiya')}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.actBtn,
        { borderColor: BLUE + '55', backgroundColor: BLUE + '10' },
        sharing && { opacity: 0.6 },
      ]}
      disabled={sharing}
      onPress={shareReceipt}>
      <ArrowUpRight size={rs(17)} color={BLUE} />
      <Text allowFontScaling={false} style={[styles.actText, { color: BLUE }]}>
        {sharing ? t('Tayyorlanmoqda...') : t('Ulashish')}
      </Text>
    </TouchableOpacity>
  </View>
  );
};

export default AmaliyotActions;
