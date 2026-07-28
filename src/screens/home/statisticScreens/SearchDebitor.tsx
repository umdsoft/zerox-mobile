import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useRef, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import StatisticCard, {getDueMeta} from '../../components/StatisticCard';
import {useFetch} from '../../../hooks/useFetch';
import Loading from '../../components/Loading';
import {URL} from '../../constants';
import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import {storage} from '../../../store/api/token/getToken';
import {useTranslation} from 'react-i18next';
import {rd, rs} from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import {
  SearchIcon,
  ContractIcon,
  LedgerIcon,
  ChevronRight,
  ArrowDown,
} from '../redesign/icons';
import {compactUsd, compactUzs} from '../../../helper/money';

// Qarz daftari uslubidagi ikkilamchi (binafsha) urg'u.
const LEDGER_ACCENT = '#6d5ae6';
const LEDGER_TINT = '#efe9fd';
const EXCEL_GREEN = '#1d7a45';

// Manba tanlash kartasi — TO'LIQ KENGLIK (vertikal joylashadi: shartnoma tepada,
// daftar pastda). Bosilganda tegishli ro'yxat/bo'lim ochiladi.
const SourceCardWide = ({Icon, label, uzs, usd, onPress, ledger}: any) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wideCard}>
    <View style={[styles.wideIcon, ledger && {backgroundColor: LEDGER_TINT}]}>
      <Icon size={rs(22)} color={ledger ? LEDGER_ACCENT : rd.color.primary} />
    </View>
    <View style={{flex: 1}}>
      <Text allowFontScaling={false} style={styles.wideLabel}>
        {label}
      </Text>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.wideUzs}>
        {compactUzs(uzs)}
      </Text>
      {usd > 0 ? (
        <Text allowFontScaling={false} numberOfLines={1} style={styles.wideUsd}>
          {compactUsd(usd)}
        </Text>
      ) : null}
    </View>
    <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
  </TouchableOpacity>
);

const SearchDebitor = () => {
  const {t} = useTranslation();
  // useRoute<any>() — bu ekran paramlari tiplanmagan (navigator ParamList'i yo'q).
  const route = useRoute<any>();
  const {
    title,
    color,
    type,
    url,
    person,
    isHave,
    searchUrl,
    iconType,
    initialTab,
    view, // 'select' -> 2 vertikal manba kartasi; aks holda -> qarzlar ro'yxati
  } = route.params;
  const isSelect = view === 'select';

  const [searchData, setSearchData] = useState([]);
  const [isCheck, setIsCheck] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'near' | 'overdue'>(
    initialTab ?? 'all',
  );
  const [token] = useState(() => {
    return storage.getString('token');
  });
  const navigation = useNavigation<any>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Ro'yxat (faqat list rejimda ishlatiladi) va dashboard (select rejim summalari).
  const {data, loading} = useFetch({method: 'GET', url: URL + url});
  const isDebitorRole = person === 'debitor';
  const dash = useFetch({method: 'GET', url: URL + '/qarz-daftari/dashboard'});
  const dashData: any = (dash.data as any)?.data || dash.data || {};
  const srcRoot: any = isDebitorRole
    ? dashData?.berilgan_qarz
    : dashData?.olingan_qarz;
  const num = (v: any) => Number(v || 0);
  const shUZS = num(srcRoot?.shartnoma?.uzs);
  const shUSD = num(srcRoot?.shartnoma?.usd);
  const dfUZS = num(srcRoot?.daftari?.uzs);
  const dfUSD = num(srcRoot?.daftari?.usd);
  const totUZS = shUZS + dfUZS;
  const totUSD = shUSD + dfUSD;

  // Rejimga mos yuklanish holati (select — dashboard, list — ro'yxat).
  if (isSelect ? dash.loading : loading) {
    return <Loading />;
  }

  // ══════════ SELECT REJIMI: 2 vertikal manba kartasi (ro'yxatsiz) ══════════
  if (isSelect) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        <RdHeader title={title} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.selectContent}>
          <View style={styles.totalCard}>
            <Text allowFontScaling={false} style={styles.totalLabel}>
              {isDebitorRole ? t('Jami berilgan qarz') : t('Jami olingan qarz')}
            </Text>
            {/* so'm 1-qatorda, $ PASTKI qatorda (nuqtasiz — so'rov bo'yicha). */}
            <Text allowFontScaling={false} numberOfLines={1} style={styles.totalValue}>
              {compactUzs(totUZS)}
            </Text>
            {totUSD > 0 ? (
              <Text allowFontScaling={false} numberOfLines={1} style={styles.totalValueUsd}>
                {compactUsd(totUSD)}
              </Text>
            ) : null}
          </View>

          <Text allowFontScaling={false} style={styles.selectSub}>
            {t('Manbalar bo‘yicha')}
          </Text>

          {/* Qarz shartnomasi — TEPADA. Bosilsa -> shartnoma qarzlari ro'yxati. */}
          <SourceCardWide
            Icon={ContractIcon}
            label={t('Qarz shartnomasi')}
            uzs={shUZS}
            usd={shUSD}
            onPress={() =>
              navigation.push('SearchDebitor', {
                ...route.params,
                view: 'list',
              })
            }
          />

          {/* Qarz daftari — PASTDA. Bosilsa -> Qarz daftari bo'limi. */}
          <SourceCardWide
            Icon={LedgerIcon}
            label={t('Qarz daftari')}
            uzs={dfUZS}
            usd={dfUSD}
            ledger
            onPress={() =>
              navigation.navigate('BottomTabNavigator', {
                screen: 'QarzDaftari',
              })
            }
          />
        </ScrollView>
      </View>
    );
  }

  // ══════════ LIST REJIMI: izlash + tablar + ro'yxat + Excel ══════════
  const searchUser = (text: string) => {
    if (!token) {
      navigation.navigate('LoginWithPhone');
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      axios
        .get(URL + searchUrl + text, {
          headers: {Authorization: `Bearer ${token}`},
          signal: controller.signal,
        })
        .then(res => {
          if (res.data.data.length === 0) {
            setIsCheck(true);
          } else {
            setIsCheck(false);
          }
          setSearchData(res.data?.data);
        })
        .catch(err => {
          if (axios.isCancel(err)) return;
          console.log(err, 'error search');
        });
    }, 400);
  };

  // FAQAT JARAYONDAGI shartnomalar (status 2=Tugallangan, 4=Rad etildi yashiriladi).
  const isDoneContract = (it: any) => {
    const s = it?.status;
    return s === 2 || s === 4 || s === '2' || s === '4';
  };
  const rawListAll: any[] =
    (searchData.length === 0 && !isCheck ? data?.data : searchData) || [];
  const rawList: any[] = rawListAll.filter((it: any) => !isDoneContract(it));
  const counts = {all: rawList.length, active: 0, near: 0, overdue: 0};
  rawList.forEach((it: any) => {
    counts[getDueMeta(it?.end_date).cat] += 1;
  });
  const shown = rawList
    .filter(
      (it: any) =>
        activeTab === 'all' || getDueMeta(it?.end_date).cat === activeTab,
    )
    .slice()
    .sort(
      (a: any, b: any) =>
        getDueMeta(a?.end_date).diff - getDueMeta(b?.end_date).diff,
    );
  // "Jarayonda" tab OLIB TASHLANDI (so'rov bo'yicha): "Barchasi" allaqachon FAQAT
  // jarayondagi qarzlarni ko'rsatadi (tugallangan/rad status filtri bilan chiqarilgan;
  // ular hisobot bo'limiga o'tadi). Qolgan tablar — muddat bo'yicha filtr.
  const TABS: {key: typeof activeTab; label: string}[] = [
    {key: 'all', label: 'Barchasi'},
    {key: 'near', label: 'Muddati oz qolgan'},
    {key: 'overdue', label: 'Muddati o‘tgan'},
  ];

  // ── Excel (CSV) eksport — hozir ko'rinayotgan ro'yxatni faylga saqlaydi.
  //    Server excel endpoint'i yo'q, shu bois CSV klientda yaratiladi (Excel
  //    CSV'ni to'g'ridan-to'g'ri ochadi). UTF-8 BOM — kirill/o'zbek harflari uchun.
  const statusTx = (s: any) =>
    s === 3 || s === '3'
      ? 'Jarayonda'
      : s === 2 || s === '2'
      ? 'Tugallangan'
      : s === 4 || s === '4'
      ? 'Rad etildi'
      : '';
  const onExcel = async () => {
    try {
      if (!shown.length) {
        Toast.show({
          type: 'omad',
          position: 'bottom',
          props: {title: t('Ro‘yxat bo‘sh'), desc: t('Yuklab olish uchun ma’lumot yo‘q')},
        });
        return;
      }
      const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = ['№', 'F.I.Sh', 'Shartnoma', 'Summa', 'Valyuta', 'Sana', 'Holat'];
      const lines = [header.map(esc).join(',')];
      shown.forEach((it: any, i: number) => {
        const fish = isDebitorRole ? it?.creditor_name : it?.debitor_name;
        lines.push(
          [
            i + 1,
            fish,
            it?.number,
            it?.amount,
            it?.currency,
            it?.contract_date || (it?.sana || '').slice(0, 10),
            statusTx(it?.status),
          ]
            .map(esc)
            .join(','),
        );
      });
      const csv = '﻿' + lines.join('\r\n');
      const fileName = `${isDebitorRole ? 'berilgan' : 'olingan'}_qarzlar_${Date.now()}.csv`;
      const cachePath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
      await RNBlobUtil.fs.writeFile(cachePath, csv, 'utf8');

      if (Platform.OS === 'android') {
        await RNBlobUtil.MediaCollection.copyToMediaStore(
          {name: fileName, parentFolder: 'Zerox', mimeType: 'text/csv'},
          'Download',
          cachePath,
        );
      }
      Toast.show({
        type: 'omad',
        position: 'bottom',
        visibilityTime: 2500,
        props: {
          title: t('Excel yuklab olindi'),
          desc:
            Platform.OS === 'android'
              ? t('Download/Zerox papkasiga saqlandi')
              : fileName,
        },
      });
      // Excel/Sheets ilovasida ochishga urinamiz (bo'lmasa — jimgina o'tkazamiz).
      FileViewer.open(cachePath, {showOpenWithDialog: true}).catch(() => {});
    } catch (e) {
      console.log('excel export error', e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={title} />

      {/* Izlash (FISH/telefon/summa/mahsulot — server tomonda) + Excel yuklash. */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
          <SearchIcon
            size={rs(18)}
            color={focused ? rd.color.primary : rd.color.textTertiary}
          />
          <TextInput
            placeholder={t('216')}
            placeholderTextColor={rd.color.textTertiary}
            style={styles.searchInput}
            onChangeText={searchUser}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            allowFontScaling={false}
          />
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onExcel}
          style={styles.excelBtn}>
          <ArrowDown size={rs(16)} color={rd.color.onPrimary} />
          <Text allowFontScaling={false} style={styles.excelText}>
            {t('Excelga yuklash')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && styles.tabActive]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.tabText, active && styles.tabTextActive]}>
                  {t(tab.label)}
                </Text>
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                    {counts[tab.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listCard}>
        <StatisticCard
          title={title}
          type={type}
          color={color}
          isHave={isHave}
          data={shown}
          person={person}
          iconType={iconType}
        />
      </View>
    </View>
  );
};

export default SearchDebitor;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },

  // ── Select rejim (2 vertikal manba kartasi)
  selectContent: {
    paddingHorizontal: rs(16),
    paddingTop: rs(6),
    paddingBottom: rs(24),
  },
  totalCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  totalLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
  },
  totalValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(20),
    color: rd.color.text,
    marginTop: rs(3),
  },
  totalValueUsd: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    marginTop: rs(2),
  },
  selectSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    marginTop: rs(16),
    marginBottom: rs(10),
  },
  wideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginBottom: rs(12),
  },
  wideIcon: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(14),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(14),
  },
  wideLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
  },
  wideUzs: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    marginTop: rs(4),
  },
  wideUsd: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(1),
  },

  // ── List rejim (izlash + Excel + tablar + ro'yxat)
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingHorizontal: rs(16),
    paddingTop: rs(4),
    paddingBottom: rs(12),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.pill,
    height: rs(50),
    paddingHorizontal: rs(16),
  },
  searchBoxFocused: {
    borderColor: rd.color.primary,
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    height: rs(50),
    paddingHorizontal: rs(14),
    borderRadius: rd.radius.pill,
    backgroundColor: EXCEL_GREEN,
  },
  excelText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.onPrimary,
  },
  tabsWrap: {
    paddingBottom: rs(12),
  },
  tabsRow: {
    paddingHorizontal: rs(16),
    gap: rs(8),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(14),
    height: rs(36),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  tabActive: {
    backgroundColor: rd.color.primary,
    borderColor: rd.color.primary,
  },
  tabText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
  tabTextActive: {
    color: rd.color.onPrimary,
    fontFamily: rd.font.semibold,
  },
  tabBadge: {
    minWidth: rs(20),
    height: rs(20),
    paddingHorizontal: rs(6),
    borderRadius: rs(10),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: rd.color.onPrimaryChip,
  },
  tabBadgeText: {
    fontFamily: rd.font.bold,
    fontSize: rs(11),
    color: rd.color.textSecondary,
  },
  tabBadgeTextActive: {
    color: rd.color.onPrimary,
  },
  searchInput: {
    flex: 1,
    marginLeft: rs(10),
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
    padding: 0,
  },
  listCard: {
    flex: 1,
    marginHorizontal: rs(16),
    marginBottom: rs(16),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    overflow: 'hidden',
  },
});
