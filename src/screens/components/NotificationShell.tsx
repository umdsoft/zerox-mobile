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
import { normalize, tokens } from '../../theme/tokens';
import TextBold from './TextBold';

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
}

const SmallButton = ({
  label,
  onPress,
  color,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.8}
    style={[styles.btn, color ? { backgroundColor: color } : null]}
  >
    {loading ? (
      <ActivityIndicator color={tokens.color.onPrimary} size="small" />
    ) : (
      <Text allowFontScaling={false} style={styles.btnText}>
        {label}
      </Text>
    )}
  </TouchableOpacity>
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
        <View>
          <TextBold>{title}</TextBold>
        </View>
        <View style={styles.body}>
          {children}

          {hasChoice ? (
            <>
              <View style={styles.dateWrap}>{dateRow}</View>
              <View style={styles.choiceRow}>
                <SmallButton
                  label={t('93') as string}
                  onPress={() => run('accept', onAccept)}
                  loading={busy === 'accept'}
                  disabled={!onAccept || !!busy}
                />
                <SmallButton
                  label={t('96') as string}
                  color={tokens.color.danger}
                  onPress={() => run('reject', onReject)}
                  loading={busy === 'reject'}
                  disabled={!onReject || !!busy}
                />
              </View>
            </>
          ) : (
            <View style={styles.inlineRow}>
              {dateRow}
              {onOk ? <SmallButton label={okLabel} onPress={onOk} /> : null}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.surface,
    width: '95%',
    alignSelf: 'center',
    marginTop: tokens.spacing.lg,
    borderRadius: normalize(10),
    shadowColor: tokens.color.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },
  inner: { marginVertical: normalize(15), marginHorizontal: normalize(15) },
  body: { marginTop: normalize(10) },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateWrap: { marginTop: normalize(10), flexDirection: 'row' },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: normalize(10),
  },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(10),
  },
  meta: {
    fontSize: tokens.fontSize.xx - 2,
    fontFamily: tokens.font.medium,
    color: tokens.color.onSurface,
  },
  btn: {
    backgroundColor: tokens.color.primary,
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(5),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: normalize(60),
  },
  btnText: {
    fontSize: tokens.fontSize.xx - 2,
    fontFamily: tokens.font.medium,
    color: tokens.color.onPrimary,
  },
});

export default NotificationShell;
