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
  ArrowUpRight,
  ArrowDownLeft,
  CoinIcon,
} from '../redesign/icons';
// SS2-2 (2026-09-14): valyuta birligi "so'm"/"$" EMAS, "UZS"/"USD" — raqamning
// ixcham ko'rinishi (mln/mlrd) saqlanadi, faqat birlik matni almashadi.
import {groupDigits} from '../../../helper/money';
// Shartnoma va daftari nisbati diagrammasi (Qarz daftari sahifasidan ko'chirildi) —
// Berilgan/Olingan qarz "manba tanlash" sahifasida ko'rsatiladi.
import {DashboardChartCard} from '../modules/QarzDaftari';

// Qarz daftari uslubidagi ikkilamchi (binafsha) urg'u.
const LEDGER_ACCENT = '#6d5ae6';
const LEDGER_TINT = '#efe9fd';
const EXCEL_GREEN = '#1d7a45';
// SS2: shaxsiy qarz manbasi — QarzDaftari'dagi RatioBar binafsha segmenti bilan
// bir xil rang (bir xil ma'no -> bir xil rang).
const PERSONAL_ACCENT = '#6d5ae6';
const PERSONAL_TINT = '#efe9fd';

// Manba tanlash kartasi — TO'LIQ KENGLIK (vertikal joylashadi: shartnoma tepada,
// daftar pastda). Bosilganda tegishli ro'yxat/bo'lim ochiladi.
const SourceCardWide = ({Icon, label, uzs, usd, onPress, tint, accent}: any) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wideCard}>
    <View style={[styles.wideIcon, !!tint && {backgroundColor: tint}]}>
      <Icon size={rs(22)} color={accent || rd.color.primary} />
    </View>
    <View style={{flex: 1}}>
      <Text allowFontScaling={false} style={styles.wideLabel}>
        {label}
      </Text>
      {/* SS12-3 (2026-09-15): summalar TO'LIQ yoziladi — "96,1 mln" emas,
          "96 100 000". Qisqartma aniq raqamni yashirardi.
          SS12-1: qarz bo'lmasa ham "0 UZS"/"0 USD" DOIM qayd etiladi
          (ilgari USD qatori umuman chiqmasdi va karta "to'liqmas" ko'rinardi). */}
      <Text allowFontScaling={false} numberOfLines={1} style={styles.wideUzs} adjustsFontSizeToFit>
        {groupDigits(uzs)} UZS
      </Text>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.wideUsd} adjustsFontSizeToFit>
        {groupDigits(usd)} USD
      </Text>
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
    report, // true -> HISOBOT rejimi (tugallangan+rad ham ko'rinadi, status tablar)
    lockTab, // 'near'|'overdue' -> FAQAT o'sha kategoriya, tablar YASHIRILADI
  } = route.params;
  const isSelect = view === 'select';
  const isReport = report === true;
  // Muddati o'tgan/oz qolgan MAXSUS sahifalari — bitta kategoriyaga qulflangan.
  const effTab = lockTab ?? undefined;

  const [searchData, setSearchData] = useState([]);
  const [isCheck, setIsCheck] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'all' | 'active' | 'near' | 'overdue' | 'completed' | 'rejected'
  >(lockTab ?? initialTab ?? 'all');
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
  // SS2-1: uchinchi manba — SHAXSIY QARZ (personal_debts). Backend
  // `/qarz-daftari/dashboard` javobiga `shaxsiy: {uzs, usd}` qo'shildi.
  const pjUZS = num(srcRoot?.shaxsiy?.uzs);
  const pjUSD = num(srcRoot?.shaxsiy?.usd);
  const totUZS = shUZS + dfUZS + pjUZS;
  const totUSD = shUSD + dfUSD + pjUSD;
  const usdRate = num(dashData?.usd_rate);

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
          {/* Berilgan/Olingan qarz + shartnoma va daftar NISBATI diagrammasi.
              (Ilgari Qarz daftari bosh sahifasida edi — so'rov bo'yicha shu
              "manba tanlash" sahifasiga ko'chirildi; umumiy summa, MB kursi va
              nisbat bar shu bitta kartada.) */}
          <DashboardChartCard
            accent={isDebitorRole ? rd.color.primary : '#16a34a'}
            Icon={isDebitorRole ? ArrowUpRight : ArrowDownLeft}
            title={isDebitorRole ? t('Jami berilgan qarz') : t('Jami olingan qarz')}
            usdRate={usdRate}
            shartnomaUzs={shUZS}
            shartnomaUsd={shUSD}
            daftariUzs={dfUZS}
            daftariUsd={dfUSD}
            shaxsiyUzs={pjUZS}
            shaxsiyUsd={pjUSD}
          />

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

          {/* Qarz daftari — O'RTADA. Bosilsa -> Qarz daftari bo'limi. */}
          <SourceCardWide
            Icon={LedgerIcon}
            label={t('Qarz daftari')}
            uzs={dfUZS}
            usd={dfUSD}
            tint={LEDGER_TINT}
            accent={LEDGER_ACCENT}
            onPress={() =>
              navigation.navigate('BottomTabNavigator', {
                screen: 'QarzDaftari',
              })
            }
          />

          {/* SS2-1: SHAXSIY QARZ — uchinchi manba. Bosilsa -> "Shaxsiy qarz"
              pastki bo'limi (BottomTabNavigator ichidagi tab). */}
          <SourceCardWide
            Icon={CoinIcon}
            label={t('Shaxsiy qarz')}
            uzs={pjUZS}
            usd={pjUSD}
            tint={PERSONAL_TINT}
            accent={PERSONAL_ACCENT}
            onPress={() =>
              navigation.navigate('BottomTabNavigator', {
                screen: 'ShaxsiyQarz',
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

  // Asosiy ro'yxat backend `status=1` (FAOL/jarayondagi qarzlar) bilan keladi —
  // saytdagidek faqat faol shartnomalar (itemStatus=2). Tugallangan va rad etilgan
  // shartnomalar `status=2` (passiv) orqali HISOBOTGA tegishli, bu ro'yxatda emas.
  // QIDIRUV endpointi (`/contract/report/search`) esa BARCHA statusni qaytaradi —
  // shu bois qidiruv natijasini faol (status 2) ga klientда filtrlaymiz; asosiy
  // ro'yxat allaqachon faol bo'lgani uchun unga tegilmaydi (hech narsa yo'qolmaydi).
  const isActive = (it: any) => {
    const s = it?.status;
    return s === 2 || s === '2';
  };
  const usingSearch = searchData.length > 0 || isCheck;
  const rawListSrc: any[] = (usingSearch ? searchData : data?.data) || [];
  // SS2 (so'rov bo'yicha): OLINGAN/BERILGAN faol ro'yxatida faqat JARAYONDAGI (faol)
  // qarz shartnomalari bo'lsin. Tugallangan va RAD ETILGAN shartnomalar bu yerda
  // KO'RINMASIN (ular hisobot/arxivga tegishli). Ikki mezon:
  //   1) TUGALLANGAN = qoldiq (residual) 0 -> chiqarib tashlanadi (residual > 0 qoladi);
  //   2) RAD/PASSIV = backend `reports` guruhi bo'yicha c.status 3 yoki 4 -> chiqariladi.
  // Asosiy ro'yxat `/contract/return` (c.status=1) allaqachon faqat faolni beradi va
  // `status` maydonisiz keladi -> bu filtrlar unда NO-OP (hech narsa yo'qolmaydi); ular
  // faqat status-li endpoint (qidiruv `/contract/report/search`) natijasini himoyalaydi.
  const isRejected = (it: any) => {
    const s = it?.status;
    return s === 3 || s === '3' || s === 4 || s === '4';
  };
  // HISOBOT rejimida (isReport) tugallangan (status 2) va rad etilgan (3/4)
  // shartnomalar HAM ko'rinishi kerak (backend `status=all` ularni qaytaradi) —
  // shu bois faol-ro'yxat filtri (residual>0, !rad) qo'llanMAYDI. Aks holda
  // (faol ro'yxat) — eski filtr saqlanadi.
  const isCompleted = (it: any) => {
    const s = it?.status;
    return s === 2 || s === '2';
  };
  const rawListAll: any[] = isReport
    ? rawListSrc
    : rawListSrc.filter(
        (it: any) =>
          (it?.residual_amount == null || Number(it.residual_amount) > 0) &&
          !isRejected(it),
      );
  const rawList: any[] =
    usingSearch && !isReport ? rawListAll.filter(isActive) : rawListAll;

  const counts: Record<string, number> = isReport
    ? {all: rawList.length, completed: 0, rejected: 0}
    : {all: rawList.length, active: 0, near: 0, overdue: 0};
  rawList.forEach((it: any) => {
    if (isReport) {
      if (isCompleted(it)) counts.completed += 1;
      else if (isRejected(it)) counts.rejected += 1;
    } else {
      counts[getDueMeta(it?.end_date).cat] += 1;
    }
  });

  const shown = rawList
    .filter((it: any) => {
      // MAXSUS sahifa (Muddati o'tgan/oz qolgan) — FAQAT o'sha kategoriya.
      if (effTab) return getDueMeta(it?.end_date).cat === effTab;
      if (activeTab === 'all') return true;
      if (isReport) {
        if (activeTab === 'completed') return isCompleted(it);
        if (activeTab === 'rejected') return isRejected(it);
        return true;
      }
      return getDueMeta(it?.end_date).cat === activeTab;
    })
    .slice()
    .sort(
      (a: any, b: any) =>
        getDueMeta(a?.end_date).diff - getDueMeta(b?.end_date).diff,
    );

  // Faol ro'yxat — muddat bo'yicha tablar; HISOBOT — status bo'yicha tablar
  // (saytdagi "Umumiy/Tugallangan/Rad etilgan" kabi).
  const TABS: {key: any; label: string}[] = isReport
    ? [
        {key: 'all', label: 'Barchasi'},
        {key: 'completed', label: 'Tugallangan'},
        {key: 'rejected', label: 'Rad etilgan'},
      ]
    : [
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
      ? 'Tasdiqlangan'
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

      {/* MAXSUS sahifa (Muddati o'tgan/oz qolgan) — tablar YASHIRILADI. */}
      {!lockTab && (
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
      )}

      <View style={styles.listCard}>
        <StatisticCard
          title={title}
          type={type}
          color={color}
          isHave={isHave}
          data={shown}
          person={person}
          iconType={iconType}
          report={isReport}
          emptyText={
            effTab === 'overdue'
              ? t('Hozircha sizda muddati o‘tgan qarzdorliklar mavjud emas.')
              : effTab === 'near'
              ? t('Hozircha sizda muddati oz qolgan qarzdorliklar mavjud emas.')
              : undefined
          }
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
  // SS12-2: yorliq ("Qarz shartnomasi") shrifti SUMMA shrifti bilan bir xil
  // o'lchamda — ilgari yorliq kichik bo'lib, karta nomi yo'qolib ketardi.
  wideLabel: {
    fontFamily: rd.font.semibold,
    // SS12-2: yorliq shrifti SUMMA bilan bir xil (rs16) — ilgari rs(14.5) edi.
    fontSize: rs(16),
    color: rd.color.text,
  },
  wideUzs: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    marginTop: rs(4),
  },
  // SS2-3: dollar summasi so'mdagi raqam bilan BIR XIL o'lchamda (rs(16)) —
  // ilgari rs(12.5) edi va o'qib bo'lmasdi. Ammo JIRNIY EMAS (medium) — jami
  // summa (bold UZS) bilan urg'u ierarxiyasi saqlanadi.
  wideUsd: {
    fontFamily: rd.font.medium,
    fontSize: rs(16),
    color: rd.color.textSecondary,
    marginTop: rs(2),
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
