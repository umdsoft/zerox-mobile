/**
 * ShaxsiyQarzEslatma.tsx (bildirishnoma, type = 45) — 11.10 ("Yangi mobil xatolar 11.10", 6-rasm):
 * SHAXSIY QARZ KIRITISH ESLATMASI.
 *
 * Backend `personalDebtReminder.cron`: foydalanuvchi belgilagan kun va vaqtda, so'nggi 2 hafta ichida
 * bitta ham shaxsiy qarz kiritilmagan bo'lsa yuboriladi. Tugmalar: «Shaxsiy qarz» — Shaxsiy qarz
 * sahifasi; «Ok» — bildirishnomani yopish. (Ko'rinish — Qarz daftari eslatmasi, type 44, bilan bir xil.)
 */
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { t } from 'i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { BellIcon, PersonalDebtIcon } from '../../redesign/icons';

const AMBER = '#b45309';

const ShaxsiyQarzEslatma = ({ item, okay }: any) => {
  const navigation = useNavigation<any>();
  const openDebts = () => navigation?.navigate('BottomTabNavigator', { screen: 'ShaxsiyQarz' });

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <BellIcon size={rs(18)} color={AMBER} />
        </View>
        <Text allowFontScaling={false} style={styles.title} numberOfLines={2}>
          {t('Shaxsiy qarz eslatmasi')}
        </Text>
      </View>

      <Text allowFontScaling={false} style={styles.sub}>
        {t('So‘nggi 2 hafta ichida shaxsiy qarz kiritilmadi. Bergan va olgan qarzlaringizni kiritib qo‘ying.')}
      </Text>

      <View style={styles.footer}>
        <Text allowFontScaling={false} style={styles.time}>
          {item?.created} {item?.time ? String(item.time).slice(0, 5) : ''}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.85} onPress={openDebts} style={styles.debtBtn}>
            <PersonalDebtIcon size={rs(14)} color={rd.color.primary} />
            <Text allowFontScaling={false} style={styles.debtText}>{t('Shaxsiy qarz')}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => okay?.(item?.id, item?.type)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text allowFontScaling={false} style={styles.okay}>Ok</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ShaxsiyQarzEslatma;

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginTop: rs(12),
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  icon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  sub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
    marginTop: rs(10),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  time: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: rs(16) },
  debtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(12),
    paddingVertical: rs(7),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.primaryTint,
  },
  debtText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.primary },
  okay: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },
});
