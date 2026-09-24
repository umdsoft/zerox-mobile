/**
 * FinanceDebtGroup.tsx — BITTA kontragent bo'yicha shaxsiy qarzlar.
 *
 * SS4/SS5 (2026-09-18) — ekran qayta qurildi. Ilgari bu shunchaki qarzlar
 * ro'yxati edi; foydalanuvchi esa kontragent KARTOCHKASINI kutardi:
 *
 *   1) TEPADA  — kim (yoki qaysi do'kon): ism, telefon, manzil;
 *                yonida SMS va qo'ng'iroq tugmalari, tahrirlash (faqat
 *                jismoniy shaxsda — do'kon ma'lumotini do'kon egasi yuritadi).
 *   2) O'RTADA — BALANS: berilgan / olingan va sof qoldiq (valyuta bo'yicha).
 *   3) PASTDA  — har bir rasmiylashtirilgan qarz alohida karta: sana, muddat,
 *                izoh, to'langanlik ulushi. Bosilsa — to'liq tafsilot.
 *
 * ⚠️ Qo'shimcha API so'rovi YO'Q: qarzlar chaqiruvchi ekranda allaqachon
 * yuklangan va `route.params.items` orqali uzatiladi.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import {
  CheckCircleIcon,
  InfoIcon,
  MessageIcon,
  PencilIcon,
  PhoneCallIcon,
  PhoneIcon,
  StorefrontIcon,
  UserIcon,
  WarningIcon,
} from '../redesign/icons';
import { financeApi } from './financeApi';
import { fDate, fMoney, num } from './financeMoney';

const RED = '#dc2626';
const GREEN = '#16a34a';
const BLUE = '#2f6fed';

const isDone = (d: any) => d?.status === 'completed' || num(d?.remaining_amount) <= 0;

const isOverdue = (d: any): boolean => {
  if (!d?.due_date || isDone(d)) return false;
  const t = new Date(String(d.due_date).slice(0, 10)).getTime();
  return !isNaN(t) && t < Date.now();
};

type Reliability = { level: 'none' | 'reliable' | 'medium' | 'risky'; total: number; on_time: number; late: number };

/**
 * SS-DEV (2026-09-24): TAVSIYA — kontragentning oldingi qarzlarini o'z vaqtida
 * qaytarganiga qarab ishonchlilik. Backend `computeReliability`
 * (PersonalDebtController) bilan AYNAN bir xil qoida — `GET /finance/debts/:id`
 * javobidagi `reliability` bo'lsa u ustun, bo'lmasa ro'yxatdan shu yerda
 * hisoblanadi (ro'yxat `payments` bilan keladi):
 *   - yopilgan qarz: oxirgi HAQIQIY to'lov (marker yozuvlarsiz) muddatdan
 *     kechikmagan → o'z vaqtida, aks holda kech; muddatsiz yopilgan → ijobiy;
 *   - muddati o'tgan FAOL qarz → kech (salbiy signal).
 *   ratio ≥ 0.8 → ishonchli, ≥ 0.5 → o'rtacha, aks holda ehtiyot bo'ling.
 */
const computeReliability = (debts: any[]): Reliability => {
  let onTime = 0;
  let late = 0;
  const DAY = 86400000;
  for (const d of debts) {
    if (d?.is_shop_debt) continue; // do'kon qaydlari — boshqa daftar, hisobga olinmaydi
    if (d?.status === 'completed') {
      const pays = (d.payments || []).filter(
        (p: any) => !/^__(increase|forgive)__/.test(String(p?.notes || '')),
      );
      let lastPay = 0;
      for (const p of pays) {
        const t = new Date(String(p.payment_date || p.created_at || '').replace(' ', 'T')).getTime();
        if (!isNaN(t) && t > lastPay) lastPay = t;
      }
      if (d.due_date && lastPay) {
        if (lastPay <= new Date(String(d.due_date).slice(0, 10)).getTime() + DAY) onTime++;
        else late++;
      } else {
        onTime++;
      }
    } else if (d?.status === 'active' && d?.due_date && new Date(String(d.due_date).slice(0, 10)).getTime() < Date.now()) {
      late++;
    }
  }
  const total = onTime + late;
  let level: Reliability['level'] = 'none';
  if (total > 0) {
    const ratio = onTime / total;
    level = ratio >= 0.8 ? 'reliable' : ratio >= 0.5 ? 'medium' : 'risky';
  }
  return { level, total, on_time: onTime, late };
};

// Sayt (`lang/uz.js` finance.rel_*) bilan bir xil matnlar.
const REL_TEXT: Record<Reliability['level'], { title: string; desc: string; color: string; bg: string }> = {
  none: { title: 'Hozircha ma’lumot yo‘q', desc: 'Bu shaxs bilan avvalgi qarz tarixi mavjud emas.', color: '#6b7280', bg: '#f3f4f6' },
  reliable: { title: 'Ishonchli', desc: 'Oldingi qarzlarini asosan o‘z vaqtida qaytargan.', color: '#15803d', bg: '#f0fdf4' },
  medium: { title: 'O‘rtacha', desc: 'Qarzlarini ba’zan kechiktirib qaytargan.', color: '#b45309', bg: '#fffbeb' },
  risky: { title: 'Ehtiyot bo‘ling', desc: 'Qarzlarini ko‘pincha kechiktirib qaytargan.', color: '#b91c1c', bg: '#fef2f2' },
};

/** +998 dan keyingi 9 raqam -> "90 123 45 67". */
const fmtPhone = (raw?: string): string => {
  const d = String(raw || '').replace(/\D/g, '');
  const c = d.length > 9 ? d.slice(-9) : d;
  if (c.length !== 9) return String(raw || '');
  return `+998 ${c.slice(0, 2)} ${c.slice(2, 5)} ${c.slice(5, 7)} ${c.slice(7)}`;
};

const FinanceDebtGroup = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const { title, isShop, items } = route.params || {};

  // Ro'yxat tahrirlashdan keyin yangilanishi uchun holatda saqlanadi.
  const [list, setList] = React.useState<any[]>(Array.isArray(items) ? items : []);
  const [editOpen, setEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  // SS4: tayyor SMS shablonlari + amal uchun qarz tanlash oynasi.
  const [showSms, setShowSms] = React.useState(false);
  const [pickFor, setPickFor] = React.useState<'demand' | 'forgive' | null>(null);
  const [acting, setActing] = React.useState(false);

  const first = list[0] || {};
  const phone: string = first.phone || first.shop_phone || '';
  // SS5 (2026-09-19): manzil FAQAT birinchi yozuvdan olinardi — agar u
  // do'kon qarzi bo'lmasa manzil umuman chiqmasdi. Endi ro'yxatdagi
  // manzili bor BIRINCHI yozuv olinadi.
  const address: string = (() => {
    for (const d of list) {
      const a = [d.shop_region, d.shop_district].filter(Boolean).join(', ');
      if (a) return a;
    }
    return '';
  })();

  const [name, setName] = React.useState(String(title || ''));
  const [phoneEdit, setPhoneEdit] = React.useState(() => {
    const d = String(phone || '').replace(/\D/g, '');
    return d.length > 9 ? d.slice(-9) : d;
  });

  /** Aktivlar tepada, yopilganlar pastda; ichida yangisi oldin. */
  const sorted = React.useMemo(
    () =>
      list.slice().sort((a, b) => {
        const da = isDone(a) ? 1 : 0;
        const db = isDone(b) ? 1 : 0;
        if (da !== db) return da - db;
        return (
          new Date(b.created_at || b.start_date || 0).getTime() -
          new Date(a.created_at || a.start_date || 0).getTime()
        );
      }),
    [list],
  );

  /** Valyuta bo'yicha berilgan / olingan / sof qoldiq. */
  const balance = React.useMemo(() => {
    const m = new Map<string, { lent: number; borrowed: number }>();
    for (const d of list) {
      const cur = d.currency || 'UZS';
      const rec = m.get(cur) || { lent: 0, borrowed: 0 };
      const rem = num(d.remaining_amount);
      if (d.type === 'borrowed') rec.borrowed += rem;
      else rec.lent += rem;
      m.set(cur, rec);
    }
    return [...m.entries()];
  }, [list]);

  /**
   * SS4: kontragent ma'lumotini tahrirlash. Shaxsiy qarzda ism/telefon HAR BIR
   * yozuvda saqlanadi, shu bois o'zgarish guruhning O'Z qarzlariga (ko'zgu
   * bo'lmaganlariga) qo'llanadi — aks holda ro'yxat yana ikkiga bo'linib ketardi.
   */
  const ownItems = list.filter((d) => !d.is_mirror);
  const canEdit = !isShop && ownItems.length > 0;

  // SS-DEV (2026-09-24): TAVSIYA — serverdan (o'z qaydim bo'lsa `GET /finance/debts/:id`
  // javobidagi `reliability`), kelmasa ro'yxatdan mahalliy hisob.
  const [serverRel, setServerRel] = React.useState<Reliability | null>(null);
  const firstOwnId = ownItems.length ? ownItems[0].id : null;
  React.useEffect(() => {
    let alive = true;
    if (!firstOwnId || isShop) return;
    financeApi
      .getDebtById(firstOwnId)
      .then((r) => {
        const rel = r?.data?.reliability;
        if (alive && rel && typeof rel.level === 'string') setServerRel(rel);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [firstOwnId, isShop]);
  const reliability: Reliability = React.useMemo(
    () => serverRel || computeReliability(list),
    [serverRel, list],
  );

  const saveEdit = async () => {
    if (saving) return;
    const nm = name.trim();
    if (nm.length < 2) {
      Toast.show({ type: 'error2', props: { desc: t('Ismni kiriting') } });
      return;
    }
    if (phoneEdit && phoneEdit.length !== 9) {
      Toast.show({ type: 'error2', props: { desc: t('Telefon raqamini to‘liq kiriting') } });
      return;
    }
    setSaving(true);
    try {
      const body = { source_name: nm, phone: phoneEdit ? `+998${phoneEdit}` : null };
      await Promise.all(ownItems.map((d) => financeApi.updateDebt(d.id, body)));
      setList((prev) =>
        prev.map((d) => (d.is_mirror ? d : { ...d, source_name: nm, phone: body.phone })),
      );
      setEditOpen(false);
      Toast.show({ type: 'omad', props: { desc: t('Saqlandi') } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: t('Xatolik yuz berdi') } });
    } finally {
      setSaving(false);
    }
  };

  const call = () => phone && Linking.openURL(`tel:${String(phone).replace(/\s/g, '')}`);

  /** Asosiy valyuta (UZS ustun) va uning sof balansi. */
  const [primaryCur, primaryBal] = React.useMemo(() => {
    const uzs = balance.find(([c]) => c === 'UZS');
    return (uzs || balance[0] || ['UZS', { lent: 0, borrowed: 0 }]) as [
      string,
      { lent: number; borrowed: number },
    ];
  }, [balance]);
  const netAll = primaryBal.lent - primaryBal.borrowed;

  /** Men amal qila oladigan qarzlar: O'ZIMNIKI (ko'zgu emas) va aktiv. */
  const actionable = React.useMemo(
    () => list.filter((d) => !d.is_mirror && !isDone(d) && d.type === 'lent'),
    [list],
  );

  /** Eng yaqin qaytarish muddati (men qarzdor bo'lgan yozuvlar bo'yicha). */
  const nearestDue = React.useMemo(() => {
    const ds = list
      .filter((d) => d.type === 'borrowed' && !isDone(d) && d.due_date)
      .map((d) => new Date(String(d.due_date).slice(0, 10)).getTime())
      .filter((x) => !isNaN(x))
      .sort((a, b) => a - b);
    return ds.length ? fDate(new Date(ds[0]).toISOString().slice(0, 10)) : '';
  }, [list]);

  /**
   * SS4/SS5: SOF BALANSGA qarab tayyor SMS matnlari.
   * Men qarzdor bo'lsam — qaytarish/karta so'rash matnlari; menga qarzdor
   * bo'lsa — eslatma/talab matnlari. Har ikki holatda ham summa qo'shiladi,
   * shunda foydalanuvchi matnni qo'lda yozmaydi.
   */
  const smsTemplates = (): string[] => {
    const nm = String(name || title || '').trim();
    const sal = nm ? `Assalomu alaykum, ${nm}.` : 'Assalomu alaykum.';
    const amt = fMoney(Math.abs(netAll), primaryCur);
    const out: string[] = [];
    if (netAll < 0) {
      // MEN QARZDORMAN
      out.push(`${sal} ${amt} qarzimni qaytarmoqchiman. Plastik karta raqamingizni tashlab yuborasizmi?`);
      if (nearestDue) out.push(`${sal} ${amt} qarzimni ${nearestDue} gacha qaytaraman.`);
      out.push(`${sal} ${amt} qarzimni tez orada qaytaraman, sal muhlat berasizmi?`);
      out.push(`${sal} Qarzni bo‘lib-bo‘lib qaytarsam bo‘ladimi?`);
    } else if (netAll > 0) {
      // MENGA QARZDOR
      out.push(`${sal} ${amt} qarzni qachon qaytarasiz?`);
      out.push(`${sal} ${amt} qarz to‘lovini eslatib qo‘yaman.`);
      out.push(`${sal} Qarzni qaytarish uchun karta raqamimni yuboraman.`);
      out.push(`${sal} ${amt} qarzni bo‘lib-bo‘lib qaytarsangiz ham bo‘ladi. Kelishaylikmi?`);
    } else {
      out.push(`${sal} Qarz hisobi bo‘yicha gaplashsak bo‘ladimi?`);
    }
    return out;
  };

  const sendSms = (text?: string) => {
    setShowSms(false);
    if (!phone) return;
    const to = String(phone).replace(/\s/g, '');
    const url = text ? `sms:${to}?body=${encodeURIComponent(text)}` : `sms:${to}`;
    Linking.openURL(url).catch(() => {});
  };

  /** Tanlangan qarz bo'yicha talab/voz kechish. */
  const runAction = async (d: any) => {
    if (acting || !pickFor) return;
    setActing(true);
    try {
      if (pickFor === 'demand') {
        await financeApi.demandRepayment(d.id);
        Toast.show({ type: 'omad', props: { desc: t('Qaytarish bo‘yicha SMS yuborildi') } });
      } else {
        await financeApi.forgiveDebt(d.id);
        setList((prev) =>
          prev.map((x) =>
            x.id === d.id ? { ...x, status: 'completed', remaining_amount: 0 } : x,
          ),
        );
        Toast.show({ type: 'omad', props: { desc: t('Qarzdan voz kechildi') } });
      }
      setPickFor(null);
    } catch (e: any) {
      const code = e?.response?.data?.code;
      const msg =
        code === 'no-card'
          ? t('Talab qilish uchun avval plastik karta ma’lumotlaringizni kiriting.')
          : code === 'no-phone'
          ? t('Mijoz telefoni yo‘q')
          : t('Xatolik yuz berdi');
      Toast.show({ type: 'error2', visibilityTime: 4000, props: { desc: String(msg) } });
      if (code === 'no-card') {
        setPickFor(null);
        navigation.navigate('FinancePayoutCard');
      }
    } finally {
      setActing(false);
    }
  };

  /** Shu kontragent bilan yangi qarz rasmiylashtirish. */
  const addDebt = (initialType: 'lent' | 'borrowed') =>
    navigation.navigate('FinanceDebtAdd', {
      initialType,
      initialName: name || title || '',
      initialPhone: phone || '',
    });

  if (saving) return <Loading />;

  const Ico = isShop ? StorefrontIcon : UserIcon;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS4 (2026-09-19): ilgari bu yerda ham, pastdagi kartochkada ham
          AYNI ism turardi — bitta ekranda nom ikki marta yozilardi.
          Sarlavha umumiy qilindi, shaxs/do'kon nomi kartochkada qoladi. */}
      <RdHeader title={t('Qarz oldi-berdi')} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 1. KONTRAGENT kartochkasi */}
        <View style={styles.idCard}>
          <View style={styles.idTop}>
            <View style={[styles.avatar, { backgroundColor: BLUE + '14' }]}>
              <Ico size={rs(24)} color={BLUE} />
            </View>
            <Text allowFontScaling={false} style={styles.idName} numberOfLines={2}>
              {name || title}
            </Text>
            {canEdit && (
              <TouchableOpacity
                style={styles.idEdit}
                onPress={() => setEditOpen(true)}
                accessibilityLabel={t('Tahrirlash')}>
                <PencilIcon size={rs(17)} color={BLUE} />
              </TouchableOpacity>
            )}
          </View>

          {!!phone && (
            <View style={styles.idRow}>
              <PhoneIcon size={rs(15)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.idRowText} numberOfLines={1}>
                {fmtPhone(phone)}
              </Text>
              <TouchableOpacity
                style={[styles.roundBtn, { backgroundColor: BLUE }]}
                onPress={() => setShowSms(true)}
                accessibilityLabel={t('SMS yuborish')}>
                <MessageIcon size={rs(16)} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roundBtn, { backgroundColor: GREEN }]}
                onPress={call}
                accessibilityLabel={t('Qo‘ng‘iroq qilish')}>
                <PhoneCallIcon size={rs(16)} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {!!address && (
            <View style={styles.idRow}>
              <StorefrontIcon size={rs(15)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.idRowText} numberOfLines={2}>
                {address}
              </Text>
            </View>
          )}
        </View>

        {/* 2. BALANS */}
        <View style={styles.balCard}>
          <Text allowFontScaling={false} style={styles.balTitle}>{t('Balans')}</Text>
          {balance.map(([cur, v]) => {
            const net = v.lent - v.borrowed;
            return (
              <View key={cur} style={styles.balBlock}>
                <View style={styles.balRow}>
                  <Text allowFontScaling={false} style={styles.balLabel}>{t('Berilgan')}</Text>
                  <Text allowFontScaling={false} style={[styles.balVal, { color: GREEN }]}>
                    {v.lent > 0 ? '+' : ''}{fMoney(v.lent, cur)}
                  </Text>
                </View>
                <View style={styles.balRow}>
                  <Text allowFontScaling={false} style={styles.balLabel}>{t('Olingan')}</Text>
                  <Text allowFontScaling={false} style={[styles.balVal, { color: RED }]}>
                    {v.borrowed > 0 ? '−' : ''}{fMoney(v.borrowed, cur)}
                  </Text>
                </View>
                <View style={styles.balDivider} />
                <View style={styles.balRow}>
                  <Text allowFontScaling={false} style={styles.balNetLabel}>{t('Sof balans')}</Text>
                  <Text
                    allowFontScaling={false}
                    style={[styles.balNet, { color: net < 0 ? RED : GREEN }]}>
                    {net < 0 ? '−' : '+'}{fMoney(Math.abs(net), cur)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 2a. TAVSIYA (SS-DEV 2026-09-24) — saytdagi "Tavsiya" bloki:
            oldingi qarzlarini o'z vaqtida qaytarganiga qarab. Do'kon
            sahifasida ko'rsatilmaydi (do'kon qaydlari — boshqa daftar). */}
        {!isShop && (() => {
          const rt = REL_TEXT[reliability.level] || REL_TEXT.none;
          const RelIcon =
            reliability.level === 'reliable'
              ? CheckCircleIcon
              : reliability.level === 'none'
              ? InfoIcon
              : WarningIcon;
          return (
            <View style={styles.relCard}>
              <Text allowFontScaling={false} style={styles.relTitle}>{t('Tavsiya')}</Text>
              <View style={[styles.relBox, { backgroundColor: rt.bg }]}>
                <View style={[styles.relIcon, { backgroundColor: rt.color + '1A' }]}>
                  <RelIcon size={rs(18)} color={rt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text allowFontScaling={false} style={[styles.relLevel, { color: rt.color }]}>
                    {t(rt.title)}
                  </Text>
                  <Text allowFontScaling={false} style={styles.relDesc}>
                    {t(rt.desc)}
                    {reliability.total > 0
                      ? ` (${reliability.on_time}/${reliability.total} ${t('o‘z vaqtida')})`
                      : ''}
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}

        {/* 2b. AMALLAR — shu kontragent bilan (SS4). */}
        <View style={styles.actRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actBtn, { backgroundColor: GREEN }]}
            onPress={() => addDebt('lent')}>
            <Text allowFontScaling={false} style={styles.actBtnText}>{t('Qarz berish')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actBtn, { backgroundColor: BLUE }]}
            onPress={() => addDebt('borrowed')}>
            <Text allowFontScaling={false} style={styles.actBtnText}>{t('Qarz olish')}</Text>
          </TouchableOpacity>
        </View>

        {/* Sof balans MUSBAT bo'lsa — menga qarzdor: talab/voz kechish. */}
        {netAll > 0 && actionable.length > 0 && (
          <View style={styles.actRow}>
            {/* SS-DEV (2026-09-24): chegara chizig'i OLIB TASHLANDI — tugmalar
                "Qarz berish / Qarz olish" kabi TO'LDIRILGAN (amber / qizil). */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actBtnSoft, styles.actBtnAmber]}
              onPress={() => setPickFor('demand')}>
              <Text allowFontScaling={false} style={styles.actBtnSoftText}>
                {t('Qaytarishni talab qilish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actBtnSoft, { backgroundColor: RED }]}
              onPress={() => setPickFor('forgive')}>
              <Text allowFontScaling={false} style={styles.actBtnSoftText}>
                {t('Qarzdan voz kechish')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. QARZLAR */}
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          {`${t('Qarzlar')} (${sorted.length})`}
        </Text>

        {sorted.map((d, i) => {
          const borrowed = d.type === 'borrowed';
          const dirColor = borrowed ? RED : GREEN;
          const remaining = num(d.remaining_amount);
          const total = num(d.amount);
          const paidPct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
          const done = isDone(d);
          const overdue = isOverdue(d);
          return (
            <TouchableOpacity
              key={d.id ?? i}
              style={styles.debtCard}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate(
                  'FinanceDebtDetail',
                  d.is_mirror ? { mirror: d, hideParty: true } : { id: d.id, hideParty: true },
                )
              }>
              <View style={styles.debtTop}>
                <View style={[styles.dirChip, { backgroundColor: dirColor + '14' }]}>
                  <Text allowFontScaling={false} style={[styles.dirChipText, { color: dirColor }]}>
                    {borrowed ? t('Olingan') : t('Berilgan')}
                  </Text>
                </View>
                <Text
                  allowFontScaling={false}
                  style={[styles.debtAmt, { color: dirColor }]}
                  numberOfLines={1}>
                  {borrowed ? '−' : '+'}{fMoney(remaining, d.currency)}
                </Text>
              </View>

              {/* Sana / muddat */}
              <View style={styles.metaRow}>
                <Text allowFontScaling={false} style={styles.metaText}>
                  {d.start_date ? fDate(d.start_date) : '—'}
                </Text>
                <Text allowFontScaling={false} style={styles.metaDot}>·</Text>
                <Text
                  allowFontScaling={false}
                  style={[styles.metaText, overdue && { color: RED }]}>
                  {d.due_date ? `${fDate(d.due_date)}${t('gacha')}` : t('Muddatsiz')}
                </Text>
                {done && (
                  <View style={[styles.badge, { backgroundColor: GREEN + '18' }]}>
                    <Text allowFontScaling={false} style={[styles.badgeText, { color: GREEN }]}>
                      {t('Yopilgan')}
                    </Text>
                  </View>
                )}
              </View>

              {!!d.notes && (
                <Text allowFontScaling={false} style={styles.note} numberOfLines={2}>
                  {d.notes}
                </Text>
              )}

              {!done && (
                <>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { width: `${paidPct}%`, backgroundColor: dirColor }]}
                    />
                  </View>
                  <Text allowFontScaling={false} style={styles.paidPct}>
                    {t('{{p}}% to‘landi', { p: paidPct })}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: rs(20) }} />
      </ScrollView>

      {/* SS4/SS5: tayyor SMS shablonlari */}
      <Modal
        visible={showSms}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSms(false)}>
        <View style={styles.backdrop}>
          <View style={styles.editCard}>
            <Text allowFontScaling={false} style={styles.editTitle}>
              {t('Tayyor SMS shablonlari')}
            </Text>
            <ScrollView style={{ maxHeight: rs(330) }} showsVerticalScrollIndicator={false}>
              {smsTemplates().map((tpl, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.85}
                  style={styles.tplRow}
                  onPress={() => sendSms(tpl)}>
                  <Text allowFontScaling={false} style={styles.tplText}>{tpl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: rd.color.surfaceAlt }]}
                onPress={() => setShowSms(false)}>
                <Text allowFontScaling={false} style={[styles.editBtnText, { color: rd.color.textSecondary }]}>
                  {t('Bekor qilish')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: BLUE }]}
                onPress={() => sendSms()}>
                <Text allowFontScaling={false} style={[styles.editBtnText, { color: '#fff' }]}>
                  {t('Bo‘sh SMS yozish')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SS4: amal uchun QAYSI qarz ekanini tanlash (bittadan ko'p bo'lishi mumkin) */}
      <Modal
        visible={!!pickFor}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPickFor(null)}>
        <View style={styles.backdrop}>
          <View style={styles.editCard}>
            <Text allowFontScaling={false} style={styles.editTitle}>
              {pickFor === 'demand' ? t('Qaytarishni talab qilish') : t('Qarzdan voz kechish')}
            </Text>
            <Text allowFontScaling={false} style={styles.pickHint}>
              {t('Amal qaysi qarzga tegishli?')}
            </Text>
            <ScrollView style={{ maxHeight: rs(300) }} showsVerticalScrollIndicator={false}>
              {actionable.map((d, i) => (
                <TouchableOpacity
                  key={d.id ?? i}
                  activeOpacity={0.85}
                  disabled={acting}
                  style={styles.tplRow}
                  onPress={() => runAction(d)}>
                  <Text allowFontScaling={false} style={styles.pickAmt}>
                    {fMoney(num(d.remaining_amount), d.currency)}
                  </Text>
                  <Text allowFontScaling={false} style={styles.pickMeta}>
                    {d.start_date ? fDate(d.start_date) : '—'}
                    {d.notes ? ` · ${d.notes}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: rd.color.surfaceAlt, marginTop: rs(12) }]}
              onPress={() => setPickFor(null)}>
              <Text allowFontScaling={false} style={[styles.editBtnText, { color: rd.color.textSecondary }]}>
                {t('Bekor qilish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Kontragentni tahrirlash */}
      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setEditOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.editCard}>
            <Text allowFontScaling={false} style={styles.editTitle}>{t('Tahrirlash')}</Text>

            <Text allowFontScaling={false} style={styles.editLabel}>{t('Ism')}</Text>
            <TextInput
              allowFontScaling={false}
              value={name}
              onChangeText={setName}
              placeholder={t('Familiya Ism')}
              placeholderTextColor={rd.color.textTertiary}
              style={styles.editInput}
            />

            <Text allowFontScaling={false} style={styles.editLabel}>{t('Telefon raqami')}</Text>
            <View style={styles.phoneWrap}>
              <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
              <TextInput
                allowFontScaling={false}
                value={phoneEdit}
                onChangeText={(v) => setPhoneEdit(v.replace(/\D/g, '').slice(0, 9))}
                keyboardType="number-pad"
                placeholder="__ ___ __ __"
                placeholderTextColor={rd.color.textTertiary}
                style={styles.phoneInput}
              />
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: rd.color.surfaceAlt }]}
                onPress={() => setEditOpen(false)}>
                <Text allowFontScaling={false} style={[styles.editBtnText, { color: rd.color.textSecondary }]}>
                  {t('Bekor qilish')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: BLUE }]}
                onPress={saveEdit}>
                <Text allowFontScaling={false} style={[styles.editBtnText, { color: '#fff' }]}>
                  {t('Saqlash')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FinanceDebtGroup;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  body: { paddingHorizontal: rs(16), paddingTop: rs(6) },

  // 1. Kontragent
  idCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  idTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatar: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  idName: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  idEdit: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: BLUE + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(12),
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  idRowText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textSecondary },
  roundBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Balans
  balCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(14),
  },
  balTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    marginBottom: rs(8),
  },
  balBlock: { marginBottom: rs(6) },
  balRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(5),
  },
  balLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  balVal: { fontFamily: rd.font.semibold, fontSize: rs(13) },
  balDivider: { height: 1, backgroundColor: rd.color.border, marginVertical: rs(4) },
  balNetLabel: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text },
  balNet: { fontFamily: rd.font.bold, fontSize: rs(15) },

  // 3. Qarzlar
  sectionTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(13.5),
    color: rd.color.text,
    // SS4 (2026-09-19): tepada endi amal tugmalari turadi; 2 qatorli
    // tugma ("Qaytarishni talab qilish") o'sganda sarlavha unga
    // YOPISHIB qolardi — yuqoridan bo'sh joy qo'shildi.
    marginTop: rs(18),
    marginBottom: rs(8),
  },
  debtCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    marginBottom: rs(10),
  },
  debtTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(8),
  },
  dirChip: { borderRadius: rd.radius.pill, paddingHorizontal: rs(9), paddingVertical: rs(3) },
  dirChipText: { fontFamily: rd.font.bold, fontSize: rs(11) },
  debtAmt: { flexShrink: 1, fontFamily: rd.font.bold, fontSize: rs(14) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(8) },
  metaText: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary },
  metaDot: { color: rd.color.textTertiary, fontSize: rs(11.5) },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(10) },
  note: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    marginTop: rs(6),
  },
  barTrack: {
    height: rs(4),
    borderRadius: rs(2),
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(10),
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: rs(2) },
  paidPct: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(5) },

  // Tahrirlash oynasi
  // SS4 (2026-09-19)
  actRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(12) },
  actBtn: {
    flex: 1,
    height: rs(46),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: '#fff' },
  // SS-DEV (2026-09-24): to'ldirilgan uslub (actBtn bilan bir xil), chegara yo'q.
  actBtnSoft: {
    flex: 1,
    minHeight: rs(46),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(8),
    paddingVertical: rs(8),
  },
  actBtnAmber: { backgroundColor: '#f59e0b' },
  actBtnSoftText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), textAlign: 'center', color: '#fff' },
  // SS-DEV (2026-09-24): Tavsiya kartasi (saytdagi bilan bir xil tuzilma).
  relCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(2),
  },
  relTitle: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.textTertiary, marginBottom: rs(8) },
  relBox: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), borderRadius: rd.radius.md, padding: rs(10) },
  relIcon: { width: rs(34), height: rs(34), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  relLevel: { fontFamily: rd.font.bold, fontSize: rs(13.5) },
  relDesc: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, lineHeight: rs(17), marginTop: rs(2) },
  tplRow: {
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    marginTop: rs(8),
  },
  tplText: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.text, lineHeight: rs(18) },
  pickHint: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(4) },
  pickAmt: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  pickMeta: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(20),
  },
  editCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    padding: rs(18),
  },
  editTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(10) },
  editLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(8),
    marginBottom: rs(5),
  },
  editInput: {
    minHeight: rs(44),
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(12),
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rs(46),
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(12),
    gap: rs(8),
  },
  phonePrefix: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.textSecondary },
  phoneInput: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  editActions: { flexDirection: 'row', gap: rs(10), marginTop: rs(16) },
  editBtn: { flex: 1, height: rs(46), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontFamily: rd.font.bold, fontSize: rs(14) },
});
