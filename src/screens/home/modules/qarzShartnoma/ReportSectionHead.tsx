import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { InfoIcon } from '../../redesign/icons';
import { styles } from './shartnomaStyles';


// 03.10 (12-band): "Tugallangan qarz shartnomalari" sarlavhasi — izoh doim ko'rinmaydi,
// sarlavha O'NGIDAGI (i) bosilganda ochiladi (Shaxsiy qarz "Yakunlangan qarzlar" —
// FinanceDebts.FinishedSection — bilan AYNAN bir xil naqsh va uslub).
const ReportSectionHead = () => {
  const { t } = useTranslation();
  const [info, setInfo] = React.useState(false);
  const infoText = t('Ushbu qismda yakunlangan hamda voz kechilgan qarzlar aks etadi');
  return (
    <>
      <View style={styles.reportSectionHead}>
        <Text allowFontScaling={false} style={styles.reportSectionTitle} numberOfLines={2}>
          {t('Tugallangan qarz shartnomalari')}
        </Text>
        <TouchableOpacity
          onPress={() => setInfo(v => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityState={{ expanded: info }}
          accessibilityLabel={infoText}>
          <InfoIcon size={rs(17)} color={info ? rd.color.primary : rd.color.textTertiary} />
        </TouchableOpacity>
      </View>
      {info ? (
        <Text allowFontScaling={false} style={styles.reportSectionInfo}>
          {infoText}
        </Text>
      ) : null}
    </>
  );
};

export default ReportSectionHead;
