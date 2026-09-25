import { Clipboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { useSelector } from 'react-redux';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import Edit from '../../images/Edit';
import ScreenLayout from '../components/ScreenLayout';
import { t } from 'i18next';
import { normalize } from '../../theme/style';
import { rd, rs } from '../../theme/rd';
import { ArrowDown, ArrowUp, AvatarPersonIcon, CopyIcon, StarIcon } from '../home/redesign/icons';
import { useFetch } from '../../hooks/useFetch';
import { URL } from '../constants';

// So'z boshini katta, "o'g'li/qizi" kichik harflar bilan.
const titleCaseName = (s?: string) =>
  (s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => {
      const lw = w.toLowerCase();
      if (/^(o.?g.?li|qizi|ug.?li)$/.test(lw)) return lw;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');

// Reyting trend strelkasi — SAYT (cabinet/index.vue `ratingArrow`) bilan AYNAN bir xil
// mantiq. Strelka reyting QIYMATIga emas, `rating_type` (TREND) ga bog'liq:
//   1 = ↑ yakka (oshgan)          3 = ⇑ juft (3 marta ketma-ket oshgan)
//   2 = ↓ yakka (kamaygan)        4 = ⇓ juft (3 marta ketma-ket kamaygan)
//   0/null = strelka YO'Q (hali trend yo'q — masalan yangi foydalanuvchi).
const ratingTrend = (type?: number) => {
  const t = Number(type);
  if (t === 1) return { up: true, strong: false };
  if (t === 3) return { up: true, strong: true };
  if (t === 2) return { up: false, strong: false };
  if (t === 4) return { up: false, strong: true };
  return null;
};

// Sayt bilan bir xil ranglar: o'sish yashil (#16a34a), kamayish qizil (#dc2626).
const RATING_UP_COLOR = '#16a34a';
const RATING_DOWN_COLOR = '#dc2626';

const InfoRow = ({ label, value, divider, right }: any) => (
  <View style={[styles.infoRow, divider && styles.infoDivider]}>
    <View style={styles.infoTextWrap}>
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.value}>
        {value}
      </Text>
    </View>
    {right}
  </View>
);

const UserDetails = () => {
  const navigation = useNavigation();

  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).

  const user = useSelector((state: any) => state.HomeReducer.user);
  const d = user?.data || {};
  const isPerson = d?.type === 2;

  // Reyting — REAL manba (/user/me → data.rating + data.rating_type). Sayt shaxsiy
  // kabinetidagi "Reyting ★ 0.00 ↑" ko'rsatkichi bilan bir xil. `rating_type` ham
  // shu endpointdan keladi (backend to'liq user qatorini qaytaradi).
  const me = useFetch({ method: 'GET', url: URL + '/user/me' });
  const meData = (me.data as any)?.data;
  const rating = Number(meData?.rating ?? d?.rating ?? 0) || 0;
  const trend = ratingTrend(meData?.rating_type ?? d?.rating_type);

  // FISH: familiya + ism BIR qatorda, otasining ismi PASTKI qatorda (so'rov bo'yicha).
  const line1 = isPerson
    ? titleCaseName(`${d?.last_name ?? ''} ${d?.first_name ?? ''}`)
    : d?.company || '';
  const line2 = isPerson ? titleCaseName(`${d?.middle_name ?? ''}`) : '';

  // JShShIR (PINFL) ni clipboard'ga nusxalash + qisqa toast.
  // "Nusxalandi" sarlavhasi OLIB TASHLANDI (so'rov bo'yicha): faqat bitta
  // jirniy "JShShIR nusxalandi" qatori ko'rsatiladi (title = semibold).
  const copyPinfl = () => {
    Clipboard.setString(String(d?.pinfl ?? ''));
    Toast.show({
      autoHide: true,
      visibilityTime: 1800,
      position: 'bottom',
      type: 'omad',
      props: { desc: t('JShShIR nusxalandi') + '.' },
    });
  };

  return (
    <ScreenLayout title={t('810')} scroll={false} contentStyle={styles.content}>
      {/* Sarlavha kartasi — avatar + FISH (2 qator) + reyting. */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <AvatarPersonIcon size={rs(46)} color={rd.color.primary} />
        </View>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.headerName}>
          {line1}
        </Text>
        {line2 ? (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={styles.headerName2}>
            {line2}
          </Text>
        ) : null}
        <View style={styles.ratingChip}>
          <Text style={styles.ratingLabel}>Reyting</Text>
          <StarIcon size={rs(14)} color="#f5a623" />
          <Text style={styles.ratingScore}>{rating.toFixed(2)}</Text>
          {/* Trend strelkasi — SAYT bilan bir xil: o'sish yashil ↑ / kamayish qizil ↓;
              3 marta ketma-ket bo'lsa juft strelka (⇑/⇓). Trend yo'q bo'lsa — strelka YO'Q. */}
          {trend ? (
            <View style={styles.trendWrap}>
              {trend.up ? (
                <ArrowUp size={rs(14)} color={RATING_UP_COLOR} strokeWidth={2.6} />
              ) : (
                <ArrowDown size={rs(14)} color={RATING_DOWN_COLOR} strokeWidth={2.6} />
              )}
              {trend.strong ? (
                <View style={styles.trendSecond}>
                  {trend.up ? (
                    <ArrowUp size={rs(14)} color={RATING_UP_COLOR} strokeWidth={2.6} />
                  ) : (
                    <ArrowDown size={rs(14)} color={RATING_DOWN_COLOR} strokeWidth={2.6} />
                  )}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {/* Ma'lumotlar — TARTIB: Tizimdagi ID → Tug'ilgan sana → JShShIR →
          Telefon → Ro'yxatdan o'tgan vaqti (so'rov bo'yicha). */}
      <View style={styles.card}>
        <InfoRow label="Tizimdagi ID raqami" value={d?.uid} />
        {isPerson ? (
          <InfoRow label={t('684')} value={d?.brithday} divider />
        ) : null}
        {isPerson ? (
          <InfoRow
            label={t('687')}
            value={d?.pinfl}
            divider
            right={
              <TouchableOpacity onPress={copyPinfl} style={styles.editBtn}>
                <CopyIcon size={rs(18)} color={rd.color.primary} />
              </TouchableOpacity>
            }
          />
        ) : null}
        <InfoRow
          label={t('27')}
          value={phoneSort(d?.phone)}
          divider
          right={
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('ChangePhoneNumber');
              }}
              style={styles.editBtn}
            >
              <Edit width={normalize(18)} height={normalize(18)} />
            </TouchableOpacity>
          }
        />
        <InfoRow
          label={t('255')}
          value={settingDate(d?.created_at)}
          divider
        />
      </View>
    </ScreenLayout>
  );
};

export default UserDetails;
// SS-AUDIT (2026-09-25): bu yerdagi nusxa `new Date(text)` bilan "YYYY-MM-DD
// HH:MM:SS.mmm" ni parse qilolmay "NaN.NaN.NaN" qaytarardi (helper/index.ts'da
// 24.09 da tuzatilgan parser bor). Endi YAGONA manba — helper.settingDate.
import { settingDate } from '../../helper';
export { settingDate };
export const phoneSort = text => {
  let b = [];
  if (!text) return '';
  String(text)
    .split('')
    .forEach((item, index) => {
    if (index === 6) {
      b.push(' ');
    }
    if (index === 9) {
      b.push(' ');
    }
    if (index === 11) {
      b.push(' ');
    }
    b.push(item);
  });
  return b?.toString()?.replace(/,/g, '');
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: rs(16), paddingBottom: rs(20) },
  headerCard: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    paddingVertical: rs(22),
    paddingHorizontal: rs(16),
    marginBottom: rs(12),
  },
  avatar: {
    width: rs(88),
    height: rs(88),
    borderRadius: rs(44),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
  },
  headerName: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
  },
  headerName2: {
    fontFamily: rd.font.medium,
    fontSize: rs(15.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(3),
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    marginTop: rs(12),
  },
  ratingLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginRight: rs(2),
  },
  ratingScore: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  trendWrap: { flexDirection: 'row', alignItems: 'center' },
  trendSecond: { marginLeft: rs(-8) }, // juft strelka ustma-ust (sayt -ml-1.5 kabi)
  card: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingHorizontal: rs(14),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(13),
  },
  infoDivider: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  infoTextWrap: {
    flex: 1,
  },
  label: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    marginBottom: rs(3),
  },
  value: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
  },
  editBtn: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: rs(10),
  },
});
