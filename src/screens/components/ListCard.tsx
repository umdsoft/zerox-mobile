import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo, useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { t } from 'i18next';
import { rd, rs } from '../../theme/rd';
import { sortText } from './StatisticCard';
import { ClockIcon } from '../home/redesign/icons';

// REDIZAYN: eski jadval (style.blue chiziq, MainText) o'rniga zamonaviy detail karta —
// oq surface, yumaloq, valyuta segment-toggle, muddat holati rangli (yaqin=warning,
// muddati o'tgan/bugun=error). Navigatsiya, valyuta filtrlash va ma'lumot O'ZGARMAGAN.

const ListCard = ({
  title,
  type,
  color,
  width,
  disabled,
  data,
  userType,
  isHave,
}) => {
  const navigation = useNavigation();
  const [blue, setBlue] = useState(true);
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
  const onChangeColor = useCallback(bool => {
    setBlue(bool);
  }, []);

  // Yo'nalish bo'yicha summa rangi: debitor (menga qarzdor) = error, creditor = success.
  const isDebitor = userType === 1;
  const dirColor = isDebitor ? rd.color.error : rd.color.success;

  const onPress = item => {
    // mysql2 DATE ustunni TZ-siljishli ISO qaytaradi (masalan 2026-07-15 ->
    // "2026-07-14T19:00:00.000Z"). Backend /contract/near `day`ni 'YYYY-MM-DD' kutadi —
    // shuning uchun mahalliy (UTC+5) sanaga keltiramiz. Backend TEGILMAYDI (web ham shu
    // endpointni ishlatadi); faqat mobil to'g'ri formatda yuboradi.
    const ed = new Date(item.end_date);
    const day = isNaN(ed.getTime())
      ? item.end_date
      : new Date(ed.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
    navigation.navigate('SearchDebitor', {
      iconType: 1,
      title: title,
      type: type,
      color: color,
      person: userType === 1 ? 'debitor' : 'creditor',
      url: `/contract/near?type=${
        userType === 1 ? 'debitor' : 'creditor'
      }&day=${day}&page=1&limit=500&currency=${item.currency}`,
      isHave,
      searchUrl: `/contract/near?type=${
        userType === 1 ? 'debitor' : 'creditor'
      }&page=1&limit=500&search=`,
    });
  };

  const list = blue ? uz : usd;
  const isEmpty = data?.length === 0 || list.length === 0;

  return (
    <View style={[styles.card, { width: width }]}>
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
        <Text allowFontScaling={false} style={styles.headerLabel}>
          {t('174')}
        </Text>
        <Text allowFontScaling={false} style={styles.headerLabel}>
          {t('327')}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isEmpty ? (
          <View style={styles.empty}>
            <LottieView
              autoPlay
              source={require('../../images/lottie/list/zyDdwfLniz.json')}
              style={styles.emptyLottie}
            />
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
                  onPress={() => onPress(item)}
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
                    style={[styles.amount, { color: dirColor }]}
                    numberOfLines={1}
                  >
                    {sortText(item?.residual_amount)} {item?.currency}
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
  // Haqiqiy kun farqini hisoblaymiz. Oldin oy chegarasida oy-farqini kun deb olardi
  // (masalan 30-iyul → 2-avgust = 3 kun, lekin "1 kun" ko'rsatardi).
  const d = new Date(date);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);
  return pp(diffDays);
};

const pp = (day: number) => {
  switch (Math.abs(day)) {
    case 1:
      return t('423', { count: 1 });
    case 2:
      return t('426', { count: 2 });
    case 3:
      return t('426', { count: 3 });
    case 4:
      return t('426', { count: 4 });
    case 5:
      return t('435', { count: 5 });
    default:
      return t('843');
  }
};

// Muddat holatiga qarab rang: bugun/1 kun/2 kun/o'tgan = error, aks holda = warning.
const dayStatus = type => {
  switch (type) {
    case t('843'):
    case t('423', { count: 1 }):
    case t('426', { count: 2 }):
      return { color: rd.color.error, bg: rd.color.errorBg };
    default:
      return { color: rd.color.warning, bg: rd.color.warningBg };
  }
};

export default memo(ListCard);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
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
    paddingVertical: rs(9),
    borderRadius: rd.radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: rd.color.primary,
  },
  segmentText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
  segmentTextActive: {
    color: rd.color.onPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: rs(4),
    paddingTop: rs(14),
    paddingBottom: rs(8),
  },
  headerLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(11),
    gap: rs(12),
  },
  dayIcon: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
  },
  amount: {
    fontFamily: rd.font.bold,
    fontSize: rs(14),
  },
  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginLeft: rs(48),
  },
  empty: {
    alignItems: 'center',
    paddingVertical: rs(24),
  },
  emptyLottie: {
    width: rs(130),
    height: rs(130),
  },
});
