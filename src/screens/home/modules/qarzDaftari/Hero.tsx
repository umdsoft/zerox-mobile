import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { Grad } from '../../../../components/ui/Grad';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, TelegramPlaneIcon } from '../../redesign/icons';
import { GRAD_BRAND, openTelegramBot } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

// B) Hero banner — ko'k gradient. O'lcham/shrift va IKKI amal tugmasi QARZ SHARTNOMASI
// hero'si bilan BIR XIL (so'rov bo'yicha): "Qarz berish" (oq) + "Qarz olish" (yashil).
// Alohida "Tezkor amallar" bo'limi olib tashlangani uchun bu amallar endi shu kartada.
const Hero = ({ onBer, onOl }: { onBer: () => void; onOl: () => void }) => {
  const { t } = useTranslation();
  return (
  <View style={styles.hero}>
    <Grad id="qdHero" colors={GRAD_BRAND} />
    {/* "Qarz daftari" sarlavhasi OLIB TASHLANDI (so'rov bo'yicha) — yuqoridagi header
        allaqachon "Qarz daftari" deb turibdi. Kartada faqat tavsif + 2 amal tugmasi. */}
    <Text style={styles.heroSub} numberOfLines={2}>
      {t('Qarz oldi-berdi munosabatlaringizni elektron boshqaring.')}
    </Text>
    <View style={styles.heroBtns}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.heroBtn, styles.heroBtnLight]}
        onPress={onBer}
      >
        <ArrowUpRight size={rs(18)} color={rd.color.primary} />
        <Text style={[styles.heroBtnText, { color: rd.color.primary }]}>
          {t('Qarzga berish')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.heroBtn, { backgroundColor: rd.color.success }]}
        onPress={onOl}
      >
        <ArrowDownLeft size={rs(18)} color={rd.color.onPrimary} />
        <Text style={[styles.heroBtnText, { color: rd.color.onPrimary }]}>
          {t('Qarzga olish')}
        </Text>
      </TouchableOpacity>
    </View>
    {/* 21.10: Shaxsiy qarz hero'sidagi "Plastik karta ma'lumotlari" uslubida — Telegram bot havolasi. */}
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.heroLink}
      onPress={openTelegramBot}
      accessibilityRole="link"
    >
      <TelegramPlaneIcon size={rs(15)} color={rd.color.onPrimary} />
      <Text style={styles.heroLinkText} numberOfLines={1}>{t('Telegram botga o‘tish')}</Text>
      <ChevronRight size={rs(14)} color={rd.color.onPrimary} />
    </TouchableOpacity>
  </View>
  );
};

export default Hero;
