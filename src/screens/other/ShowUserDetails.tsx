import {
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import Loading from '../components/Loading';
import { sortMoneyText } from '../components/StatisticCard';

import { storage } from '../../store/api/token/getToken';
import axios from 'axios';
import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';
import { URL } from '../constants';
import { useSelector } from 'react-redux';
import ScreenLayout from '../components/ScreenLayout';
import Famale from '../../images/Famale';
import { settingDate } from '../../helper';
import { t } from 'i18next';
import { rd, rs } from '../../theme/rd';
import {
  CalendarIcon,
  ChevronRight,
  ClockIcon,
  ContractIcon,
  IconProps,
  IdCardIcon,
  LocationIcon,
  PhoneIcon,
  PhoneCallIcon,
  MessageIcon,
} from '../home/redesign/icons';

const InfoRow = ({
  Icon,
  label,
  value,
  divider,
  right,
}: {
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  value?: string;
  divider?: boolean;
  right?: React.ReactNode;
}) => (
  <View style={[styles.infoRow, divider && styles.infoDivider]}>
    <View style={styles.infoIcon}>
      <Icon size={rs(18)} color={rd.color.primary} />
    </View>
    <View style={styles.infoTextWrap}>
      <Text allowFontScaling={false} style={styles.infoLabel}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={styles.infoValue}>
        {value}
      </Text>
    </View>
    {right}
  </View>
);

// SS-E: shartnoma holati REAL statusdan (backend CONTRACT_STATUS):
// 0=Kutilmoqda, 1=Jarayonda(faol), 2=Tugallangan, 3=Bekor qilingan, 4=Rad etilgan,
// 5=Muddati o'tgan, 10=O'chirilgan. Ilgari faqat 2 va 4 qaralib, 3/5 noto'g'ri
// "Jarayonda" ko'rinardi (ro'yxat ↔ shartnoma ichidagi holat mos kelmasdi).
const contractStatusMeta = (status: any, t: any): { label: string; color: string } => {
  const s = Number(status);
  if (s === 2) return { label: t('198'), color: '#16a34a' }; // Tugallangan
  if (s === 3 || s === 4) return { label: t('261'), color: '#dc2626' }; // Bekor/Rad etilgan
  if (s === 5) return { label: t('Muddati o‘tgan'), color: '#dc2626' };
  if (s === 10) return { label: t('O‘chirilgan'), color: '#94a3b8' };
  if (s === 0) return { label: t('Kutilmoqda'), color: '#f59e0b' };
  return { label: t('195'), color: '#f59e0b' }; // Jarayonda (1)
};

// Tug'ilgan sanani DD.MM.YYYY ko'rinishiga keltiradi (SS4 so'rovi).
// Backend "1999-07-06" (YYYY-MM-DD, ba'zan vaqt qismi bilan) qaytaradi — foydalanuvchi
// "06.07.1999" ko'rishi kerak. new Date() ISHLATMAYMIZ (timezone kuni surib yuborishi
// mumkin) — matnni to'g'ridan-to'g'ri qayta joylashtiramiz. ISO bo'lmasa o'zgarmaydi.
const formatBirthday = (s?: string): string => {
  if (!s) return '';
  const str = String(s).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : str;
};

const ShowUserDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, type } = route.params;
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  // R5: shu foydalanuvchi bilan tuzilgan shartnomalar.
  const [contracts, setContracts] = useState<any[]>([]);
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector(state => state.HomeReducer.user);

  useEffect(() => {
    getUserData();
  }, []);

  // R5: qarama-qarshi tomon (profil egasi) bilan tuzilgan shartnomalarni uning
  // TELEFONI bo'yicha topamiz. debitor + creditor hisobotlarini qidiramiz va
  // id bo'yicha dublikatlarni olib tashlaymiz. Xatolik jim — bo'lim ko'rsatilmaydi.
  const fetchContracts = useCallback(async (phone: string) => {
    const p = String(phone || '').trim();
    if (!p) return;
    const token = storage.getString('token');
    const hdr = { headers: { Authorization: `Bearer ${token}` } };
    const q = encodeURIComponent(p);
    try {
      const [deb, cred] = await Promise.all([
        axios
          .get(URL + `/contract/report/search?type=debitor&page=1&limit=100&search=${q}`, hdr)
          .catch(() => null),
        axios
          .get(URL + `/contract/report/search?type=creditor&page=1&limit=100&search=${q}`, hdr)
          .catch(() => null),
      ]);
      const rows = [
        ...((deb?.data?.data as any[]) || []),
        ...((cred?.data?.data as any[]) || []),
      ];
      const map = new Map();
      for (const r of rows) if (r?.id != null && !map.has(r.id)) map.set(r.id, r);
      // C: JARAYONDAGI (status 0/1 — pending/faol) shartnomalar TEPADA, keyin
      // Tugallangan(2)/Rad etilgan(4) — har guruh ichida yangi→eski (xronologik).
      const finished = (c: any) => c?.status === 2 || c?.status === 4;
      const ts = (c: any) => new Date(c?.created_at || 0).getTime();
      const list = Array.from(map.values()).sort((a: any, b: any) => {
        const fa = finished(a) ? 1 : 0;
        const fb = finished(b) ? 1 : 0;
        if (fa !== fb) return fa - fb; // jarayondagi (0) oldinda
        return ts(b) - ts(a); // yangi→eski
      });
      setContracts(list);
    } catch (e) {
      // jim
    }
  }, []);

  const getUserData = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data } = await axios.get(URL + `/user/candidate/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(data?.data);
      setLoading(false);
      fetchContracts(data?.data?.phone);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [fetchContracts]);

  if (loading) {
    return <Loading />;
  }
  return (
    <ScreenLayout title={type ? t('273') : t('270')}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      {/* SS19: sarlavha karta qarz-daftari uslubida — avatar CHAPDA + FISH yonида,
          tagida ID va telefon (ikonка bilan) + SMS/qo'ng'iroq tugmalari. */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.avatarSm}>
            {user?.data?.type === 2 ? (
              user?.data?.gender === 2 ? (
                <Famale width={rs(26)} height={rs(26)} color={rd.color.primary} />
              ) : (
                <Person width={rs(26)} height={rs(26)} color={rd.color.primary} />
              )
            ) : (
              <Juridic width={rs(26)} height={rs(26)} color={rd.color.primary} />
            )}
          </View>
          <Text allowFontScaling={false} style={styles.nameLeft} numberOfLines={2}>
            {data?.last_name + ' ' + data?.first_name + ' ' + data?.middle_name}
          </Text>
        </View>
        {/* SS4: ID-karta ikonkasi OLIB TASHLANdi — "ID" va raqam uning o'rnida. */}
        <View style={styles.hRow}>
          <Text allowFontScaling={false} style={styles.hLabel}>ID</Text>
          <Text allowFontScaling={false} style={styles.hValue} numberOfLines={1}>{data?.uid || '—'}</Text>
        </View>
        {!!data?.phone && (
          <View style={styles.hRow}>
            <PhoneIcon size={rs(15)} color={rd.color.textTertiary} />
            <Text allowFontScaling={false} style={[styles.hValue, { flex: 1 }]} numberOfLines={1}>{data?.phone}</Text>
            <View style={styles.phoneActions}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => Linking.openURL(`sms:${data?.phone}`)} style={styles.smsBtn}>
                <MessageIcon size={rs(16)} color={rd.color.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => Linking.openURL(`tel:${data?.phone}`)} style={styles.callBtn}>
                <PhoneCallIcon size={rs(16)} color={rd.color.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* SS19: tug'ilgan sana / manzil / ro'yxatdan o'tgan vaqti — ALOHIDA karta. */}
      <View style={styles.infoCard}>
        <InfoRow Icon={CalendarIcon} label={t('684')} value={formatBirthday(data?.brithday)} />
        <InfoRow
          Icon={LocationIcon}
          label="Manzili"
          value={`${data?.region ?? ''} ${data?.district ?? ''}`.trim()}
          divider
        />
        <InfoRow
          Icon={ClockIcon}
          label={t('255')}
          value={settingDate(data?.created_at)}
          divider
        />
      </View>

      {/* R5: shu foydalanuvchi bilan tuzilgan shartnomalar — bosilsa tafsilotga o'tadi. */}
      {contracts.length > 0 && (
        <View style={styles.contractsCard}>
          <Text allowFontScaling={false} style={styles.contractsTitle}>
            {t('Shartnomalar')}
          </Text>
          {contracts.map((c, i) => (
            <TouchableOpacity
              key={c?.id ?? i}
              activeOpacity={0.85}
              style={[styles.contractRow, i > 0 && styles.contractDivider]}
              onPress={() =>
                navigation.navigate('DownloadStatistic', { item: c, id: c?.id })
              }>
              <View style={styles.contractIcon}>
                <ContractIcon size={rs(18)} color={rd.color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={styles.contractNumber} numberOfLines={1}>
                  {c?.number ? `№ ${c.number}` : t('Shartnoma')}
                </Text>
                {/* C: sana OLIB TASHLANDI — faqat holat (rangli).
                    SS-E: holat REAL statusdan kelib chiqadi (ilgari faqat 2 va 4 qaralib,
                    3=bekor va 5=muddati o'tgan "Jarayonda" bo'lib noto'g'ri ko'rinardi).
                    CONTRACT_STATUS: 0=kutil,1=faol,2=yakun,3=bekor,4=rad,5=muddat,10=o'chirilgan. */}
                {(() => {
                  const m = contractStatusMeta(c?.status, t);
                  return (
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={[styles.contractMeta, { color: m.color }]}>
                      {m.label}
                    </Text>
                  );
                })()}
              </View>
              <View style={styles.contractRight}>
                <Text allowFontScaling={false} style={styles.contractAmount} numberOfLines={1}>
                  {sortMoneyText(c?.amount) || 0} {c?.currency || ''}
                </Text>
                <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScreenLayout>
  );
};

export default ShowUserDetails;

const styles = StyleSheet.create({
  // C: profil kartasi brend-tint fonда (oq info/shartnoma kartalaridan ajralib turadi).
  profileCard: {
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.xxl,
    borderWidth: 1,
    borderColor: rd.color.primary + '33',
    alignItems: 'center',
    paddingVertical: rs(22),
    paddingHorizontal: rs(16),
    marginTop: rs(8),
  },
  avatar: {
    width: rs(96),
    height: rs(96),
    borderRadius: rs(48),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(14),
    maxWidth: '90%',
  },
  // SS19: qarz-daftari uslubidagi sarlavha karta
  headerCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginTop: rs(8),
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatarSm: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameLeft: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  hLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textTertiary },
  hValue: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },

  infoCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginTop: rs(16),
    paddingHorizontal: rs(14),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingVertical: rs(14),
  },
  infoDivider: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  infoIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  infoValue: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
    marginTop: 3,
  },
  // R5: Shartnomalar bo'limi
  contractsCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginTop: rs(16),
    paddingHorizontal: rs(14),
    paddingVertical: rs(6),
  },
  contractsTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(14.5),
    color: rd.color.text,
    marginTop: rs(10),
    marginBottom: rs(4),
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingVertical: rs(12),
  },
  contractDivider: { borderTopWidth: 1, borderTopColor: rd.color.border },
  contractIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractNumber: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  contractMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  contractRight: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  contractAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },

  // Telefon raqami o'ng tomonidagi ikki tugma qatori (SMS + qo'ng'iroq).
  phoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginLeft: rs(8),
  },
  // SMS yozish tugmasi (ko'k — brend rangi, qo'ng'iroqdan farqli).
  smsBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Telefon qilish tugmasi (yashil, telefon raqami o'ng tomonida).
  callBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
