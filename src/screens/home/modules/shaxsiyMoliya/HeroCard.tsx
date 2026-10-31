import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { Grad } from '../../../../components/ui/Grad';
import { ArrowDownLeft, ArrowUpRight, BulbIcon } from '../../redesign/icons';
import { fCompact } from '../financeMoney';
import { GRAD_BRAND, RED } from './shaxsiyMoliyaLogic';
import { styles } from './shaxsiyMoliyaStyles';

interface HeroCardProps {
  balance: number;
  go: (route: string) => void;
}

/**
 * SS19 (2026-09-14): BITTA karta — tepada HOLAT (shior + qoldiq), ajratgich chizig'idan keyin IKKI AMAL
 * (xarajat/daromad qo'shish). 21.10: "Moliyaviy sog'liq" ball bosh sahifaga ko'chgan.
 */
const HeroCard = ({ balance, go }: HeroCardProps) => {
  const { t } = useTranslation();
  return (
  <View style={styles.fmHero}>
    <Grad id="fmHero" colors={GRAD_BRAND} />

    {/* 21.10 (egasi hujjati): "Moliyaviy sog'liq" + "80/100 · Yaxshi" OLIB TASHLANDI —
        ball endi bosh sahifada (barcha modullar). O'rniga shior; tavsiya tugmasi va
        qoldiq joyida qoladi. */}
    <View style={styles.healthBottomRow}>
      <Text style={styles.fmHeroSlogan} numberOfLines={3}>
        {t('ZeroX orqali daromadlar va xarajatlaringizni nazorat qiling.')}
      </Text>
      <View style={styles.healthQoldiq}>
        {/* 25.10: lampochka "Qoldiq" so'zining CHAP tomonida (bir qatorda). */}
        <View style={styles.fmQoldiqHead}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => go('FinanceAdvice')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('Tavsiyalar')}
            style={[styles.healthAdviceBtn, styles.fmHeroAdvice]}>
            <BulbIcon size={rs(14)} color={rd.color.onPrimary} />
          </TouchableOpacity>
          <Text allowFontScaling={false} style={styles.healthQoldiqLabel}>
            {t('Qoldiq')}
          </Text>
        </View>
        <Text
          allowFontScaling={false}
          style={styles.healthQoldiqVal}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {balance >= 0 ? '+' : '−'}
          {fCompact(Math.abs(balance))}
        </Text>
      </View>
    </View>

    <View style={styles.fmHeroBtns}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.fmHeroBtn, styles.fmHeroBtnLight]}
        onPress={() => go('FinanceExpenseAdd')}>
        <ArrowDownLeft size={rs(18)} color={RED} />
        <Text allowFontScaling={false} style={[styles.fmHeroBtnText, { color: RED }]}>
          {t('Xarajat qo‘shish')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.fmHeroBtn, { backgroundColor: rd.color.success }]}
        onPress={() => go('FinanceIncomeAdd')}>
        <ArrowUpRight size={rs(18)} color={rd.color.onPrimary} />
        <Text allowFontScaling={false} style={[styles.fmHeroBtnText, { color: rd.color.onPrimary }]}>
          {t('Daromad qo‘shish')}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
  );
};

export default HeroCard;
