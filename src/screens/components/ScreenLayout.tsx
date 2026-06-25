/**
 * ScreenLayout — standart ekran skeleti (scaffold).
 *
 * Ilgari ~47 ekran shu strukturani inline takrorlardi:
 *   container (fon) + absolute BackGroundIcon + OtherHeader + ScrollView + oq soya-karta.
 *
 * Endi:
 *   <ScreenLayout title={t('816')} card>
 *     ...kontent...
 *   </ScreenLayout>
 *
 * Layout/fon/karta ko'rinishini o'zgartirish = SHU fayl (har bir ekran emas).
 */
import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { BackGroundIcon } from '../../helper/homeIcon';
import { tokens } from '../../theme/tokens';
import OtherHeader from './OtherHeader';

interface ScreenLayoutProps {
  title?: string; // berilsa OtherHeader chiqadi
  headerColor?: string;
  headerIconColor?: string;
  headerTitleColor?: string;
  scroll?: boolean; // default: true
  card?: boolean; // kontentni soya-kartaga o'rash, default: false
  cardColor?: string; // karta foni (default: surface = oq)
  background?: boolean; // tepa BackGroundIcon, default: true
  children: React.ReactNode;
  contentStyle?: ViewStyle | ViewStyle[];
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  title,
  headerColor,
  headerIconColor,
  headerTitleColor,
  scroll = true,
  card = false,
  cardColor = tokens.color.surface,
  background = true,
  children,
  contentStyle,
}) => {
  const inner = card ? (
    <View style={[styles.card, { backgroundColor: cardColor }]}>{children}</View>
  ) : (
    children
  );

  const body = <View style={styles.main}>{inner}</View>;

  return (
    <View style={styles.container}>
      {background ? (
        <View style={styles.bg}>
          <BackGroundIcon width="100%" height="100%" />
        </View>
      ) : null}

      {title !== undefined ? (
        <OtherHeader
          title={title}
          backgroundColor={headerColor}
          iconColor={headerIconColor}
          titleColor={headerTitleColor}
        />
      ) : null}

      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentStyle}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{body}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.background,
    flex: 1,
  },
  flex: { flex: 1 },
  bg: {
    height: '40%',
    position: 'absolute',
    width: tokens.size.width,
  },
  main: {
    width: '90%',
    alignSelf: 'center',
    marginTop: tokens.spacing.lg,
  },
  card: {
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.sm,
    ...tokens.shadow.card,
  },
});

export default ScreenLayout;
