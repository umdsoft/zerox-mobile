/**
 * QarzDaftariEslatma.tsx (bildirishnoma, type = 44) — 10.10: do'kon egasiga QARZ KIRITISH ESLATMASI.
 *
 * Backend `shopReminder.cron`: egasi belgilagan kun va vaqtda, o'sha kuni do'konga bitta ham qarz
 * kiritilmagan bo'lsa yuboriladi. Tugmalar: «Qarz daftari» — shu do'kon tanlangan holda Qarz daftari
 * sahifasi; «Ok» — bildirishnomani yopish.
 */
import React from 'react';
import { t } from 'i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setQarzShop } from '../../../../store/api/token/qarzShop';
import { rd, rs } from '../../../../theme/rd';
import { BellIcon, LedgerIcon } from '../../redesign/icons';

const AMBER = '#b45309';

const QarzDaftariEslatma = ({ item, okay, navigation }: any) => {
  const shopId = Number(item?.rem_faoliyat_id) || 0;
  const shop = String(item?.rem_faoliyat_nomi || '').trim();

  const openLedger = () => {
    // Eslatma qaysi do'kon uchun bo'lsa — Qarz daftari shu do'kon tanlangan holda ochiladi.
    if (shopId) setQarzShop({ id: shopId, nomi: shop });
    navigation?.navigate('BottomTabNavigator', { screen: 'QarzDaftari' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <BellIcon size={rs(18)} color={AMBER} />
        </View>
        <Text allowFontScaling={false} style={styles.title} numberOfLines={2}>
          {t('Qarz daftari eslatmasi')}
        </Text>
      </View>

      <Text allowFontScaling={false} style={styles.sub}>
        {shop
          ? t('«{{shop}}» do‘koni uchun bugun hali qarz kiritilmadi. Bugungi qarzlarni kiritib qo‘ying.', { shop })
          : t('Bugun hali qarz kiritilmadi. Bugungi qarzlarni kiritib qo‘ying.')}
      </Text>

      <View style={styles.footer}>
        <Text allowFontScaling={false} style={styles.time}>
          {item?.created} {item?.time ? String(item.time).slice(0, 5) : ''}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.85} onPress={openLedger} style={styles.ledgerBtn}>
            <LedgerIcon size={rs(14)} color={rd.color.primary} />
            <Text allowFontScaling={false} style={styles.ledgerText}>{t('Qarz daftari')}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => okay?.(item?.id, item?.type)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text allowFontScaling={false} style={styles.okay}>Ok</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default QarzDaftariEslatma;

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
  ledgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(12),
    paddingVertical: rs(7),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.primaryTint,
  },
  ledgerText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.primary },
  okay: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },
});
