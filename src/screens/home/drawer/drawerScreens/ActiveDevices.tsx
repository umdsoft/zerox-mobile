/**
 * ActiveDevices.tsx — "Aktiv qurilmalar" (faol login-sessiyalar).
 *
 * Sayt (frontend/pages/active-device/index.vue) bilan BIR XIL mantiq va oqim:
 *  - GET  /user/sessions?current=<fam>   → sessiyalar (refresh_sessions, web+mobil)
 *  - POST /user/sessions/revoke          → bitta qurilmani tugatish
 *  - POST /user/sessions/revoke-others   → joriydan boshqa hammasini tugatish
 *
 * "Joriy seans" — refresh-token'ning `fam` (family) claim'i bilan aniqlanadi
 * (client-side decode), server ham shu bo'yicha is_current qo'yadi.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { decode as atob } from 'base-64';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

import { rd, rs } from '../../../../theme/rd';
import RdHeader from '../../redesign/RdHeader';
import apiClient from '../../../../store/api/apiClient';
import { storage } from '../../../../store/api/token/getToken';
import { MonitorIcon, SmartphoneIcon, TrashIcon } from '../../redesign/icons';

type Session = {
  family_id: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  last_used_at: string;
  is_current: boolean;
};

// ── Joriy family (fam) — refresh-token payload'idan (sayt bilan bir xil decode). ──
const currentFam = (): string | null => {
  try {
    const rt = storage?.getString?.('refreshToken');
    if (!rt) return null;
    const p = rt.split('.')[1];
    if (!p) return null;
    const b64 = p.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json).fam || null;
  } catch (e) {
    return null;
  }
};

// ── user_agent tahlili (sayt bilan bir xil). ──
const isMobileApp = (ua: string) => {
  const s = (ua || '').trim();
  if (!s) return true; // ua yo'q — mobil ilova deb hisoblaymiz (okhttp ba'zan bo'sh)
  return /ZeroX|okhttp|Expo|Dart|CFNetwork|ReactNative|Flutter/i.test(s);
};
const osOf = (ua: string) => {
  const s = ua || '';
  if (/Windows/i.test(s)) return 'Windows';
  if (/Android/i.test(s)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(s)) return 'iOS';
  if (/Mac OS X|Macintosh/i.test(s)) return 'macOS';
  if (/Linux/i.test(s)) return 'Linux';
  return '';
};
const browserOf = (ua: string) => {
  const s = ua || '';
  if (/YaBrowser/i.test(s)) return 'Yandex';
  if (/Edg(e|A|iOS)?\//i.test(s)) return 'Edge';
  if (/OPR\/|Opera/i.test(s)) return 'Opera';
  if (/Chrome\/|CriOS/i.test(s)) return 'Chrome';
  if (/Firefox\/|FxiOS/i.test(s)) return 'Firefox';
  if (/Safari\//i.test(s)) return 'Safari';
  return 'Brauzer';
};

const ActiveDevices = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [confirm, setConfirm] = useState<any>(null); // SS9: tugatish tasdiq-modali
  const [fam] = useState<string | null>(() => currentFam());

  const deviceName = (s: Session) => {
    const ua = s?.user_agent || '';
    if (isMobileApp(ua)) return t('ZeroX mobil ilovasi');
    const os = osOf(ua);
    return os ? `${browserOf(ua)} (${os})` : browserOf(ua);
  };
  const isMobileKind = (s: Session) => {
    const ua = s?.user_agent || '';
    if (isMobileApp(ua)) return true;
    const os = osOf(ua);
    return os === 'Android' || os === 'iOS';
  };
  const platformLabel = (s: Session) =>
    isMobileApp(s?.user_agent || '') ? 'ZeroX' : 'ZeroX Web';

  const formatDateTime = (v?: string) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '—';
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return (
      `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  const fetchSessions = useCallback(async () => {
    const res = await apiClient.get('/user/sessions', {
      params: fam ? { current: fam } : {},
    });
    const list: Session[] = (res.data && res.data.data) || [];
    setSessions(list);
  }, [fam]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        try {
          await fetchSessions();
        } catch (e) {
          if (alive) {
            Toast.show({
              autoHide: true,
              visibilityTime: 2200,
              position: 'bottom',
              type: 'error2',
              props: { desc: t('Qurilmalarni yuklab bo‘lmadi') },
            });
          }
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [fetchSessions, t]),
  );

  const doRevoke = async (fn: () => Promise<any>, okText: string) => {
    if (revoking) return;
    setRevoking(true);
    try {
      await fn();
      await fetchSessions();
      Toast.show({
        autoHide: true,
        visibilityTime: 2000,
        position: 'bottom',
        type: 'omad',
        props: { desc: okText },
      });
    } catch (e) {
      Toast.show({
        autoHide: true,
        visibilityTime: 2200,
        position: 'bottom',
        type: 'error2',
        props: { desc: t('Amalni bajarib bo‘lmadi') },
      });
    } finally {
      setRevoking(false);
    }
  };

  // So'rov SS9: native Alert o'rniga chiroyli custom modal (confirm holati).
  const revokeOne = (s: Session) => {
    if (!s || s.family_id == null) return;
    setConfirm({
      title: t('Seansni tugatish'),
      message: t('Ushbu qurilmani seansdan chiqarmoqchimisiz?'),
      onOk: () =>
        doRevoke(
          () => apiClient.post('/user/sessions/revoke', { family_id: s.family_id }),
          t('Seans tugatildi.'),
        ),
    });
  };

  const revokeOthers = () => {
    setConfirm({
      title: t('Boshqa barcha seanslarni tugatish'),
      message: t('Ushbu qurilmadan tashqari barcha qurilmalardan chiqib ketiladi') + '.',
      onOk: () =>
        doRevoke(
          () =>
            apiClient.post('/user/sessions/revoke-others', {
              current: fam || undefined,
            }),
          t('Barcha seanslar tugatildi.'),
        ),
    });
  };

  const current = sessions.find(s => s && s.is_current) || null;
  const others = sessions.filter(s => !(s && s.is_current));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Ulangan qurilmalar')} />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={rd.color.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          {/* ── Ushbu qurilma ── */}
          <Text allowFontScaling={false} style={styles.sectionTitle}>
            {t('Ushbu qurilma')}
          </Text>

          <View style={[styles.card, styles.cardCurrent]}>
            <View style={[styles.iconBox, styles.iconCurrent]}>
              {current && !isMobileKind(current) ? (
                <MonitorIcon size={rs(26)} color="#fff" />
              ) : (
                <SmartphoneIcon size={rs(26)} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.deviceRow}>
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  style={styles.deviceName}>
                  {current ? deviceName(current) : t('ZeroX mobil ilovasi')}
                </Text>
                <View style={styles.currentBadge}>
                  <View style={styles.dot} />
                  <Text allowFontScaling={false} style={styles.currentBadgeText}>
                    {t('Joriy seans')}
                  </Text>
                </View>
              </View>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={styles.metaLine}>
                {current ? platformLabel(current) : 'ZeroX'}
                {current && current.ip ? `  ·  ${current.ip}` : ''}
              </Text>
            </View>
          </View>

          {sessions.length > 1 ? (
            <View style={styles.terminateAllWrap}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={revoking}
                onPress={revokeOthers}
                style={[styles.dangerBtn, revoking && styles.btnDisabled]}>
                <Text allowFontScaling={false} style={styles.dangerBtnText}>
                  {t('Boshqa barcha seanslarni tugatish')}
                </Text>
              </TouchableOpacity>
              <Text allowFontScaling={false} style={styles.hint}>
                {t('Ushbu qurilmadan tashqari barcha qurilmalardan chiqib ketiladi')}
              </Text>
            </View>
          ) : null}

          {/* ── Boshqa faol qurilmalar ── */}
          <Text
            allowFontScaling={false}
            style={[styles.sectionTitle, { marginTop: rs(22) }]}>
            {t('Boshqa faol qurilmalar')}
          </Text>

          {others.length ? (
            others.map((item, i) => (
              <View key={item.family_id || i} style={styles.card}>
                <View style={[styles.iconBox, styles.iconOther]}>
                  {isMobileKind(item) ? (
                    <SmartphoneIcon size={rs(22)} color={rd.color.primary} />
                  ) : (
                    <MonitorIcon size={rs(22)} color={rd.color.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={styles.deviceName}>
                    {deviceName(item)}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={styles.metaLine}>
                    {platformLabel(item)}
                    {item.ip ? `  ·  ${item.ip}` : ''}
                  </Text>
                  <Text allowFontScaling={false} style={styles.timeLine}>
                    {t('Oxirgi faollik')}:{' '}
                    {formatDateTime(item.last_used_at || item.created_at)}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={revoking}
                  onPress={() => revokeOne(item)}
                  style={[styles.termBtn, revoking && styles.btnDisabled]}>
                  <TrashIcon size={rs(15)} color={rd.color.error} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MonitorIcon size={rs(28)} color={rd.color.primary} />
              </View>
              <Text allowFontScaling={false} style={styles.emptyText}>
                {t('Boshqa faol qurilmalar yo‘q')}
              </Text>
            </View>
          )}

          <Text allowFontScaling={false} style={styles.footnote}>
            {t(
              'Xavfsizlik uchun tanimagan qurilmalarni tugating. Tugatilgan qurilma qaytadan kirishni talab qiladi.',
            )}
          </Text>
        </ScrollView>
      )}

      {/* ── Seans-tugatish TASDIQ MODALI (so'rov SS9 — chiroyli, native Alert emas) ── */}
      <Modal
        visible={!!confirm}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirm(null)}>
        <View style={styles.mOverlay}>
          <View style={styles.mCard}>
            <View style={styles.mIcon}>
              <TrashIcon size={rs(26)} color="#dc2626" />
            </View>
            <Text allowFontScaling={false} style={styles.mTitle}>
              {confirm?.title}
            </Text>
            <Text allowFontScaling={false} style={styles.mMsg}>
              {confirm?.message}
            </Text>
            <View style={styles.mBtns}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.mCancel}
                onPress={() => setConfirm(null)}>
                <Text allowFontScaling={false} style={styles.mCancelText}>
                  {t('Bekor qilish')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.mDanger}
                onPress={() => {
                  const ok = confirm?.onOk;
                  setConfirm(null);
                  ok && ok();
                }}>
                <Text allowFontScaling={false} style={styles.mDangerText}>
                  {t('Tugatish')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ActiveDevices;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: rs(16),
    paddingTop: rs(10),
    paddingBottom: rs(28),
  },
  sectionTitle: {
    // So'rov SS8: KATTA HARF emas — oddiy yozuv (faqat bosh harf katta).
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(10),
    marginLeft: rs(2),
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    padding: rs(14),
    marginBottom: rs(12),
  },
  cardCurrent: {
    borderColor: '#c9f0dd',
    backgroundColor: '#f4fdf8',
  },
  iconBox: {
    width: rs(50),
    height: rs(50),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCurrent: { backgroundColor: rd.color.success },
  iconOther: { backgroundColor: rd.color.primaryTint },

  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(8),
    marginBottom: rs(4),
  },
  deviceName: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
  },
  metaLine: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  timeLine: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(4),
  },

  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    backgroundColor: '#dcfce7',
    paddingHorizontal: rs(9),
    paddingVertical: rs(4),
    borderRadius: rd.radius.pill,
  },
  currentBadgeText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(10.5),
    color: '#059669',
  },
  dot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: '#10b981',
  },

  terminateAllWrap: { alignItems: 'center', marginTop: rs(2), marginBottom: rs(4) },
  dangerBtn: {
    alignSelf: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: '#fbcfd8',
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(18),
    paddingVertical: rs(12),
  },
  dangerBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: '#e11d48',
  },
  hint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(8),
    textAlign: 'center',
  },

  termBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(11),
    borderWidth: 1,
    borderColor: '#fbcfd8',
    backgroundColor: '#fff5f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(12),
    paddingVertical: rs(34),
    paddingHorizontal: rs(16),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderStyle: 'dashed',
    borderRadius: rd.radius.lg,
  },
  emptyIcon: {
    width: rs(52),
    height: rs(52),
    borderRadius: rs(15),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },

  footnote: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
    lineHeight: rs(17),
    marginTop: rs(14),
    marginHorizontal: rs(6),
  },

  // ── Tasdiq modali (SS9) ──
  mOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  mCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(22),
    padding: rs(22),
    alignItems: 'center',
  },
  mIcon: {
    width: rs(58),
    height: rs(58),
    borderRadius: rs(29),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(14),
  },
  mTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(16.5),
    color: rd.color.text,
    textAlign: 'center',
  },
  mMsg: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    textAlign: 'center',
    lineHeight: rs(19),
    marginTop: rs(8),
  },
  mBtns: { flexDirection: 'row', gap: rs(10), marginTop: rs(20), alignSelf: 'stretch' },
  mCancel: {
    flex: 1,
    height: rs(48),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mCancelText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.textSecondary },
  mDanger: {
    flex: 1,
    height: rs(48),
    borderRadius: rd.radius.md,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mDangerText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: '#fff' },
});
