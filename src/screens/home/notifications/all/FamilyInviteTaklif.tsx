/**
 * FamilyInviteTaklif.tsx (bildirishnoma, type = 48) — 23.10 "Oila moliyasi" TAKLIFI.
 *
 * Kimdir sizni kuzatmoqchi (fm_role='watched') yoki o'zini kuzatishga taklif qilmoqda
 * (fm_role='watcher'). Karta: fm_status='pending' → «Ruxsat berish» / «Rad etish»
 * (POST /finance/family/:family_member_id/respond { action }); boshqa holatlarda — natija yorlig'i.
 * 400 code='already-handled' → server qaytargan joriy status bilan karta yangilanadi;
 * 404 not-found → "Taklif bekor qilingan". Kontrakt: web agent, 23.10 (family_invite_contract.md).
 */
import React from 'react';
import { t } from 'i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { rd, rs } from '../../../../theme/rd';
import { CheckCircleIcon, CloseIcon, UsersIcon } from '../../redesign/icons';
import { financeApi } from '../../modules/financeApi';

const BLUE = '#2563eb';
const GREEN = '#16a34a';
const RED = '#dc2626';

type FmStatus = 'pending' | 'active' | 'rejected' | 'revoked' | null;

const normStatus = (s: unknown): FmStatus => {
  const v = String(s ?? '');
  return v === 'pending' || v === 'active' || v === 'rejected' || v === 'revoked' ? v : null;
};

const ERROR_TEXT: Record<string, string> = {
  forbidden: 'Bu taklif sizga yuborilmagan',
  'not-found': 'Taklif topilmadi yoki bekor qilingan',
};

const FamilyInviteTaklif = ({ item, okay, navigation }: any) => {
  const fmId = item?.family_member_id ?? item?.familyMemberId;
  const [status, setStatus] = React.useState<FmStatus>(normStatus(item?.fm_status));
  const [busy, setBusy] = React.useState<'accept' | 'reject' | null>(null);

  // Ro'yxat qayta yuklansa (pull-to-refresh) server holatini olamiz.
  React.useEffect(() => {
    setStatus(normStatus(item?.fm_status));
  }, [item?.fm_status]);

  const name = String(item?.fm_owner_name || item?.fm_owner_phone || t('Foydalanuvchi'));
  // 30.10: qabul qiluvchining O'Z ismi (fm_relation_label) matnda ko'rsatilmaydi — faqat yuboruvchi.
  const text =
    item?.fm_role === 'watcher'
      ? t('{{name}} sizni o‘zining moliyasini kuzatishga taklif qilmoqda.', { name })
      : t('{{name}} sizni oila moliyasi kuzatuviga qo‘shmoqchi.', { name });

  const respond = async (action: 'accept' | 'reject') => {
    if (busy || !fmId) return;
    try {
      setBusy(action);
      const res = await financeApi.respondFamily(fmId, { action });
      setStatus(normStatus(res?.data?.data?.status) || (action === 'accept' ? 'active' : 'rejected'));
      Toast.show({ type: 'omad', props: { desc: t(action === 'accept' ? 'Ruxsat berildi' : 'Rad etildi') } });
    } catch (e: any) {
      const code = e?.response?.data?.code;
      if (code === 'already-handled') {
        setStatus(normStatus(e?.response?.data?.status));
        Toast.show({ type: 'error2', props: { desc: t('Bu taklif allaqachon ko‘rib chiqilgan') } });
      } else if (code === 'not-found') {
        setStatus(null);
        Toast.show({ type: 'error2', props: { desc: t(ERROR_TEXT['not-found']) } });
      } else {
        Toast.show({ type: 'error2', props: { desc: t(ERROR_TEXT[code] || 'Xatolik yuz berdi') } });
      }
    } finally {
      setBusy(null);
    }
  };

  const renderState = () => {
    if (status === 'pending') {
      return (
        <View style={styles.btnRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => respond('accept')}
            disabled={!!busy}
            style={[styles.btn, styles.btnAccept]}
            accessibilityRole="button">
            {busy === 'accept' ? (
              <ActivityIndicator size="small" color={rd.color.onPrimary} />
            ) : (
              <Text allowFontScaling={false} style={styles.btnAcceptText}>{t('Ruxsat berish')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => respond('reject')}
            disabled={!!busy}
            style={[styles.btn, styles.btnReject]}
            accessibilityRole="button">
            {busy === 'reject' ? (
              <ActivityIndicator size="small" color={RED} />
            ) : (
              <Text allowFontScaling={false} style={styles.btnRejectText}>{t('Rad etish')}</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    const meta =
      status === 'active'
        ? { label: 'Qabul qilingan', color: GREEN, ok: true }
        : status === 'rejected'
          ? { label: 'Rad etilgan', color: RED, ok: false }
          : { label: 'Taklif bekor qilingan', color: rd.color.textTertiary, ok: false };
    return (
      <View style={[styles.state, { backgroundColor: meta.color + '14' }]}>
        {meta.ok ? (
          <CheckCircleIcon size={rs(15)} color={meta.color} />
        ) : (
          <CloseIcon size={rs(13)} color={meta.color} />
        )}
        <Text allowFontScaling={false} style={[styles.stateText, { color: meta.color }]}>{t(meta.label)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <UsersIcon size={rs(18)} color={BLUE} />
        </View>
        <Text allowFontScaling={false} style={styles.title} numberOfLines={2}>
          {t('Oila moliyasi taklifi')}
        </Text>
      </View>
      <Text allowFontScaling={false} style={styles.sub}>{text}</Text>
      {renderState()}
      <View style={styles.footer}>
        <Text allowFontScaling={false} style={styles.time}>
          {item?.created} {item?.time ? String(item.time).slice(0, 5) : ''}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation?.navigate('FinanceFamily')}
            accessibilityRole="button">
            <Text allowFontScaling={false} style={styles.link}>{t('Oila moliyasi')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => okay?.(item?.id, item?.type)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text allowFontScaling={false} style={styles.link}>Ok</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default FamilyInviteTaklif;

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginTop: rs(12),
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  icon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: BLUE + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  sub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
    marginTop: rs(10),
  },
  btnRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(12) },
  btn: {
    flex: 1,
    height: rs(40),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAccept: { backgroundColor: GREEN },
  btnAcceptText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.onPrimary },
  btnReject: { backgroundColor: rd.color.surface, borderWidth: 1, borderColor: RED + '55' },
  btnRejectText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: RED },
  state: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: rs(6),
    marginTop: rs(12),
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
    borderRadius: rd.radius.pill,
  },
  stateText: { fontFamily: rd.font.semibold, fontSize: rs(12) },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  time: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  link: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },
});
