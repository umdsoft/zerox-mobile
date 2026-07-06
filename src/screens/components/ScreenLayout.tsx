/**
 * ScreenLayout — standart ekran skeleti (scaffold).
 *
 * REDIZAYN: eski ko'k BackGroundIcon + OtherHeader o'rniga och fon (rd.color.page) +
 * RdHeader (orqaga + sarlavha). ~47 ekran shu skeletni ishlatgani uchun bu YAGONA
 * o'zgarish barchasini bir vaqtda yangi dizaynga o'tkazadi.
 *
 * Prop interfeysi saqlangan (chaqiruvchilar buzilmaydi):
 *   <ScreenLayout title={t('816')} card>...</ScreenLayout>
 * Eski `headerColor`/`headerIconColor`/`background` proplari qabul qilinadi, lekin
 * yangi (yagona och) dizaynda ko'rinishga ta'sir qilmaydi.
 */
import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { rd, rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';

interface ScreenLayoutProps {
  title?: string; // berilsa RdHeader chiqadi
  headerColor?: string;
  headerIconColor?: string;
  headerTitleColor?: string;
  scroll?: boolean; // default: true
  card?: boolean; // kontentni oq kartaga o'rash, default: false
  cardColor?: string;
  background?: boolean; // (eski) — endi e'tiborsiz
  showBack?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
  contentStyle?: ViewStyle | ViewStyle[];
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  title,
  scroll = true,
  card = false,
  cardColor = rd.color.surface,
  showBack = true,
  right,
  children,
  contentStyle,
}) => {
  const inner = card ? (
    <View style={[styles.card, { backgroundColor: cardColor }]}>{children}</View>
  ) : (
    children
  );

  return (
    <View style={styles.container}>
      {title !== undefined ? (
        <RdHeader title={title} showBack={showBack} right={right} />
      ) : null}

      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, contentStyle]}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.pad, contentStyle]}>{inner}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  flex: { flex: 1 },
  pad: { paddingHorizontal: rs(16) },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(6),
    paddingBottom: rs(24),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
});

export default ScreenLayout;
