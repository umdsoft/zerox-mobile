import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { t } from 'i18next';
import { rd, rs } from '../../theme/rd';
import { ClockIcon } from '../home/redesign/icons';

// REDIZAYN: eski spreadsheet-jadval (style.blue chiziq, MainText) o'rniga zamonaviy
// avatar-ro'yxat (har qator: initial-avatar + ism + summa). Navigatsiya, ma'lumot va
// eksportlar (sortText / sortMoney / HeaderComponent) O'ZGARMAGAN.

// Qatorlar orasidagi yengil ajratgich (har render'da yangi komponent yaratilmaydi).
const StatisticSeparator = () => <View style={styles.separator} />;

// Muddat metasi: end_date'дан kategoriya (overdue/near/active) + yorliq + rang.
// SearchDebitor filtr/saralashда, StatisticCard qator subtitle'ida ishlatiladi.
export type DueCat = 'overdue' | 'near' | 'active';
type DueMeta = {
  cat: DueCat;
  label: string;
  color: string;
  bg: string;
  date: string; // qaytarish sanasi (DD.MM.YYYY)
  diff: number;
};
export const getDueMeta = (endDate: any): DueMeta => {
  const d = new Date(endDate);
  if (!endDate || isNaN(d.getTime())) {
    return {
      cat: 'active',
      label: 'Jarayonda',
      color: rd.color.textTertiary,
      bg: rd.color.surfaceAlt,
      date: '',
      diff: 99999,
    };
  }
  // Sana matni — ilovaning mavjud +5s (UZS) siljishi bilan (kun chegarasida to'g'ri).
  const iso = new Date(d.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
  const [y, m, dd] = iso.split('-');
  const date = `${dd}.${m}.${y}`;

  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0)
    return { cat: 'overdue', label: 'Muddati o‘tgan', color: rd.color.error, bg: rd.color.errorBg, date, diff };
  if (diff === 0)
    return { cat: 'near', label: 'Bugun', color: rd.color.error, bg: rd.color.errorBg, date, diff };
  if (diff <= 5)
    return { cat: 'near', label: `${diff} kun qoldi`, color: rd.color.warning, bg: rd.color.warningBg, date, diff };
  return { cat: 'active', label: 'Jarayonda', color: rd.color.success, bg: rd.color.successBg, date, diff };
};

const StatisticCard = ({
  title,
  type,
  color,
  data,
  person,
  isHave,
  iconType,
}) => {
  const navigation = useNavigation();
  const isDebitor = person === 'debitor';
  const dirColor = isDebitor ? rd.color.error : rd.color.success;
  const dirBg = isDebitor ? rd.color.errorBg : rd.color.successBg;

  let checkType = type => {
    if (type === 1 || type === 3) {
      return true;
    } else {
      return false;
    }
  };

  const renderLottieItem = itemType => {
    switch (itemType) {
      case 1:
        return require('../../images/lottie/list/a05QqYIpIG.json');
      case 2:
        return require('../../images/lottie/list/aCUgxlGWKw.json');
      case 3:
        return require('../../images/lottie/list/vQHqXEUIEF.json');
    }
  };

  const renderName = (name: string) => {
    if (name.includes('O‘G‘LI') || name.includes('O‘G‘LI')) {
      // 'O‘G‘LI' should be o‘g‘li---> QuramBoyev Jamshid Rashid o‘g‘li
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace('O‘g‘li', 'o‘g‘li');
    }
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const ListRender = ({ item, index }) => {
    const name = renderName(
      isDebitor ? item?.creditor_name : item?.debitor_name,
    );
    const initial = (name?.trim()?.[0] || '?').toUpperCase();
    const due = getDueMeta(item?.end_date);
    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.7}
        onPress={() => {
          if (isDebitor) {
            navigation.navigate('Debitor', {
              type: type,
              item,
              status: 2,
              person,
              isHave,
            });
          } else {
            navigation.navigate('CreditorDebitor', {
              type: type,
              item,
              status: 2,
              person,
              isHave,
            });
          }
        }}
        style={[styles.row, due.cat === 'overdue' && styles.rowOverdue]}
      >
        <View style={[styles.avatar, { backgroundColor: dirBg }]}>
          <Text allowFontScaling={false} style={[styles.avatarText, { color: dirColor }]}>
            {initial}
          </Text>
        </View>

        <View style={styles.rowMid}>
          <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.dueRow}>
            {due.date ? (
              <>
                <ClockIcon size={rs(12)} color={rd.color.textTertiary} />
                <Text allowFontScaling={false} style={styles.dueDate}>
                  {due.date}
                </Text>
              </>
            ) : null}
            <View style={[styles.dueBadge, { backgroundColor: due.bg }]}>
              <Text allowFontScaling={false} style={[styles.dueBadgeText, { color: due.color }]}>
                {due.label}
              </Text>
            </View>
          </View>
        </View>

        <Text allowFontScaling={false} style={[styles.amount, { color: dirColor }]} numberOfLines={1}>
          {sortText(checkType(type) ? item?.amount : item?.residual_amount)}{' '}
          {item?.currency}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.flat}
        contentContainerStyle={
          !data || data.length === 0 ? styles.emptyContent : styles.listContent
        }
        data={data}
        ItemSeparatorComponent={StatisticSeparator}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <LottieView
              autoPlay
              source={renderLottieItem(iconType)}
              style={styles.emptyLottie}
            />
            <Text allowFontScaling={false} style={styles.emptyText}>
              {t('177')}
            </Text>
          </View>
        )}
        keyExtractor={(item, index) => item?.id?.toString() ?? index.toString()}
        renderItem={({ item, index }) => <ListRender item={item} index={index} />}
      />
    </View>
  );
};

// Eksport saqlangan (backward-compat) — endi ixcham sarlavha qatori sifatida.
export const HeaderComponent = ({ person }) => {
  return (
    <View style={styles.header}>
      <Text allowFontScaling={false} style={styles.headerCol}>
        {person === 'debitor' ? t('270') : t('273')}
      </Text>
      <Text allowFontScaling={false} style={styles.headerAmount}>
        {t('327')}
      </Text>
    </View>
  );
};

export const sortText = text => {
  return text?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || 0;
};
// Pul summasi — backend "550000.00" kabi o'nlik string qaytaradi; web'dagidek
// butun songa yaxlitlab, mingliklarni bo'shliq bilan ajratamiz ("550 000").
export const sortMoneyText = value =>
  sortText(Math.round(Number(value) || 0));
export const sortMoney = (money, currency) => {
  // Ming
  if (money >= 1000 && money <= 9999) {
    return `${String(money).slice(0, 1)}.${String(money).slice(
      1,
      2,
    )} ming ${currency}`;
  }
  if (money >= 10000 && money <= 99999) {
    return `${String(money).slice(0, 2)}.${String(money).slice(
      2,
      3,
    )} ming ${currency}`;
  }
  if (money >= 100000 && money <= 999000) {
    return `${String(money).slice(0, 3)}.${String(money).slice(
      3,
      4,
    )} ming ${currency}`;
  }
  // Million
  if (money >= 1000000 && money <= 9999999) {
    return `${String(money).slice(0, 1)}.${String(money).slice(
      1,
      2,
    )} mln ${currency}`;
  }
  if (money >= 10000000 && money <= 99999999) {
    return `${String(money).slice(0, 2)}.${String(money).slice(
      2,
      3,
    )} mln ${currency}`;
  }
  if (money >= 100000000 && money <= 999999999) {
    return `${String(money).slice(0, 3)}.${String(money).slice(
      3,
      4,
    )} mln ${currency}`;
  }
  // Milliard
  if (money >= 1000000000 && money <= 9999999999) {
    return `${String(money).slice(0, 1)}.${String(money).slice(
      1,
      2,
    )} mlrd ${currency}`;
  }
  if (money >= 10000000000 && money <= 99999999999) {
    return `${String(money).slice(0, 2)}.${String(money).slice(
      2,
      3,
    )} mlrd ${currency}`;
  }
  if (money >= 100000000000 && money <= 999999999999) {
    return `${String(money).slice(0, 3)}.${String(money).slice(
      3,
      4,
    )} mlrd ${currency}`;
  }
};
export default memo(StatisticCard);

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  flat: { flex: 1 },
  listContent: { paddingVertical: rs(4) },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(11),
    paddingHorizontal: rs(14),
    gap: rs(12),
    borderLeftWidth: rs(3),
    borderLeftColor: 'transparent',
  },
  rowOverdue: {
    backgroundColor: rd.color.errorBg,
    borderLeftColor: rd.color.error,
  },
  avatar: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: rd.font.bold, fontSize: rs(15) },
  rowMid: { flex: 1 },
  name: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    marginTop: rs(4),
  },
  dueDate: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginRight: rs(4),
  },
  dueBadge: {
    paddingHorizontal: rs(7),
    paddingVertical: rs(2),
    borderRadius: rd.radius.pill,
  },
  dueBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  amount: { fontFamily: rd.font.bold, fontSize: rs(14) },

  separator: {
    height: 1,
    backgroundColor: rd.color.border,
    marginLeft: rs(66),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(14),
    paddingVertical: rs(10),
  },
  headerCol: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  headerAmount: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },

  empty: { alignItems: 'center', paddingVertical: rs(20) },
  emptyLottie: { width: rs(150), height: rs(150) },
  emptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
});
