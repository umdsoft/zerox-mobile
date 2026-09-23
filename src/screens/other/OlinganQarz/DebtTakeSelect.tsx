import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import Loading from '../../components/Loading';
import axios from 'axios';
import { storage } from '../../../store/api/token/getToken';
import { URL } from '../../constants';
import {
  AnimatedIconCircle,
  FullReturnIcon,
  PartReturnIcon,
} from '../../../images/debtActionIcons';
import { ChevronRight, HandCoinReturnIcon, WalletIcon } from '../../home/redesign/icons';
import { sortText } from '../../components/StatisticCard';
import { t } from 'i18next';
import ScreenLayout from '../../components/ScreenLayout';
import { rd, rs } from '../../../theme/rd';

// To'liq = YASHIL (yopiladi/tugallanadi), Qisman = KO'K — bir qarashda farqlanadi.
const FULL = '#16a34a';
const PART = '#2f6fed';

const DebtTakeSelect = () => {
  const navigation = useNavigation<any>();
  const { item } = (useRoute().params as any) || {};

  const [info, setInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    getData();
  }, []);
  const getData = async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data, status } = await axios.get(
        URL + `/contract/by/${item?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (status === 200) {
        setInfo(data);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  // Shartnoma qoldig'i (bor bo'lsa kontekst-kartaда ko'rsatiladi).
  const c: any = info?.data || {};
  const residual = Number(c?.residual_amount || 0);
  const currency = c?.currency || 'UZS';
  const number = c?.number;

  // Bitta tanlov-karta: rangли ikona-badge + sarlavha (izohsiz — so'rov bo'yicha)
  // + chevron. Butun karta bosiladi. Sarlavha 2 qatorgача (truncation yo'q).
  const Choice = ({
    color,
    tint,
    icon,
    title,
    onPress,
  }: {
    color: string;
    tint: string;
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.choice, { borderColor: tint, shadowColor: color }]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: color }]}>{icon}</View>
      {/* Oxirgi so'z ("qaytarish") HAR DOIM 2-qatorda — ikki karta bir xil ko'rinadi
          (avval "to'liq" 1 qatorда, "qisman" kesilardi). */}
      <Text style={styles.choiceTitle} allowFontScaling={false} numberOfLines={2}>
        {title.replace(/\s+(\S+)$/, '\n$1')}
      </Text>
      <ChevronRight size={rs(20)} color={color} />
    </TouchableOpacity>
  );

  return (
    <ScreenLayout title={t('438')} scroll={false}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <Loading />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Harakatlanuvchi hero ikonka — pulni EGASIGA QAYTARISHNI ifodalaydi
              (ochiq kaft pulni uzatmoqda + yengil puls). Ilgari $-tanga edi ($ /
              DB / nishon rad etilgan) — endi "qo'l bilan pulni topshirish". */}
          <View style={styles.heroWrap}>
            <AnimatedIconCircle size={rs(96)} bg={rd.color.primary}>
              <HandCoinReturnIcon size={rs(46)} color="#fff" />
            </AnimatedIconCircle>
          </View>

          {/* Kontekst — qaysi shartnoma + qoldiq qarz (mavjud bo'lsa). */}
          {residual > 0 ? (
            <View style={styles.ctxCard}>
              <View style={styles.ctxIcon}>
                <WalletIcon size={rs(22)} color={rd.color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctxLabel} allowFontScaling={false}>
                  {t('Qoldiq qarz')}
                </Text>
                <Text
                  style={styles.ctxAmount}
                  allowFontScaling={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {sortText(residual)} {currency}
                </Text>
              </View>
              {number ? (
                <View style={styles.ctxBadge}>
                  <Text style={styles.ctxBadgeText} allowFontScaling={false}>
                    № {number}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.pickLabel} allowFontScaling={false}>
            {t('Qaytarish usulini tanlang')}
          </Text>

          {/* To'liq — YASHIL (yopiladi/tugallanadi) */}
          <Choice
            color={FULL}
            tint={FULL + '40'}
            icon={<FullReturnIcon width={rs(26)} height={rs(26)} />}
            title={t('441')}
            onPress={() =>
              navigation.navigate('DebtTakeFull', { item: info.data, id: item?.id })
            }
          />

          {/* Qisman — KO'K */}
          <Choice
            color={PART}
            tint={PART + '40'}
            icon={<PartReturnIcon width={rs(26)} height={rs(26)} />}
            title={t('450')}
            onPress={() =>
              navigation.navigate('DebtTakePart', { item: info.data, id: item?.id })
            }
          />
        </View>
      )}
    </ScreenLayout>
  );
};

export default DebtTakeSelect;

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // scroll={false} + flex:1 + markazда: hero+kontekst+kartalar guruh sifatida
  // vertikal markazlashadi -> sahifaning pastki bo'sh joyi yo'qoladi (balansli).
  content: {
    flex: 1,
    paddingHorizontal: rs(20),
    paddingVertical: rs(16),
    justifyContent: 'center',
    gap: rs(14),
  },
  heroWrap: { alignItems: 'center', marginBottom: rs(6) },

  // Kontekst-karta — qoldiq qarz + shartnoma raqami.
  ctxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  ctxIcon: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctxLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  ctxAmount: {
    fontFamily: rd.font.bold,
    fontSize: rs(19),
    color: rd.color.text,
    marginTop: rs(2),
  },
  ctxBadge: {
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
  },
  ctxBadgeText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
  },

  pickLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    marginTop: rs(2),
    marginLeft: rs(2),
  },

  // Tanlov-karta — rich: rangли ikona-badge + matn + chevron. Butun karta bosiladi.
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1.5,
    paddingVertical: rs(16),
    paddingHorizontal: rs(16),
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  choiceIcon: {
    width: rs(52),
    height: rs(52),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTitle: {
    flex: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
    lineHeight: rs(20),
  },
});
