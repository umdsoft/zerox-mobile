import {
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
import {storage} from '../../../store/api/token/getToken';
import {t} from 'i18next';
import {rd, rs} from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import {
  SearchIcon,
  ContractIcon,
  LedgerIcon,
  ChevronRight,
  CloseIcon,
} from '../redesign/icons';
import {compactUsd, compactUzs} from '../../../helper/money';

// Qarz daftari uslubidagi ikkilamchi (binafsha) urg'u — manba kartalarini
// bir-biridan ajratib ko'rsatish uchun (shartnoma = ko'k, daftar = binafsha).
const LEDGER_ACCENT = '#6d5ae6';
const LEDGER_TINT = '#efe9fd';

// Bitta manba mini-kartasi (Qarz shartnomasi / Qarz daftari) — summa + bo'limga
// o'tish havolasi. Saytdagi "manbalar bo'yicha" taqsimotining mobil ko'rinishi.
const SourceMini = ({Icon, label, uzs, usd, onPress, ledger}: any) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.mini}>
    <View
      style={[styles.miniIcon, ledger && {backgroundColor: LEDGER_TINT}]}>
      <Icon size={rs(18)} color={ledger ? LEDGER_ACCENT : rd.color.primary} />
    </View>
    <Text allowFontScaling={false} numberOfLines={1} style={styles.miniLabel}>
      {label}
    </Text>
    <Text allowFontScaling={false} numberOfLines={1} style={styles.miniUzs}>
      {compactUzs(uzs)}
    </Text>
    {usd > 0 ? (
      <Text allowFontScaling={false} numberOfLines={1} style={styles.miniUsd}>
        {compactUsd(usd)}
      </Text>
    ) : null}
    <View style={styles.miniLink}>
      <Text
        allowFontScaling={false}
        style={[styles.miniLinkTx, ledger && {color: LEDGER_ACCENT}]}>
        Bo‘limga o‘tish
      </Text>
      <ChevronRight size={rs(13)} color={ledger ? LEDGER_ACCENT : rd.color.primary} />
    </View>
  </TouchableOpacity>
);

const SearchDebitor = () => {
  // useRoute<any>() — bu ekran paramlari tiplanmagan (navigator ParamList'i yo'q).
  // Generic'siz `route.params` = `object | undefined` bo'lib, har bir maydon
  // destrukturizatsiyasi TS xatosi berardi. <any> bilan hammasi tozalanadi.
  const route = useRoute<any>();
  const {title, color, type, url, person, isHave, searchUrl, iconType, initialTab} =
    route.params;
  const [searchData, setSearchData] = useState([]);
  const [isCheck, setIsCheck] = useState(false);
  const [focused, setFocused] = useState(false);
  // Manba (shartnoma/daftar) taqsimot kartasini yopish holati (X tugmasi).
  const [showSources, setShowSources] = useState(true);
  // Boshlang'ich filtr tab'i chaqiruvchidan keladi: masalan "Muddati o'tgan"
  // kartasi bosilsa darhol 'overdue', "Muddati oz qolgan" bosilsa 'near' ochiladi.
  // Berilmasa — eski xatti-harakat saqlanadi ('all').
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'near' | 'overdue'>(
    initialTab ?? 'all',
  );
  const [token] = useState(() => {
    return storage.getString('token');
  });
  const navigation = useNavigation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const {data, loading} = useFetch({
    method: 'GET',
    url: URL + url,
  });

  // Manbalar bo'yicha taqsimot (Qarz shartnomasi + Qarz daftari) — web dashboard
  // bilan bir xil manba: /qarz-daftari/dashboard HAM shartnoma, HAM daftar
  // summalarini qaytaradi. person='debitor' -> berilgan_qarz, 'creditor' -> olingan.
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
  const hasSources = !!srcRoot && (totUZS > 0 || totUSD > 0);

  if (loading) {
    return <Loading />;
  }

  const searchUser = (text: string) => {
    if (!token) {
      navigation.navigate('LoginWithPhone');
      return;
    }
    // C-008: TO'G'RI debounce — oldingi timer'ni tozalaymiz (har harfda yangi so'rov
    // o'rniga) + in-flight so'rovni AbortController bilan bekor qilamiz (race yo'q).
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
          if (axios.isCancel(err)) return; // bekor qilingan — xato emas
          console.log(err, 'error search');
        });
    }, 400);
  };

  // FAQAT JARAYONDAGI shartnomalar. Backend `status` maydoni (emulyator
  // diagnostikasi bilan ANIQLANDI):
  //   status 2 = Tugallangan (debitor 4=chart 4, kreditor 11=chart 11 — aniq)
  //   status 3 = Jarayonda   (debitor 1=chart Jarayonda 1)
  //   status 4 = Rad etildi
  // Demak Tugallangan(2) va Rad etildi(4) YASHIRILADI (faqat hisobotда),
  // Jarayonda(3) esa QOLADI — shu bilan near/overdue tablar ham to'g'ri to'ladi.
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
  const TABS: {key: typeof activeTab; label: string}[] = [
    {key: 'all', label: 'Barchasi'},
    {key: 'active', label: 'Jarayonda'},
    {key: 'near', label: 'Muddati oz qolgan'},
    {key: 'overdue', label: 'Muddati o‘tgan'},
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={title} />

      {showSources && hasSources ? (
        <View style={styles.sourceCard}>
          <View style={styles.sourceHead}>
            <View style={{flex: 1}}>
              <Text allowFontScaling={false} style={styles.sourceTitle}>
                {isDebitorRole ? 'Jami berilgan qarz' : 'Jami olingan qarz'}
              </Text>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.sourceTotal}>
                {compactUzs(totUZS)}
                {totUSD > 0 ? ` · ${compactUsd(totUSD)}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSources(false)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={styles.sourceClose}>
              <CloseIcon size={rs(18)} color={rd.color.textTertiary} />
            </TouchableOpacity>
          </View>
          <Text allowFontScaling={false} style={styles.sourceSub}>
            Manbalar bo‘yicha
          </Text>
          <View style={styles.sourceRow}>
            <SourceMini
              Icon={ContractIcon}
              label="Qarz shartnomasi"
              uzs={shUZS}
              usd={shUSD}
              onPress={() =>
                navigation.navigate('BottomTabNavigator', {
                  screen: 'QarzShartnomasi',
                })
              }
            />
            <SourceMini
              Icon={LedgerIcon}
              label="Qarz daftari"
              uzs={dfUZS}
              usd={dfUSD}
              ledger
              onPress={() =>
                navigation.navigate('BottomTabNavigator', {
                  screen: 'QarzDaftari',
                })
              }
            />
          </View>
        </View>
      ) : null}

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
                  {tab.label}
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
  // ── Manbalar bo'yicha taqsimot kartasi (SS2 — saytdagidek).
  sourceCard: {
    marginHorizontal: rs(16),
    marginTop: rs(6),
    marginBottom: rs(4),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  sourceHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sourceTitle: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
  },
  sourceTotal: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    marginTop: rs(2),
  },
  sourceClose: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
  },
  sourceSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(10),
    marginBottom: rs(8),
  },
  sourceRow: {
    flexDirection: 'row',
    gap: rs(10),
  },
  mini: {
    flex: 1,
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
  },
  miniIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(9),
  },
  miniLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.text,
  },
  miniUzs: {
    fontFamily: rd.font.bold,
    fontSize: rs(13.5),
    color: rd.color.text,
    marginTop: rs(5),
  },
  miniUsd: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    marginTop: rs(1),
  },
  miniLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(2),
    marginTop: rs(9),
  },
  miniLinkTx: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.primary,
  },
  searchWrap: {
    paddingHorizontal: rs(16),
    paddingTop: rs(4),
    paddingBottom: rs(12),
  },
  searchBox: {
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
