/**
 * NotificationShell — ~25 bildirishnoma ekranidagi BIR XIL qobiq (chrome).
 *
 * Har bir bildirishnoma kloni shu strukturani qayta yozardi:
 *   karta + sarlavha (TextBold) + body + sana qatori + tugma(lar).
 * Endi qobiq SHU YERDA; har klon FAQAT o'z body'sini (TransText — moliyaviy matn,
 * o'zgartirilmaydi) + handler'larini beradi:
 *
 *   <NotificationShell title={t('510')} date={item.created} time={item.time} onOk={onOkay}>
 *     <TransText ... />
 *   </NotificationShell>
 *
 *   // accept/reject (loading avtomatik):
 *   <NotificationShell title={...} date time onAccept={() => onToliqQaytgan(item,1)} onReject={() => onToliqQaytgan(item,2)}>
 *     <TransText ... />
 *   </NotificationShell>
 */
import { t } from 'i18next';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { rd, rs } from '../../theme/rd';
import { BellIcon } from '../home/redesign/icons';

type Busy = null | 'accept' | 'reject';

interface NotificationShellProps {
  title: string;
  date?: string;
  time?: string;
  children: React.ReactNode; // body (TransText) — klonniki, o'zgarmaydi
  onOk?: () => void;
  onAccept?: () => void | Promise<any>;
  onReject?: () => void | Promise<any>;
  okLabel?: string;
  actions?: React.ReactNode; // custom tugma(lar) — standart ok/accept/reject o'rniga (edge'lar uchun)
}

type Variant = 'primary' | 'danger' | 'ghost';

// Barcha bildirishnoma tugmalari uchun YAGONA komponent — bir xil ko'rinish.
// variant: primary (ko'k to'la), danger (qizil to'la), ghost (och fon, ikkilamchi).
export const NotifButton = ({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  wide = true,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  wide?: boolean;
}) => {
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        wide && styles.btnWide,
        variant === 'danger' && styles.btnDanger,
        isGhost && styles.btnGhost,
        (disabled || loading) && styles.btnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isGhost ? rd.color.textSecondary : rd.color.onPrimary}
          size="small"
        />
      ) : (
        <Text
          allowFontScaling={false}
          style={[styles.btnText, isGhost && styles.btnTextGhost]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Ichki moslik (accept/reject) uchun alias.
const SmallButton = ({
  label,
  onPress,
  color,
  loading,
  disabled,
  wide,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  wide?: boolean;
}) => (
  <NotifButton
    label={label}
    onPress={onPress}
    variant={color === rd.color.error ? 'danger' : 'primary'}
    loading={loading}
    disabled={disabled}
    wide={wide}
  />
);

const NotificationShell: React.FC<NotificationShellProps> = ({
  title,
  date,
  time,
  children,
  onOk,
  onAccept,
  onReject,
  okLabel = 'Ok',
  actions,
}) => {
  const [busy, setBusy] = useState<Busy>(null);
  const hasChoice = !!(onAccept || onReject);

  const run = (which: Busy, fn?: () => void | Promise<any>) => {
    if (!fn || busy) return;
    const r = fn();
    if (r && typeof (r as any).then === 'function') {
      setBusy(which);
      (r as Promise<any>).finally(() => setBusy(null));
    }
  };

  const dateRow = (
    <View style={styles.dateRow}>
      {date ? (
        <Text allowFontScaling={false} style={styles.meta}>
          {date}{' '}
        </Text>
      ) : null}
      {time ? (
        <Text allowFontScaling={false} style={styles.meta}>
          {' '}
          {String(time).slice(0, 5)}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <BellIcon size={rs(18)} color={rd.color.primary} />
          </View>
          <Text allowFontScaling={false} style={styles.title}>
            {title}
          </Text>
        </View>
        <View style={styles.body}>
          {children}

          {actions ? (
            <>
              <View style={styles.dateWrap}>{dateRow}</View>
              <View style={styles.choiceRow}>{actions}</View>
            </>
          ) : hasChoice ? (
            <>
              <View style={styles.dateWrap}>{dateRow}</View>
              <View style={styles.choiceRow}>
                <SmallButton
                  label={t('93') as string}
                  wide
                  onPress={() => run('accept', onAccept)}
                  loading={busy === 'accept'}
                  disabled={!onAccept || !!busy}
                />
                <SmallButton
                  label={t('96') as string}
                  color={rd.color.error}
                  wide
                  onPress={() => run('reject', onReject)}
                  loading={busy === 'reject'}
                  disabled={!onReject || !!busy}
                />
              </View>
            </>
          ) : (
            <View style={styles.inlineRow}>
              {dateRow}
              {onOk ? (
                <NotifButton label={okLabel} onPress={onOk} wide={false} />
              ) : null}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.surface,
    width: '100%',
    alignSelf: 'center',
    marginTop: rs(12),
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  inner: { marginVertical: rs(14), marginHorizontal: rs(14) },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  iconCircle: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
    lineHeight: rs(20),
  },
  body: { marginTop: rs(8) },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateWrap: { marginTop: rs(10), flexDirection: 'row' },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12),
  },
  choiceRow: {
    flexDirection: 'row',
    gap: rs(10),
    alignItems: 'center',
    marginTop: rs(12),
  },
  meta: {
    fontSize: rs(12),
    fontFamily: rd.font.regular,
    color: rd.color.textTertiary,
  },
  btn: {
    backgroundColor: rd.color.primary,
    paddingHorizontal: rs(22),
    height: rs(38),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: rs(72),
  },
  btnWide: { flex: 1 },
  btnDanger: { backgroundColor: rd.color.error },
  btnGhost: {
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontSize: rs(13.5),
    fontFamily: rd.font.semibold,
    color: rd.color.onPrimary,
  },
  btnTextGhost: { color: rd.color.textSecondary },
});

export default NotificationShell;
