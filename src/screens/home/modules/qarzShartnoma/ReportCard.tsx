import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { BarChartIcon } from '../../redesign/icons';
import { styles } from './shartnomaStyles';


// ---------- Hisobot kartasi (yonma-yon, rangli — so'rov SS4.6) ----------
// 02.10: saytdagi kabi karta nomi "Berilgan qarzlar" / "Olingan qarzlar" (ilgari
// "... hisoboti"). 03.10 (12-band): karta pastidagi "Ko'rish ›" OLIB TASHLANDI — kartaning
// o'zi bosiladi (butun karta TouchableOpacity).
const ReportCard = ({
  label,
  tint,
  iconColor,
  onPress,
}: {
  label: string;
  tint: string;
  iconColor: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.reportCard, { backgroundColor: tint, borderColor: tint }]}
      onPress={onPress}>
      <View style={styles.reportIcon}>
        <BarChartIcon size={rs(20)} color={iconColor} />
      </View>
      <Text
        allowFontScaling={false}
        style={styles.reportLabel}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ReportCard;
