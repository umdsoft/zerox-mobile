import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { Grad } from '../../../../components/ui/Grad';
import { ArrowDownLeft, ArrowUpRight } from '../../redesign/icons';
import { GRAD_BRAND } from './shartnomaLogic';
import { styles } from './shartnomaStyles';

/** Hero banner: tavsif + IKKI amal tugmasi ("Xush kelibsiz, {name}!" sarlavhasi so'rov bo'yicha olib tashlangan). */
const ShartnomaHero = ({ onGive, onTake }: { onGive: () => void; onTake: () => void }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.hero}>
      <Grad id="qshHero" colors={GRAD_BRAND} />
      <Text style={styles.heroSub} numberOfLines={2}>
        {t('Qarz shartnomalarini elektron rasmiylashtiring va oson boshqaring.')}
      </Text>
      <View style={styles.heroBtns}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.heroBtn, styles.heroBtnLight]}
          onPress={onGive}
        >
          <ArrowUpRight size={rs(18)} color={rd.color.primary} />
          <Text style={[styles.heroBtnText, { color: rd.color.primary }]}>{t('Qarz berish')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.heroBtn, { backgroundColor: rd.color.success }]}
          onPress={onTake}
        >
          <ArrowDownLeft size={rs(18)} color={rd.color.onPrimary} />
          <Text style={[styles.heroBtnText, { color: rd.color.onPrimary }]}>{t('Qarz olish')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ShartnomaHero;
