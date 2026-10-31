import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './shaxsiyMoliyaStyles';

/**
 * SS15: Bo'lim sarlavhasi — rangli aksent chizig'i bilan.
 * MUAMMO: ekranda 8+ karta ketma-ket TEKIS turardi, faqat pastki uchtasida sarlavha
 * bor edi → "ma'lumotlar aralashib yotibdi". YECHIM: HAR BIR blok o'z sarlavhasini
 * oladi, shunda ko'z bloklarni ajratadi (guruhlash — bezak emas, tuzilma).
 */
const SectionTitle = ({ text, color }: { text: string; color: string }) => (
  <View style={styles.sectionTitleRow}>
    <View style={[styles.sectionBar, { backgroundColor: color }]} />
    <Text allowFontScaling={false} style={styles.blockTitle}>{text}</Text>
  </View>
);

export default SectionTitle;
