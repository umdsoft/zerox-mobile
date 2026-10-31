import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { ShieldIcon } from '../../redesign/icons';
import { AMBER } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

// G) Ogohlantirish banneri (yopiladigan).
const WarningBanner = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  return (
  <View style={styles.warnBox}>
    <ShieldIcon size={rs(20)} color={AMBER} />
    <Text style={styles.warnText}>
      {t(
        'Qarz oldi-berdi munosabatlaringizni qarz daftariga kiritish orqali qarzlaringizni elektron boshqarish imkoniyatiga ega bo‘lasiz. Biroq bu holatda qarz daftariga kiritilgan qarzlar bo‘yicha qarz shartnomasi rasmiylashtirilmaydi.',
      )}
    </Text>
    <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.warnClose}>
      <Text style={styles.warnCloseText}>{t('Tushundim')}</Text>
    </TouchableOpacity>
  </View>
  );
};

export default WarningBanner;
