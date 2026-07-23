/**
 * RdHeader.tsx — Redizayn sarlavha paneli (title + orqaga + ixtiyoriy o'ng slot).
 *
 * Mobil arxitektura: har bir detal/oqim ekrani o'z kontekstli header'iga ega bo'ladi
 * (orqaga tugma + sarlavha). Pastki tab menyu bunday ekranlarda ko'rinmaydi (ular
 * stack'da tab navigator ustidan ochiladi).
 *
 * Yuqori (status bar) inset root App.tsx SafeAreaView'da qo'llanadi — bu yerda takror emas.
 */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { ChevronLeft } from './icons';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  showBack?: boolean;
};

const RdHeader = ({ title, subtitle, onBack, right, showBack = true }: Props) => {
  const navigation = useNavigation<any>();
  const back = onBack || (() => navigation.goBack());

  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn} onPress={back}>
            <ChevronLeft size={rs(22)} color={rd.color.onPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
};

export default RdHeader;

const styles = StyleSheet.create({
  row: {
    minHeight: rs(56),
    paddingHorizontal: rs(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.page,
  },
  side: { width: rs(44), justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  // TO'LDIRILGAN KO'K. Ilgari oq doira + kulrang chevron edi va oq/och fonda
  // deyarli sezilmasdi — foydalanuvchi buni bir necha ekranda ko'rsatdi.
  // Bu header barcha modul ekranlarida umumiy, shuning uchun tuzatish
  // bir joyda — hamma joyda amal qiladi.
  iconBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center' },
  title: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: 2,
  },
});
