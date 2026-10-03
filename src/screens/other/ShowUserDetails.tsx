import {
  ActivityIndicator,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import Loading from '../components/Loading';
import AnimatedEmpty from '../components/AnimatedEmpty';
import { exportCsv } from '../../helper/csvExport';
import ContractsSwipeList, {
  ContractFilter,
  contractFilterKey,
  contractStatusMeta,
  filterContracts,
} from './ContractsSwipeList';

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
  ArrowDown,
  CalendarIcon,
  ClockIcon,
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

// /contract/between limiti 50; sayt kabi eng ko'pi 20 sahifa (1000 ta) yig'iladi.
const BETWEEN_LIMIT = 50;
const BETWEEN_MAX_PAGES = 20;
const DOWNLOAD_GREEN = '#1d7a45';

// 02.10: jarayondagi shartnomalar TEPADA, keyin yopilganlar — har guruh ichida yangi→eski.
const sortContracts = (rows: any[]): any[] => {
  const finished = (c: any) => {
    const k = contractFilterKey(c?.status);
    return k === 'completed' || k === 'rejected' ? 1 : 0;
  };
  const ts = (c: any) => new Date(c?.created_at || 0).getTime();
  return rows.slice().sort((a, b) => finished(a) - finished(b) || ts(b) - ts(a));
};

const ShowUserDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, type } = route.params;
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  // R5: shu foydalanuvchi bilan tuzilgan shartnomalar.
  const [contracts, setContracts] = useState<any[]>([]);
  // 02.10: holat filtri + yuklanish holati + bosqichma-bosqich ko'rsatish.
  const [contractsLoading, setContractsLoading] = useState(false);
  const [filter, setFilter] = useState<ContractFilter>('all');
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector(state => state.HomeReducer.user);

  useEffect(() => {
    getUserData();
  }, []);

  // 02.10: saytdagi kabi `GET /contract/between/:uid` — MEN va SHU foydalanuvchi
  // o'rtasidagi BARCHA shartnomalar (ikkala yo'nalish, tugallangan/jarayondagi/rad).
  // Sahifalab yig'iladi. Endpoint mavjud bo'lmasa (eski server) — `null`.
  const fetchBetween = useCallback(async (uid: string): Promise<any[] | null> => {
    const token = storage.getString('token');
    const hdr = { headers: { Authorization: `Bearer ${token}` } };
    const all: any[] = [];
    try {
      let pages = 1;
      for (let p = 1; p <= pages && p <= BETWEEN_MAX_PAGES; p++) {
        const res = await axios.get(
          URL + `/contract/between/${encodeURIComponent(uid)}?page=${p}&limit=${BETWEEN_LIMIT}`,
          hdr,
        );
        const body = res?.data || {};
        all.push(...((body.data as any[]) || []));
        pages = Number(body?.pagination?.pages) || 1;
      }
      return all;
    } catch (e) {
      return all.length ? all : null;
    }
  }, []);

  // R5 (zaxira): qarama-qarshi tomonni TELEFONI bo'yicha debitor + creditor
  // hisobotlaridan qidiramiz, id bo'yicha dublikatlar olib tashlanadi.
  // 02.10: yo'nalish (`direction`) hisobot turidan tiklanadi (debitor = men berganman).
  const fetchByPhone = useCallback(async (phone: string): Promise<any[]> => {
    const p = String(phone || '').trim();
    if (!p) return [];
    const token = storage.getString('token');
    const hdr = { headers: { Authorization: `Bearer ${token}` } };
    const q = encodeURIComponent(p);
    const [deb, cred] = await Promise.all([
      axios
        .get(URL + `/contract/report/search?type=debitor&page=1&limit=100&search=${q}`, hdr)
        .catch(() => null),
      axios
        .get(URL + `/contract/report/search?type=creditor&page=1&limit=100&search=${q}`, hdr)
        .catch(() => null),
    ]);
    const rows = [
      ...((deb?.data?.data as any[]) || []).map(r => ({ ...r, direction: 'lent' })),
      ...((cred?.data?.data as any[]) || []).map(r => ({ ...r, direction: 'borrowed' })),
    ];
    const map = new Map();
    for (const r of rows) if (r?.id != null && !map.has(r.id)) map.set(r.id, r);
    return Array.from(map.values());
  }, []);

  const fetchContracts = useCallback(
    async (uid: string, phone: string) => {
      setContractsLoading(true);
      try {
        const between = uid ? await fetchBetween(uid) : null;
        const list = between ?? (await fetchByPhone(phone));
        setContracts(sortContracts(list));
      } catch (e) {
        // jim — bo'lim bo'sh holatda qoladi
      } finally {
        setContractsLoading(false);
      }
    },
    [fetchBetween, fetchByPhone],
  );

  const getUserData = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data } = await axios.get(URL + `/user/candidate/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(data?.data);
      setLoading(false);
      fetchContracts(data?.data?.uid, data?.data?.phone);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [fetchContracts]);

  // 02.10: filtr bo'yicha sonlar va filtrlangan ro'yxat (hisoblagich va yuklab olish shunga mos).
  const filterCounts = useMemo(() => {
    const cnt: Record<ContractFilter, number> = {
      all: contracts.length,
      completed: 0,
      active: 0,
      rejected: 0,
    };
    contracts.forEach(c => {
      const k = contractFilterKey(c?.status);
      if (k !== 'other') cnt[k] += 1;
    });
    return cnt;
  }, [contracts]);
  const filtered = useMemo(() => filterContracts(contracts, filter), [contracts, filter]);

  // 02.10: filtr qo'llangan shartnomalar ro'yxatini yuklab olish (saytdagi kabi ustunlar:
  // Shartnoma, Yo'nalish, Summa, Qoldiq, Tuzilgan, Muddat, Holat). CSV — SearchDebitor bilan
  // bir xil umumiy yordamchi orqali.
  const onDownload = () => {
    const u: any = data || {};
    const who = [u.last_name, u.first_name, u.middle_name].filter(Boolean).join(' ') || u.uid || 'user';
    return exportCsv({
      baseName: `${who}_${t('Shartnomalar')}`,
      header: [
        t('Shartnoma'),
        t('Yo‘nalish'),
        t('Summa'),
        t('Valyuta'),
        t('Qoldiq'),
        t('Tuzilgan'),
        t('Muddat'),
        t('Holat'),
      ],
      rows: filtered.map(c => [
        c?.number || c?.uid || '',
        c?.direction === 'lent' ? t('Berilgan') : c?.direction === 'borrowed' ? t('Olingan') : '',
        c?.amount,
        c?.currency,
        c?.residual_amount ?? '',
        formatBirthday(c?.contract_date || c?.created_at),
        formatBirthday(c?.sana || c?.end_date),
        contractStatusMeta(c?.status, t).label,
      ]),
    });
  };

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

      {/* R5: shu foydalanuvchi bilan tuzilgan shartnomalar — bosilsa tafsilotga o'tadi.
          02.10: saytdagi kabi holat filtri (Barchasi/Tugallangan/Jarayonda/Rad etilgan) +
          filtrlangan ro'yxatni "Yuklash" (CSV). Bo'sh bo'lsa — animatsiyali bo'sh holat. */}
      <View style={styles.contractsCard}>
        <View style={styles.contractsHead}>
          <Text allowFontScaling={false} style={styles.contractsTitle} numberOfLines={1}>
            {t('Shartnomalar')}
          </Text>
          {!contractsLoading && (
            <View style={styles.countChip}>
              <Text allowFontScaling={false} style={styles.countChipText}>
                {filtered.length} {t('ta')}
              </Text>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={contractsLoading || !filtered.length}
            onPress={onDownload}
            accessibilityRole="button"
            accessibilityLabel={t('Yuklash')}
            style={[styles.downloadBtn, (contractsLoading || !filtered.length) && styles.downloadBtnOff]}>
            <ArrowDown size={rs(14)} color={rd.color.onPrimary} />
            <Text allowFontScaling={false} style={styles.downloadText}>
              {t('Yuklash')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 03.10 (1-band): filtr chip bosib HAM, ro'yxatni chapga/o'ngga surib HAM almashadi
            (pastki menyu kabi PagerView). "Yuklash" va son — faol filtr bo'yicha. */}
        {contractsLoading ? (
          <ActivityIndicator style={styles.contractsLoader} color={rd.color.primary} />
        ) : contracts.length === 0 ? (
          <AnimatedEmpty variant="loan" compact text={t('Bu foydalanuvchi bilan shartnomalar yo‘q')} />
        ) : (
          <ContractsSwipeList
            contracts={contracts}
            filter={filter}
            counts={filterCounts}
            onFilterChange={setFilter}
            onOpen={c => navigation.navigate('DownloadStatistic', { item: c, id: c?.id })}
          />
        )}
      </View>
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
  // 02.10: sarlavha qatori — nom + son + "Yuklash" tugmasi.
  contractsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    paddingTop: rs(10),
    paddingBottom: rs(8),
  },
  contractsTitle: {
    flexShrink: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(14.5),
    color: rd.color.text,
  },
  countChip: {
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
  },
  countChipText: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary },
  downloadBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    height: rs(34),
    paddingHorizontal: rs(12),
    borderRadius: rd.radius.pill,
    backgroundColor: DOWNLOAD_GREEN,
  },
  downloadBtnOff: { opacity: 0.45 },
  downloadText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.onPrimary },
  contractsLoader: { paddingVertical: rs(24) },

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
