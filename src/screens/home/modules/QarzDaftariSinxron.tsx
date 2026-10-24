/**
 * QarzDaftariSinxron.tsx — "Oflayn rejim" sahifasi (23.10).
 *
 * - Ulanish holati, oxirgi sinxron, navbatdagi/xato amallar soni, "Hozir sinxronlash".
 * - Navbat ro'yxati: har amal turi, mijoz, summa, vaqt va holati.
 * - Xato (server rad etgan) amallar HECH QACHON jim tashlanmaydi — bu yerda hal qilinadi:
 *   "Qayta urinish", "Summani o'zgartirish" (qaytarish/voz kechish/bo'lak), "Bekor qilish" (tasdiq bilan,
 *   bog'liq amallar soni ko'rsatiladi), "Mijozni ochish".
 * - 24.10: navbatdagi (pending) amalni ham bekor qilish / summasini o'zgartirish mumkin — faqat u hali
 *   HECH QACHON jo'natilmagan bo'lsa (jo'natilib javobi kelmagan amal serverda bajarilgan bo'lishi mumkin:
 *   yangi kalit = dublikat) — aks holda "Yuborilmoqda — kuting". Summa faqat 4xx bilan rad etilganda.
 * - 24.10: serverda bajarilgan, javobi yo'qolgan amal — "Qayta urinish"/"Summani o'zgartirish" YO'Q
 *   (dublikat bo'lardi), faqat ro'yxatdan olib tashlash. Telefon band, ism boshqa — "Shu mijozga bog'lash".
 * - O'qish keshi hajmi va "Keshni tozalash" (oflaynda o'chirilgan — oflayn ekranlar bo'sh qolardi).
 */
import { prefetchForOffline } from '../../../offline/prefetch';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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
import { fmtAmountByCurrency, formatAmountInput, isUsd, parseAmount, sanitizeAmountInput } from '../../../helper/money';
import { useOfflineSummary } from '../../../offline/hooks';
import { useIsOnline } from '../../../offline/netStatus';
import { getOutbox, responseCache } from '../../../offline/offlineStore';
import { CODE_RESPONSE_UNAVAILABLE, isTerminalFailure } from '../../../offline/opSpec';
import { canDiscard, canEditAmount } from '../../../offline/outbox';
import { requestSync, startOfflineSync, useSyncStatus } from '../../../offline/syncManager';
import { OutboxOp } from '../../../offline/types';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { CheckCircleIcon, ClockIcon, WarningIcon, WifiOffIcon } from '../redesign/icons';

type TFn = (k: string, o?: Record<string, unknown>) => string;

const KIND_LABEL: Record<OutboxOp['kind'], string> = {
  'mijoz.create': 'Yangi mijoz',
  'qarz.create': 'Yangi qarz',
  'qarz.yopish': 'Qarzni yopish',
  'mijoz.yopish': 'Qarzni yopish',
  'qarz.vozKechish': 'Qarzdan voz kechish',
  'tolov.tolandi': 'Bo‘lak to‘lovi',
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtTime = (ms?: number) => {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtBytes = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/** Server rad etish sababini foydalanuvchi tilida. */
export function opErrorText(op: OutboxOp, t: TFn): string {
  const e = op.lastError;
  if (!e) return '';
  switch (e.code) {
    case CODE_RESPONSE_UNAVAILABLE:
      return t('Serverda bajarilgan — ma’lumotlarni yangilang');
    case 'IDEMPOTENCY_KEY_REUSED':
      return t('Ichki xato — amalni bekor qilib, qaytadan kiriting');
    case 'CUSTOMER_BLOCKED':
      return t('Shu mijozning oldingi amali yuborilmagan — avval uni hal qiling');
    case 'CUSTOMER_PARENT_DISCARDED':
      return t('Oldingi amal bekor qilindi — bu amalni yuborish uchun «Qayta urinish»ni bosing');
    case 'DEPENDENCY_COMMITTED':
      return t('Bog‘liq amal serverda bajarilgan — ma’lumotlarni yangilab, amalni qaytadan kiriting');
    case 'PERSIST_FAILED':
      return t('Telefon xotirasiga yozib bo‘lmadi — qayta urinilmoqda');
    case 'phone-exists':
      if (e.existingId) {
        return t('Bu telefon raqami boshqa mijozda: {{fish}}', { fish: e.existingFish || `#${e.existingId}` });
      }
      break;
    case 'amount-exceeds':
      return t('To‘lov summasi qoldiqdan oshib ketdi — qarz boshqa joyda o‘zgargan bo‘lishi mumkin');
    case 'no-sms-package':
      return t('SMS paketi yo‘q — paket olib, qayta urining');
    case 'OFERTA_REQUIRED':
      return t('Ofertani tasdiqlang, so‘ng qayta urining');
    case 'DEPENDENCY_FAILED':
      return t('Bog‘liq amal (mijoz yoki qarz) yuborilmadi');
    case 'no-active-debt':
      return t('Aktiv qarzlar yo‘q');
    default:
      break;
  }
  if (e.status === 403) return t('Ruxsat yo‘q');
  if (e.status === 404) return t('Qarz yoki mijoz topilmadi (o‘chirilgan bo‘lishi mumkin)');
  if (e.status === null) return t('Tarmoq xatosi — qayta urinilmoqda');
  if (e.status >= 500 && op.status === 'failed') return t('Server xatosi — keyinroq qayta urining');
  return e.message || t('Server amalni rad etdi');
}

const amountOf = (op: OutboxOp): { summa?: number; valyuta?: string } => {
  if (op.kind === 'qarz.create') return { summa: op.payload.body.miqdor, valyuta: op.payload.body.valyuta };
  if (op.kind === 'mijoz.create') return {};
  if (op.kind === 'tolov.tolandi') return { summa: op.payload.summa ?? op.meta.summa, valyuta: op.meta.valyuta };
  return { summa: op.payload.summa, valyuta: op.payload.valyuta };
};

const QarzDaftariSinxron = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const online = useIsOnline();
  const sync = useSyncStatus();
  const summary = useOfflineSummary();
  const [confirmOp, setConfirmOp] = useState<OutboxOp | null>(null);
  const [editOp, setEditOp] = useState<OutboxOp | null>(null);
  const [editRaw, setEditRaw] = useState('');
  const [clearAsk, setClearAsk] = useState(false);
  const [cacheStats, setCacheStats] = useState(() => responseCache.stats());

  useEffect(() => {
    startOfflineSync();
  }, []);

  const ops = useMemo(() => summary.ops.slice().sort((a, b) => b.createdAt - a.createdAt), [summary.ops]);

  const syncNow = async () => {
    const res = await requestSync(true);
    if (!res && !online) {
      Toast.show({ type: 'error2', props: { desc: t('Internet yo‘q — amallar saqlangan, keyinroq yuboriladi') } });
    }
  };

  const retry = (op: OutboxOp) => {
    getOutbox().retry(op.id);
    requestSync(true);
  };

  const discard = () => {
    if (!confirmOp) return;
    const n = getOutbox().discard(confirmOp.id);
    setConfirmOp(null);
    if (!n) {
      // Shu orada jo'natilgan — endi bekor qilib bo'lmaydi.
      Toast.show({ type: 'error2', props: { desc: t('Yuborilmoqda — kuting') } });
      return;
    }
    Toast.show({ type: 'omad', props: { desc: t('{{n}} ta amal bekor qilindi', { n }) } });
  };

  const linkExisting = (op: OutboxOp) => {
    try {
      if (!getOutbox().linkExisting(op.id)) return;
    } catch {
      Toast.show({ type: 'error2', props: { desc: t('Telefon xotirasiga yozib bo‘lmadi') } });
      return;
    }
    requestSync(true);
  };

  const openEdit = (op: OutboxOp) => {
    const { summa, valyuta } = amountOf(op);
    setEditRaw(sanitizeAmountInput(String(summa ?? ''), isUsd(valyuta)));
    setEditOp(op);
  };

  const saveEdit = () => {
    if (!editOp) return;
    const usd = isUsd(amountOf(editOp).valyuta);
    const v = parseAmount(editRaw, usd);
    if (!(v > 0)) {
      Toast.show({ type: 'error2', props: { desc: t('Summani kiriting') } });
      return;
    }
    const edited = getOutbox().editAmount(editOp.id, v);
    setEditOp(null);
    if (!edited) {
      Toast.show({ type: 'error2', props: { desc: t('Yuborilmoqda — kuting') } });
      return;
    }
    requestSync(true);
  };

  const openMijoz = (op: OutboxOp) => {
    const id = op.kind === 'mijoz.create' ? op.tempId : op.meta.mijozId;
    if (id === undefined) return;
    const resolved = getOutbox().resolveId(id) ?? id;
    navigation.navigate('QarzDaftariMijoz', { id: resolved, turi: op.meta.turi || 'berish', fish: op.meta.fish });
  };

  const confirmDeps = confirmOp ? getOutbox().dependentsOf(confirmOp.id).length : 0;
  const confirmCommitted = !!confirmOp && isTerminalFailure(confirmOp) && confirmOp.lastError?.code === CODE_RESPONSE_UNAVAILABLE;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Oflayn rejim')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Holat kartasi */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: online ? rd.color.success : rd.color.warning }]} />
            <Text style={styles.statusTitle}>{online ? t('Internet bor') : t('Internet yo‘q')}</Text>
            {sync.running ? <ActivityIndicator size="small" color={rd.color.primary} style={{ marginLeft: 'auto' }} /> : null}
          </View>
          <View style={styles.counters}>
            <Counter label={t('Navbatda')} value={summary.queued} color={rd.color.warning} />
            <Counter label={t('Xato')} value={summary.failed + summary.blocked} color={rd.color.error} />
          </View>
          <Text style={styles.muted}>
            {t('Oxirgi sinxron')}: {fmtTime(sync.lastRunAt)}
          </Text>
          {sync.authBlocked && summary.queued ? (
            <Text style={[styles.muted, { color: rd.color.error }]}>{t('Iltimos, qayta kiring — amallar saqlangan')}</Text>
          ) : null}
          {summary.otherSession ? (
            <Text style={styles.muted}>
              {t('Boshqa sessiyada (xodim rejimi) {{n}} ta amal kutmoqda — o‘sha sessiyada yuboriladi', {
                n: summary.otherSession,
              })}
            </Text>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.primaryBtn, (sync.running || !summary.queued) && styles.btnDisabled]}
            disabled={sync.running || !summary.queued}
            onPress={syncNow}
            accessibilityRole="button">
            <Text style={styles.primaryBtnText}>{t('Hozir sinxronlash')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.info}>
          {t(
            'Internet yoki svet o‘chganda ham qarz yozish, qarzni yopish va voz kechish ishlaydi. Amallar telefonda shifrlangan holda saqlanadi va internet tiklanishi bilan avtomatik yuboriladi. Mijozga SMS amal serverga yetganda ketadi; talab SMS faqat internet bilan yuboriladi.',
          )}
        </Text>

        {/* Navbat */}
        <Text style={styles.section}>{t('Amallar')}</Text>
        {!ops.length ? (
          <View style={[styles.card, styles.empty]}>
            <CheckCircleIcon size={rs(28)} color={rd.color.success} />
            <Text style={styles.emptyText}>{t('Barcha amallar serverga yuborilgan')}</Text>
          </View>
        ) : (
          ops.map(op => (
            <OpCard
              key={op.id}
              op={op}
              t={t}
              onRetry={() => retry(op)}
              onDiscard={() => setConfirmOp(op)}
              onEdit={() => openEdit(op)}
              onLink={() => linkExisting(op)}
              onOpenMijoz={op.meta.mijozId !== undefined || op.kind === 'mijoz.create' ? () => openMijoz(op) : undefined}
            />
          ))
        )}

        {/* Kesh */}
        <Text style={styles.section}>{t('Saqlangan ma’lumotlar')}</Text>
        <View style={styles.card}>
          <Text style={styles.muted}>
            {t('{{n}} ta sahifa, {{size}}', { n: cacheStats.entries, size: fmtBytes(cacheStats.bytes) })}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.secondaryBtn, !online && styles.btnDisabled]}
            disabled={!online}
            accessibilityState={{ disabled: !online }}
            onPress={() => setClearAsk(true)}>
            <Text style={styles.secondaryBtnText}>{t('Keshni tozalash')}</Text>
          </TouchableOpacity>
          {!online ? <Text style={styles.muted}>{t('Keshni faqat internet bor paytda tozalash mumkin')}</Text> : null}
        </View>
      </ScrollView>

      {/* Bekor qilish tasdig'i */}
      <Modal transparent visible={!!confirmOp} animationType="fade" onRequestClose={() => setConfirmOp(null)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('Amalni bekor qilasizmi?')}</Text>
            <Text style={styles.modalText}>
              {confirmCommitted
                ? t('Amal serverda allaqachon bajarilgan — faqat bu ro‘yxatdan olib tashlanadi.')
                : t('Bu amal serverga yuborilmaydi va qayta tiklanmaydi.')}
              {confirmDeps ? `\n${t('Unga bog‘liq yana {{n}} ta amal ham bekor qilinadi.', { n: confirmDeps })}` : ''}
            </Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.secondaryBtnFlex} onPress={() => setConfirmOp(null)}>
                <Text style={styles.secondaryBtnText}>{t('Yo‘q')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dangerBtn]} onPress={discard}>
                <Text style={styles.primaryBtnText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Summani o'zgartirish */}
      <Modal transparent visible={!!editOp} animationType="fade" onRequestClose={() => setEditOp(null)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('Summani o‘zgartirish')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={formatAmountInput(editRaw, isUsd(editOp ? amountOf(editOp).valyuta : 'UZS'))}
              onChangeText={v => setEditRaw(sanitizeAmountInput(v, isUsd(editOp ? amountOf(editOp).valyuta : 'UZS')))}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.secondaryBtnFlex} onPress={() => setEditOp(null)}>
                <Text style={styles.secondaryBtnText}>{t('Bekor')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtnFlex} onPress={saveEdit}>
                <Text style={styles.primaryBtnText}>{t('Saqlash va yuborish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Keshni tozalash tasdig'i */}
      <Modal transparent visible={clearAsk} animationType="fade" onRequestClose={() => setClearAsk(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('Keshni tozalash')}</Text>
            <Text style={styles.modalText}>
              {t('Saqlangan sahifalar o‘chiriladi. Navbatdagi amallarga ta’sir qilmaydi. Oflaynda ma’lumotlar ko‘rinmay qolishi mumkin.')}
            </Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.secondaryBtnFlex} onPress={() => setClearAsk(false)}>
                <Text style={styles.secondaryBtnText}>{t('Yo‘q')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={() => {
                  responseCache.clear();
                  // Kesh bo'shadi — oflayn uchun darhol qayta tayyorlanadi (30 daqiqalik throttle'siz).
                  prefetchForOffline({ minIntervalMs: 0 });
                  setCacheStats(responseCache.stats());
                  setClearAsk(false);
                }}>
                <Text style={styles.primaryBtnText}>{t('Tozalash')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Counter = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={styles.counter}>
    <Text style={[styles.counterValue, { color: value ? color : rd.color.textTertiary }]}>{value}</Text>
    <Text style={styles.counterLabel}>{label}</Text>
  </View>
);

type OpCardProps = {
  op: OutboxOp;
  t: TFn;
  onRetry: () => void;
  onDiscard: () => void;
  onEdit: () => void;
  onLink: () => void;
  onOpenMijoz?: () => void;
};

const OpCard = ({ op, t, onRetry, onDiscard, onEdit, onLink, onOpenMijoz }: OpCardProps) => {
  const { summa, valyuta } = amountOf(op);
  const bad = op.status === 'failed' || op.status === 'blocked';
  const done = op.status === 'done';
  const terminal = isTerminalFailure(op);
  const committed = terminal && op.lastError?.code === CODE_RESPONSE_UNAVAILABLE;
  const statusText = done
    ? op.note === 'linked-existing'
      ? t('Mavjud mijozga bog‘landi')
      : op.note === 'replay-lost'
      ? t('Serverda bajarilgan')
      : t('Yuborildi')
    : bad
    ? op.status === 'blocked'
      ? t('Kutmoqda (bog‘liq amal)')
      : committed
      ? t('Serverda bajarilgan')
      : t('Rad etildi')
    : op.status === 'syncing'
    ? t('Yuborilmoqda…')
    : t('Navbatda');
  const color = done ? rd.color.success : bad ? rd.color.error : rd.color.warning;
  const Icon = done ? CheckCircleIcon : bad ? WarningIcon : op.lastError?.status === null ? WifiOffIcon : ClockIcon;
  return (
    <View style={[styles.card, bad && { borderColor: rd.color.errorBg, borderWidth: 1 }]}>
      <View style={styles.opHead}>
        <Icon size={rs(18)} color={color} />
        <Text style={styles.opTitle} numberOfLines={1}>
          {t(KIND_LABEL[op.kind])}
        </Text>
        <Text style={[styles.opStatus, { color }]}>{statusText}</Text>
      </View>
      <Text style={styles.opSub} numberOfLines={1}>
        {op.meta.fish || (op.kind === 'mijoz.create' ? op.payload.fish : '')}
        {summa !== undefined ? ` · ${fmtAmountByCurrency(summa, valyuta)} ${valyuta === 'USD' ? 'USD' : t('so‘m')}` : ''}
      </Text>
      <Text style={styles.muted}>{fmtTime(op.createdAt)}</Text>
      {!done && op.lastError ? <Text style={[styles.opError, !bad && { color: rd.color.textSecondary }]}>{opErrorText(op, t)}</Text> : null}
      {op.status === 'pending' && op.sentOnce ? <Text style={styles.muted}>{t('Yuborilmoqda — kuting')}</Text> : null}
      {bad || (op.status === 'pending' && !op.sentOnce) ? (
        <View style={styles.actions}>
          {bad && !terminal ? <ActionBtn label={t('Qayta urinish')} onPress={onRetry} primary /> : null}
          {op.kind === 'mijoz.create' && op.status === 'failed' && op.lastError?.existingId ? (
            <ActionBtn label={t('Shu mijozga bog‘lash')} onPress={onLink} primary />
          ) : null}
          {canEditAmount(op) ? <ActionBtn label={t('Summani o‘zgartirish')} onPress={onEdit} /> : null}
          {onOpenMijoz ? <ActionBtn label={t('Mijozni ochish')} onPress={onOpenMijoz} /> : null}
          {canDiscard(op) ? (
            <ActionBtn label={committed ? t('Ro‘yxatdan olib tashlash') : t('Bekor qilish')} onPress={onDiscard} danger />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const ActionBtn = ({ label, onPress, primary, danger }: { label: string; onPress: () => void; primary?: boolean; danger?: boolean }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.action, primary && { backgroundColor: rd.color.primary }, danger && { backgroundColor: rd.color.errorBg }]}
    accessibilityRole="button">
    <Text style={[styles.actionText, primary && { color: rd.color.onPrimary }, danger && { color: rd.color.error }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { padding: rs(16), paddingBottom: rs(40), gap: rs(10) },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    padding: rs(14),
    gap: rs(6),
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  dot: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  statusTitle: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  counters: { flexDirection: 'row', gap: rs(10), marginVertical: rs(4) },
  counter: { flex: 1, backgroundColor: rd.color.page, borderRadius: rd.radius.md, paddingVertical: rs(10), alignItems: 'center' },
  counterValue: { fontFamily: rd.font.bold, fontSize: rs(22) },
  counterLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  muted: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary },
  info: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, lineHeight: rs(18), paddingHorizontal: rs(4) },
  section: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text, marginTop: rs(8), paddingHorizontal: rs(4) },
  empty: { alignItems: 'center', paddingVertical: rs(20) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textSecondary },
  primaryBtn: {
    marginTop: rs(8),
    height: rs(46),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.onPrimary },
  primaryBtnFlex: { flex: 1, height: rs(44), borderRadius: rd.radius.md, backgroundColor: rd.color.primary, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: {
    marginTop: rs(6),
    height: rs(42),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnFlex: { flex: 1, height: rs(44), borderRadius: rd.radius.md, backgroundColor: rd.color.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  dangerBtn: { flex: 1, height: rs(44), borderRadius: rd.radius.md, backgroundColor: rd.color.error, alignItems: 'center', justifyContent: 'center' },
  opHead: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  opTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  opStatus: { fontFamily: rd.font.semibold, fontSize: rs(12) },
  opSub: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text },
  opError: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.error },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(6) },
  action: { paddingHorizontal: rs(12), height: rs(34), borderRadius: rd.radius.pill, backgroundColor: rd.color.surfaceAlt, justifyContent: 'center' },
  actionText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(19,26,42,0.45)', justifyContent: 'center', padding: rs(24) },
  modal: { backgroundColor: rd.color.surface, borderRadius: rd.radius.xl, padding: rs(18), gap: rs(12) },
  modalTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  modalText: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textSecondary, lineHeight: rs(19) },
  modalRow: { flexDirection: 'row', gap: rs(10) },
  input: {
    height: rs(50),
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    fontFamily: rd.font.semibold,
    fontSize: rs(17),
    color: rd.color.text,
  },
});

export default QarzDaftariSinxron;
