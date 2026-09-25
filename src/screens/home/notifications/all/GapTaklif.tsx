/**
 * GapTaklif.tsx — SS8: "Gap taklifi" bildirishnomasi (type = 40).
 *
 * Tashkilotchi (yoki navbati kelgan a'zo) uchrashuv joyi va plastik kartani
 * kiritib "Taklif yuborish" bosganda a'zolarga shu bildirishnoma keladi.
 *
 * Kartada: gap nomi, davra sanasi, LOKATSIYA (xaritada ochiladi), PLASTIK KARTA
 * (nusxalash), TO'LOV MIQDORI va "Boraman / Bora olmayman" tugmalari.
 *
 * Ma'lumot bildirishnomalar ro'yxatida yo'q (u faqat gap_round_id beradi) —
 * shu bois kartaning o'zi `GET /finance/gap/invite/:roundId` bilan yuklaydi.
 */
import { safeOpenURL } from '@helper/safeOpenURL';
import React from 'react';
import { t } from 'i18next';
import { Clipboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { rd, rs } from '../../../../theme/rd';
import { financeApi } from '../../modules/financeApi';
import { fDate, fMoney } from '../../modules/financeMoney';
import { fmtCard4 } from '../../../../helper/cardBin';
import { CopyIcon, LocationIcon, UsersIcon } from '../../redesign/icons';

const TEAL = '#0d9488';

// SS-AUDIT (2026-09-25): fmtCard4 -> helper/cardBin, fmtDateDots -> financeMoney.fDate
// (aynan bir xil nusxalar olib tashlandi).
const fmtDateDots = (raw?: string): string => fDate(raw);
const GREEN = '#16a34a';
const RED = '#dc2626';

/**
 * SS-DEV (2026-09-24): davra muddati o'tganmi. Backend `round_expired`
 * bayrog'i bo'lsa o'sha; bo'lmasa `due_date` KUNI bugundan oldinmi.
 * Muddati o'tgan taklif uchun "Boraman / Bora olmayman" ko'rsatilmaydi.
 */
const isInviteExpired = (info: any): boolean => {
  if (typeof info?.round_expired === 'boolean') return info.round_expired;
  const m = String(info?.due_date || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return false;
  const due = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return due < today;
};

const GapTaklif = ({ item, okay, navigation }: any) => {
  const roundId = item?.gap_round_id;
  const [info, setInfo] = React.useState<any>(null);
  /**
   * SS6 (2026-09-15): ilgari HAR QANDAY xatoda karta "taklif endi mavjud emas"
   * deb yozardi. Ammo 429 (limit) yoki tarmoq uzilishi — VAQTINCHALIK holat,
   * taklif joyida turadi. Endi xato TURI ajratiladi: faqat 403/404 da "yo'q"
   * deyiladi, qolganda "qayta urinib ko'ring" ko'rsatiladi.
   */
  const [loadErr, setLoadErr] = React.useState<'gone' | 'temporary' | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [att, setAtt] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    // SS-AUDIT (2026-09-25): gap_round_id yo'q — karta abadiy "Yuklanmoqda..."da qolmasin.
    if (!roundId) {
      setLoadErr('gone');
      return;
    }
    financeApi
      .getGapInvite(roundId)
      .then(r => {
        if (!alive) return;
        const d = r.data?.data || null;
        setInfo(d);
        setAtt(d?.my_attendance || null);
        setLoadErr(d ? null : 'gone');
      })
      .catch((e: any) => {
        if (!alive) return;
        const st = e?.response?.status;
        // 403/404 — taklif haqiqatan yo'q (gap o'chirilgan yoki a'zolik bekor).
        // Qolgani (429, 5xx, tarmoq) — VAQTINCHALIK.
        setLoadErr(st === 403 || st === 404 ? 'gone' : 'temporary');
      });
    return () => {
      alive = false;
    };
  }, [roundId]);

  const openLocation = () => {
    const loc = info?.location;
    if (!loc) return;
    const url = /^https:\/\//i.test(loc) ? loc : `https://maps.google.com/?q=${encodeURIComponent(loc)}`;
    safeOpenURL(url); // SS-SEC (2026-09-25): faqat https/tel/sms/tg
  };

  const copyCard = () => {
    // ⚠️ o'zgaruvchi nomi `t` EMAS: u i18next tarjima funksiyasini to'sib qo'yardi.
    const digits = String(info?.card_number || '').replace(/\s/g, '');
    if (!digits) return;
    try {
      Clipboard.setString(digits);
      Toast.show({ type: 'omad', props: { desc: t('Karta raqami nusxalandi') } });
    } catch (_) {}
  };

  const answer = async (status: 'going' | 'not_going') => {
    if (busy || !info) return;
    /**
     * SS8 (2026-09-18): javob BIR MARTA beriladi — "Boraman" tanlangach uni
     * "Bora olmayman"ga o'zgartirib bo'lmaydi.
     *
     * Backend ham shu qoidani ta'minlaydi (`attendanceUpsertFirstWins`):
     * javob Telegram botda yoki saytda berilgan bo'lsa ham BIRINCHISI qoladi.
     * Bu yerdagi tekshiruv — foydalanuvchiga darhol javob berish uchun
     * (server borib-kelishini kutmasdan).
     */
    if (att) {
      if (att !== status) {
        Toast.show({
          type: 'error2',
          props: { desc: t('Javobingiz allaqachon qabul qilingan — o‘zgartirib bo‘lmaydi') },
        });
      }
      return;
    }
    try {
      setBusy(true);
      await financeApi.setGapAttendance(info.gap_id, info.round_id, status);
      setAtt(status);
      Toast.show({
        type: 'omad',
        props: { desc: status === 'going' ? 'Javobingiz: Boraman' : 'Javobingiz: Bora olmayman' },
      });
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <UsersIcon size={rs(18)} color={TEAL} />
        </View>
        <Text allowFontScaling={false} style={styles.title} numberOfLines={2}>
          {/* SS15 (2026-09-14): uchrashuv JOYI kiritilmagan bo'lsa bu taklif
              emas — faqat to'lov ogohlantirishi. Sarlavha ham shunga mos. */}
          {info && !info.venue ? 'To‘lov haqida ogohlantirish' : 'Gap uchrashuviga taklif'}
        </Text>
      </View>

      {info ? (
        <>
          <Text allowFontScaling={false} style={styles.sub}>
            <Text style={styles.bold}>{info.gap_name}</Text>
            {info.round_no ? ` · ${info.round_no}-davra` : ''}
            {info.due_date ? ` · ${fmtDateDots(info.due_date)}` : ''}
          </Text>
          {!!info.recipient_name && (
            <Text allowFontScaling={false} style={styles.sub}>
              Qabul qiluvchi: <Text style={styles.bold}>{info.recipient_name}</Text>
            </Text>
          )}

          {/* Lokatsiya */}
          {!!info.venue && (
            <TouchableOpacity
              activeOpacity={info.location ? 0.8 : 1}
              disabled={!info.location}
              onPress={openLocation}
              style={styles.row}>
              <LocationIcon size={rs(15)} color={TEAL} />
              <Text allowFontScaling={false} style={styles.rowText} numberOfLines={2}>
                {info.venue}
                {info.location ? '  ·  Xaritada ochish' : ''}
              </Text>
            </TouchableOpacity>
          )}

          {/* To'lov miqdori */}
          {Number(info.amount) > 0 && (
            <View style={styles.row}>
              <Text allowFontScaling={false} style={styles.rowLabel}>{t('To‘lov miqdori')}</Text>
              <Text allowFontScaling={false} style={styles.amount}>
                {fMoney(info.amount, info.currency || 'UZS')}
              </Text>
            </View>
          )}

          {/* Plastik karta — SS5: nom soddalashtirildi, raqam 4 talab guruhlandi,
              oxirida NUSXALASH ikonkasi turadi (matnda "(nusxalash)" yozuvi shart emas). */}
          {!!info.card_number && (
            <TouchableOpacity activeOpacity={0.8} onPress={copyCard} style={styles.cardBox}>
              <Text allowFontScaling={false} style={styles.cardLabel}>{t('💳 Plastik karta')}</Text>
              <View style={styles.cardNumRow}>
                <Text allowFontScaling={false} style={styles.cardNum}>
                  {fmtCard4(info.card_number)}
                </Text>
                <View style={styles.copyBtn}>
                  <CopyIcon size={rs(15)} color={TEAL} />
                </View>
              </View>
              {!!info.card_holder && (
                <Text allowFontScaling={false} style={styles.cardHolder}>{info.card_holder}</Text>
              )}
            </TouchableOpacity>
          )}

          {/* SS15: "Boraman / Bora olmayman" FAQAT uchrashuv joyi kiritilgan
              bo'lsa. Joy noma'lum bo'lsa a'zo boraman deb javob bera olmaydi —
              tugmalarni ko'rsatish chalg'itardi. */}
          {!!info.venue && !isInviteExpired(info) && (
          <View style={styles.btnRow}>
            {/* SS8: ikonkalar OLIB TASHLANDI (so'rov) — faqat matn.
                Javob berilgach tanlanmagan tugma so'nadi: u endi bosilmaydi. */}
            <TouchableOpacity
              activeOpacity={att ? 1 : 0.85}
              disabled={busy}
              onPress={() => answer('going')}
              style={[
                styles.attBtn,
                att === 'going'
                  ? { backgroundColor: GREEN, borderColor: GREEN }
                  : { borderColor: GREEN + '66' },
                att === 'not_going' && styles.attBtnMuted,
              ]}>
              <Text
                allowFontScaling={false}
                style={[styles.attText, att === 'going' ? { color: '#fff' } : { color: GREEN }]}>
                Boraman
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={att ? 1 : 0.85}
              disabled={busy}
              onPress={() => answer('not_going')}
              style={[
                styles.attBtn,
                att === 'not_going'
                  ? { backgroundColor: RED, borderColor: RED }
                  : { borderColor: RED + '66' },
                att === 'going' && styles.attBtnMuted,
              ]}>
              <Text
                allowFontScaling={false}
                style={[styles.attText, att === 'not_going' ? { color: '#fff' } : { color: RED }]}>
                Bora olmayman
              </Text>
            </TouchableOpacity>
          </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('FinanceGapDetail', { id: info.gap_id })}
            style={styles.openBtn}>
            <Text allowFontScaling={false} style={styles.openText}>{t('Gapni ochish ›')}</Text>
          </TouchableOpacity>
        </>
      ) : loadErr === 'gone' ? (
        <Text allowFontScaling={false} style={styles.sub}>
          Bu taklif endi mavjud emas (gap o‘chirilgan yoki a’zolik bekor qilingan).
        </Text>
      ) : loadErr === 'temporary' ? (
        // SS6: 429/tarmoq xatosi — taklif JOYIDA, shunchaki hozir yuklanmadi.
        <Text allowFontScaling={false} style={styles.sub}>
          Ma’lumot hozir yuklanmadi. Birozdan so‘ng qayta oching.
        </Text>
      ) : (
        <Text allowFontScaling={false} style={styles.sub}>{t('Yuklanmoqda...')}</Text>
      )}

      <View style={styles.footer}>
        <Text allowFontScaling={false} style={styles.date}>
          {[item?.created, item?.time].filter(Boolean).join(' ')}
        </Text>
        <TouchableOpacity activeOpacity={0.8} onPress={() => okay?.(item?.id)} style={styles.okBtn}>
          <Text allowFontScaling={false} style={styles.okText}>Ok</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GapTaklif;

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(8) },
  icon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: TEAL + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text },
  sub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
    marginBottom: rs(2),
  },
  bold: { fontFamily: rd.font.bold, color: rd.color.text },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(8),
    marginTop: rs(8),
    paddingVertical: rs(8),
    paddingHorizontal: rs(10),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
  },
  rowText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.text },
  rowLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  amount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: TEAL },

  cardBox: {
    marginTop: rs(8),
    padding: rs(12),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: TEAL + '44',
    backgroundColor: TEAL + '0F',
  },
  cardLabel: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: TEAL },
  cardNumRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  copyBtn: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(8),
    backgroundColor: TEAL + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNum: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    letterSpacing: 1,
    marginTop: rs(4),
  },
  cardHolder: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(2) },

  btnRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
  attBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(10),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    backgroundColor: rd.color.surface,
  },
  // SS8: javob berilgach TANLANMAGAN tugma so'nadi — u bosilmasligi ko'rinib turadi.
  attBtnMuted: { opacity: 0.4 },
  attText: { fontFamily: rd.font.semibold, fontSize: rs(12.5) },

  openBtn: { alignSelf: 'flex-start', marginTop: rs(10) },
  openText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: TEAL },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  date: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary },
  okBtn: {
    paddingHorizontal: rs(18),
    paddingVertical: rs(7),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.primary,
  },
  okText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.onPrimary },
});
