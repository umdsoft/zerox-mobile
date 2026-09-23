import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo, useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { t as tt } from 'i18next';
import { rd, rs } from '../../theme/rd';
import { sortText } from './StatisticCard';
import { compactKMB } from '../../helper/money';
import { ClockIcon } from '../home/redesign/icons';

// kmb=true: summa >= 1 mln bo'lsa M/B qisqartma (so'rov SS17.5), aks holda to'liq.
const amtText = (n: any, kmb?: boolean) =>
  kmb && Math.abs(Number(n) || 0) >= 1e6 ? compactKMB(n) : sortText(n);

// REDIZAYN: eski jadval o'rniga zamonaviy detail karta — oq surface, yumaloq, valyuta
// segment-toggle, muddat holati rangli. Navigatsiya va valyuta filtrlash O'ZGARMAGAN.

const ListCardShowDetails = ({ title, width, disabled, data = [], kmb }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [uz] = useState(() => {
    let a = [];
    data.map(item => {
      if (item.currency === 'UZS') {
        a.push(item);
      }
    });
    return a;
  });
  const [usd] = useState(() => {
    let b = [];
    data.map(item => {
      if (item.currency === 'USD') {
        b.push(item);
      }
    });
    return b;
  });
  const [blue, setBlue] = useState(true);
  const onChangeColor = useCallback(bool => {
    setBlue(bool);
  }, []);
  const OnPress = () => {
    navigation.navigate('SearchDebitor', {
      urls: 'contract/near?type=debitor&page=1&limit=500',
    });
  };

  const list = blue ? uz : usd;
  const isEmpty = data?.length === 0 || list.length === 0;

  return (
    <View style={[styles.card, { width: width }]}>
      {/* So'rov R11: sarlavha TO'LIQ ("...debitor qarzdorliklar", 3-nuqtasiz). Majburiy
          \n olib tashlanadi (tabiiy o'ralsin), 3 qatorgacha ruxsat. */}
      <Text allowFontScaling={false} style={styles.title} numberOfLines={3}>
        {String(title || '').replace(/\n/g, ' ')}
      </Text>

      <View style={styles.segment}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onChangeColor(true)}
          style={[styles.segmentBtn, blue && styles.segmentBtnActive]}
        >
          <Text
            allowFontScaling={false}
            style={[styles.segmentText, blue && styles.segmentTextActive]}
          >
            UZS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onChangeColor(false)}
          style={[styles.segmentBtn, !blue && styles.segmentBtnActive]}
        >
          <Text
            allowFontScaling={false}
            style={[styles.segmentText, !blue && styles.segmentTextActive]}
          >
            USD
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        {/* "Qolgan vaqt" — "vaqt" so'zi pastki qatorga (so'rov bo'yicha). Birinchi
            probelni \n ga almashtiramiz → "Qolgan" 1-qator, "vaqt" 2-qator (markazда). */}
        <Text allowFontScaling={false} style={styles.headerLabel}>
          {t('174').replace(' ', '\n')}
        </Text>
        <Text
          allowFontScaling={false}
          style={[styles.headerLabel, styles.headerLabelRight]}
        >
          {t('327')}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isEmpty ? (
          <View style={styles.empty}>
            <Text allowFontScaling={false} style={styles.emptyText}>
              {t('mavjud')}
            </Text>
          </View>
        ) : (
          list.map((item, index) => {
            const dayText = CheckDate(item?.end_date);
            const st = dayStatus(dayText);
            return (
              <View key={index}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={disabled}
                  onPress={OnPress}
                  style={styles.row}
                >
                  <View style={[styles.dayIcon, { backgroundColor: st.bg }]}>
                    <ClockIcon size={rs(18)} color={st.color} />
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={[styles.dayText, { color: st.color }]}
                    numberOfLines={1}
                  >
                    {dayText}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={styles.amount}
                    numberOfLines={1}
                  >
                    {amtText(item?.residual_amount, kmb)}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const CheckDate = date => {
  const nowMonth = new Date().getMonth();
  const getMonth = new Date(date).getMonth();
  const dd1 = new Date(date).getDate();
  const dd2 = new Date(Date.now()).getDate();

  if (nowMonth - getMonth === 0) {
    return pp(dd1 - dd2);
  }

  return pp(getMonth - nowMonth);
};
const pp = (day: number) => {
  switch (Math.abs(day)) {
    case 1:
      return tt('423', { count: 1 });
    case 2:
      return tt('426', { count: 2 });
    case 3:
      return tt('426', { count: 3 });
    case 4:
      return tt('426', { count: 4 });
    case 5:
      return tt('435', { count: 5 });
    default:
      return tt('843');
  }
};

// Muddat holatiga qarab rang: bugun/1 kun/2 kun/o'tgan = error, aks holda = warning.
const dayStatus = type => {
  switch (type) {
    case tt('843'):
    case tt('423', { count: 1 }):
    case tt('426', { count: 2 }):
      return { color: rd.color.error, bg: rd.color.errorBg };
    default:
      return { color: rd.color.warning, bg: rd.color.warningBg };
  }
};

export default memo(ListCardShowDetails);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
  },
  title: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.text,
    marginBottom: rs(10),
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    padding: rs(4),
    gap: rs(4),
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(8),
    borderRadius: rd.radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: rd.color.primary,
  },
  segmentText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
  },
  segmentTextActive: {
    color: rd.color.onPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: rs(4),
    paddingTop: rs(12),
    paddingBottom: rs(6),
  },
  headerLabel: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    // Ikkala yorliq ham USTUN MARKAZIDA (so'rov bo'yicha). Tor ustunда "Qolgan vaqt"
    // tabiiy ravishda 2 qatorga ("Qolgan" / "vaqt") o'raladi va markazда turadi.
    textAlign: 'center',
  },
  // 2-yorliq ("Qarz miqdori") ham markazga tekislanadi.
  headerLabelRight: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(9),
    gap: rs(10),
  },
  dayIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
  },
  amount: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
  },
  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginLeft: rs(44),
  },
  empty: {
    alignItems: 'center',
    paddingVertical: rs(24),
  },
  emptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
});
