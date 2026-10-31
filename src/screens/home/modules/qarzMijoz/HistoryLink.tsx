import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { TransferIcon } from '../../redesign/icons';
import { BLUE } from './mijozLogic';
import { styles } from './mijozStyles';

/** "Amaliyotlar tarixi" kartasi (summa kartalari TAGIDA, ixchamroq). */
const HistoryLink = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  return (
  <TouchableOpacity
    activeOpacity={0.8}
    style={[styles.historyCard, { borderColor: BLUE + '40' }]}
    onPress={onPress}>
    <TransferIcon size={rs(18)} color={BLUE} />
    <Text style={[styles.historyText, { color: BLUE }]} numberOfLines={1}>
      {t('Amaliyotlar tarixi')}
    </Text>
  </TouchableOpacity>
  );
};

export default HistoryLink;
