/**
 * MoliyaEslatma.tsx — SS20: "Shaxsiy moliya" faolsizlik eslatmasi (type = 41).
 *
 * Backend `financeInactivity.cron` har kuni 10:00 da shu bildirishnomani
 * kiritadi: foydalanuvchi ilgari daromad/xarajat kiritib kelgan, ammo oxirgi
 * 3 kun davomida hech narsa kiritmagan.
 *
 * Kartada bitta aniq amal bor — to'g'ridan-to'g'ri xarajat/daromad qo'shishga
 * o'tish (eslatmaning butun maqsadi shu).
 */
import React from 'react';
import { t } from 'i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { ArrowDownLeft, ArrowUpRight, WalletIcon } from '../../redesign/icons';

const RED = '#dc2626';
const GREEN = '#16a34a';

const MoliyaEslatma = ({ item, okay, navigation }: any) => (
  <View style={styles.card}>
    <View style={styles.head}>
      <View style={styles.icon}>
        <WalletIcon size={rs(18)} color={rd.color.primary} />
      </View>
      <Text allowFontScaling={false} style={styles.title} numberOfLines={2}>
        Shaxsiy moliya eslatmasi
      </Text>
    </View>

    <Text allowFontScaling={false} style={styles.sub}>
      Bir necha kundan beri daromad va xarajatlaringizni kiritmadingiz. Hisobot
      to‘liq bo‘lishi uchun o‘tkazib yuborilgan kunlarni kiritib qo‘ying.
    </Text>

    <View style={styles.btnRow}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation?.navigate('FinanceExpenseAdd')}
        style={[styles.btn, { borderColor: RED + '66' }]}>
        <ArrowDownLeft size={rs(15)} color={RED} />
        <Text allowFontScaling={false} style={[styles.btnText, { color: RED }]}>
          Xarajat qo‘shish
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation?.navigate('FinanceIncomeAdd')}
        style={[styles.btn, { borderColor: GREEN + '66' }]}>
        <ArrowUpRight size={rs(15)} color={GREEN} />
        <Text allowFontScaling={false} style={[styles.btnText, { color: GREEN }]}>
          Daromad qo‘shish
        </Text>
      </TouchableOpacity>
    </View>

    <View style={styles.footer}>
      <Text allowFontScaling={false} style={styles.time}>
        {item?.created} {item?.time ? String(item.time).slice(0, 5) : ''}
      </Text>
      <TouchableOpacity activeOpacity={0.8} onPress={() => okay?.(item?.id, item?.type)}>
        <Text allowFontScaling={false} style={styles.okay}>Ok</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default MoliyaEslatma;

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
    backgroundColor: rd.color.primaryTint,
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
  btnRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    borderRadius: rs(12),
    borderWidth: 1.5,
    paddingVertical: rs(10),
  },
  btnText: { fontFamily: rd.font.semibold, fontSize: rs(12) },
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
  okay: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },
});
