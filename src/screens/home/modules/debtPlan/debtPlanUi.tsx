/**
 * debtPlanUi.tsx — "Qarzdan chiqish" ekranlari uchun umumiy UI bo'laklari (redizayn rd/rs).
 * Karta, bo'lim sarlavhasi, segment, stepper, raqam maydoni, progress, tasdiq oynasi,
 * surgich (PanResponder — kutubxonasiz) va xato qutisi.
 */
import React from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import { InfoIcon, WarningIcon } from '../../redesign/icons';

// Modul aksenti — "qarzsiz hayot" yashili.
export const DP = {
  accent: '#059669',
  accentStrong: '#047857',
  tint: '#e8f8f1',
  grad: ['#059669', '#2f6fed'] as const,
  warn: '#d97706',
  warnBg: '#fff7e6',
  danger: '#dc2626',
  dangerBg: '#fdecec',
  track: '#eef2f7',
};

export { Grad } from '../../../../components/ui/Grad';

export const Card = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[ui.card, style]}>{children}</View>
);

export const SectionTitle = ({ text, color = DP.accent, right }: { text: string; color?: string; right?: React.ReactNode }) => (
  <View style={ui.sectionRow}>
    <View style={[ui.sectionBar, { backgroundColor: color }]} />
    <Text allowFontScaling={false} style={ui.sectionText} numberOfLines={1}>
      {text}
    </Text>
    {right}
  </View>
);

export const Badge = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
  <View style={[ui.badge, { backgroundColor: bg }]}>
    <Text allowFontScaling={false} style={[ui.badgeText, { color }]} numberOfLines={1}>
      {text}
    </Text>
  </View>
);

export const ProgressBar = ({ pct, color = DP.accent, height = rs(7) }: { pct: number; color?: string; height?: number }) => (
  <View style={[ui.track, { height, borderRadius: height / 2 }]}>
    <View
      style={{
        width: `${Math.max(0, Math.min(100, pct))}%`,
        height: '100%',
        borderRadius: height / 2,
        backgroundColor: color,
      }}
    />
  </View>
);

export type SegOption<T> = { value: T; label: string };
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  accent = DP.accent,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  accent?: string;
}) {
  return (
    <View style={ui.seg}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={String(o.value)}
            activeOpacity={0.85}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[ui.segBtn, active && { backgroundColor: rd.color.surface, borderColor: accent }]}>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[ui.segText, active && { color: accent }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const Chip = ({
  label,
  active,
  onPress,
  accent = DP.accent,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent?: string;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    style={[ui.chip, active && { backgroundColor: accent, borderColor: accent }]}>
    <Text allowFontScaling={false} style={[ui.chipText, active && { color: rd.color.onPrimary }]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const Stepper = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  format,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  label?: string;
}) => {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <View style={ui.stepper}>
      <TouchableOpacity
        style={ui.stepBtn}
        onPress={() => set(value - step)}
        disabled={value <= min}
        accessibilityRole="button"
        accessibilityLabel={`${label || ''} −`}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Text allowFontScaling={false} style={[ui.stepSign, value <= min && ui.dim]}>
          −
        </Text>
      </TouchableOpacity>
      <Text allowFontScaling={false} style={ui.stepValue} numberOfLines={1}>
        {format ? format(value) : value}
      </Text>
      <TouchableOpacity
        style={ui.stepBtn}
        onPress={() => set(value + step)}
        disabled={value >= max}
        accessibilityRole="button"
        accessibilityLabel={`${label || ''} +`}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Text allowFontScaling={false} style={[ui.stepSign, value >= max && ui.dim]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/** Kichik raqam maydoni (%, oy, kun) — bo'sh qoldirsa null. */
export const NumField = ({
  value,
  onChange,
  suffix,
  placeholder,
  decimals = false,
  max,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  suffix?: string;
  placeholder?: string;
  decimals?: boolean;
  max?: number;
}) => {
  const [text, setText] = React.useState(value == null ? '' : String(value).replace('.', ','));
  React.useEffect(() => {
    const cur = text.replace(',', '.');
    if ((value == null && cur !== '') || (value != null && Number(cur) !== value)) {
      setText(value == null ? '' : String(value).replace('.', ','));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <View style={ui.numWrap}>
      <TextInput
        style={ui.numInput}
        value={text}
        keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
        placeholder={placeholder || '0'}
        placeholderTextColor={rd.color.textTertiary}
        allowFontScaling={false}
        onChangeText={raw => {
          const cleaned = decimals
            ? raw.replace(/[^0-9.,]/g, '').replace(/([.,].*)[.,]/g, '$1')
            : raw.replace(/[^0-9]/g, '');
          setText(cleaned);
          if (!cleaned) return onChange(null);
          let v = Number(cleaned.replace(',', '.'));
          if (!Number.isFinite(v)) return;
          if (max != null && v > max) v = max;
          onChange(v);
        }}
      />
      {suffix ? (
        <Text allowFontScaling={false} style={ui.numSuffix}>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
};

export const Label = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <View style={ui.labelWrap}>
    <Text allowFontScaling={false} style={ui.label}>
      {children}
    </Text>
    {hint ? <Text style={ui.labelHint}>{hint}</Text> : null}
  </View>
);

export const HelpBox = ({ title, text, tone = 'info' }: { title?: string; text: string; tone?: 'info' | 'warn' | 'danger' }) => {
  const c = tone === 'danger' ? DP.danger : tone === 'warn' ? DP.warn : rd.color.primary;
  const bg = tone === 'danger' ? DP.dangerBg : tone === 'warn' ? DP.warnBg : rd.color.primaryTint;
  const Icon = tone === 'info' ? InfoIcon : WarningIcon;
  return (
    <View style={[ui.help, { backgroundColor: bg }]}>
      <Icon size={rs(17)} color={c} />
      <View style={{ flex: 1 }}>
        {title ? <Text style={[ui.helpTitle, { color: tone === 'info' ? rd.color.text : c }]}>{title}</Text> : null}
        <Text style={ui.helpText}>{text}</Text>
      </View>
    </View>
  );
};

export const PrimaryButton = ({
  label,
  onPress,
  busy,
  disabled,
  color = DP.accent,
  style,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    disabled={busy || disabled}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ disabled: !!(busy || disabled), busy: !!busy }}
    style={[ui.primary, { backgroundColor: color }, (busy || disabled) && ui.dimBtn, style]}>
    {busy ? (
      <ActivityIndicator color={rd.color.onPrimary} />
    ) : (
      <Text allowFontScaling={false} style={ui.primaryText}>
        {label}
      </Text>
    )}
  </TouchableOpacity>
);

export const GhostButton = ({
  label,
  onPress,
  color = DP.accent,
  style,
  Icon,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  Icon?: (p: { size?: number; color?: string }) => React.ReactElement;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityRole="button"
    style={[ui.ghost, { borderColor: color + '55' }, style]}>
    {Icon ? <Icon size={rs(17)} color={color} /> : null}
    <Text allowFontScaling={false} style={[ui.ghostText, { color }]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const ErrorBox = ({ onRetry, text }: { onRetry: () => void; text?: string }) => (
  <View style={ui.errorBox}>
    <WarningIcon size={rs(30)} color={rd.color.textTertiary} />
    <Text style={ui.errorText}>{text || t('Ma’lumotni yuklab bo‘lmadi')}</Text>
    <TouchableOpacity activeOpacity={0.85} style={ui.retryBtn} onPress={onRetry} accessibilityRole="button">
      <Text style={ui.retryText}>{t('Qayta urinish')}</Text>
    </TouchableOpacity>
  </View>
);

/** Tasdiq oynasi (pastdan chiquvchi karta). */
export const ConfirmModal = ({
  visible,
  title,
  text,
  children,
  confirmText,
  onConfirm,
  onCancel,
  busy,
  color = DP.accent,
}: {
  visible: boolean;
  title: string;
  text?: string;
  children?: React.ReactNode;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  color?: string;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={ui.overlay}>
      <View style={ui.sheet}>
        <Text style={ui.sheetTitle}>{title}</Text>
        {text ? <Text style={ui.sheetText}>{text}</Text> : null}
        {children}
        <View style={ui.sheetRow}>
          <TouchableOpacity
            style={ui.cancelBtn}
            activeOpacity={0.85}
            onPress={onCancel}
            disabled={busy}
            accessibilityRole="button">
            <Text allowFontScaling={false} style={ui.cancelText}>
              {t('Bekor qilish')}
            </Text>
          </TouchableOpacity>
          <PrimaryButton label={confirmText} onPress={onConfirm} busy={busy} color={color} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  </Modal>
);

/**
 * Surgich (0..max, qadam bilan). Kutubxona yo'q — PanResponder. Tegish/tortish
 * joyidan qiymat hisoblanadi; `onChange` har qadam o'zgarishida chaqiriladi.
 */
export const Slider = ({
  value,
  max,
  step,
  onChange,
  color = DP.accent,
  accessibilityLabel,
}: {
  value: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color?: string;
  accessibilityLabel?: string;
}) => {
  const width = React.useRef(1);
  const startX = React.useRef(0);
  const cb = React.useRef(onChange);
  cb.current = onChange;
  const toValue = (x: number) => {
    const ratio = Math.max(0, Math.min(1, x / width.current));
    return Math.round((ratio * max) / step) * step;
  };
  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: e => {
          startX.current = e.nativeEvent.locationX;
          cb.current(toValue(startX.current));
        },
        onPanResponderMove: (_e, g) => cb.current(toValue(startX.current + g.dx)),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [max, step],
  );
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <View
      style={ui.sliderHit}
      onLayout={(e: LayoutChangeEvent) => {
        width.current = Math.max(1, e.nativeEvent.layout.width);
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + step));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(0, value - step));
      }}
      {...pan.panHandlers}>
      <View style={ui.sliderTrack} pointerEvents="none">
        <View style={[ui.sliderFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <View pointerEvents="none" style={[ui.sliderThumb, { left: `${pct}%`, borderColor: color }]} />
    </View>
  );
};

export const ui = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(8), marginBottom: rs(10) },
  sectionBar: { width: rs(4), height: rs(18), borderRadius: rs(2) },
  sectionText: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  badge: { borderRadius: rs(8), paddingHorizontal: rs(8), paddingVertical: rs(3), alignSelf: 'flex-start' },
  badgeText: { fontFamily: rd.font.bold, fontSize: rs(11) },
  track: { backgroundColor: DP.track, overflow: 'hidden' },

  seg: {
    flexDirection: 'row',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rs(12),
    padding: rs(3),
    gap: rs(3),
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(9),
    paddingHorizontal: rs(4),
    borderRadius: rs(10),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },

  chip: {
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(7),
  },
  chipText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    overflow: 'hidden',
  },
  stepBtn: { width: rs(42), height: rs(42), alignItems: 'center', justifyContent: 'center' },
  stepSign: { fontFamily: rd.font.bold, fontSize: rs(20), color: DP.accent },
  stepValue: { flex: 1, textAlign: 'center', fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  dim: { opacity: 0.3 },

  numWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(12),
  },
  numInput: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text, paddingVertical: rs(10) },
  numSuffix: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textTertiary, marginLeft: rs(6) },

  labelWrap: { marginTop: rs(10), marginBottom: rs(6) },
  label: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary },
  labelHint: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2), lineHeight: rs(16) },

  help: { flexDirection: 'row', gap: rs(10), borderRadius: rd.radius.lg, padding: rs(12), marginBottom: rs(12) },
  helpTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), marginBottom: rs(3) },
  helpText: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, lineHeight: rs(18) },

  primary: {
    height: rs(50),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(16),
  },
  primaryText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.onPrimary },
  dimBtn: { opacity: 0.55 },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(7),
    height: rs(46),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(12),
  },
  ghostText: { fontFamily: rd.font.semibold, fontSize: rs(13.5) },

  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(24), gap: rs(14) },
  errorText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: rd.color.primary, borderRadius: rd.radius.md, paddingHorizontal: rs(20), paddingVertical: rs(10) },
  retryText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.onPrimary },

  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: rd.color.surface,
    borderTopLeftRadius: rd.radius.huge,
    borderTopRightRadius: rd.radius.huge,
    padding: rs(20),
    paddingBottom: rs(28),
  },
  sheetTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  sheetText: { fontFamily: rd.font.regular, fontSize: rs(13.5), color: rd.color.textSecondary, marginTop: rs(6), lineHeight: rs(19) },
  sheetRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(18) },
  cancelBtn: {
    flex: 1,
    height: rs(50),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },

  sliderHit: { height: rs(36), justifyContent: 'center' },
  sliderTrack: { height: rs(8), borderRadius: rs(4), backgroundColor: DP.track, overflow: 'hidden' },
  sliderFill: { height: '100%' },
  sliderThumb: {
    position: 'absolute',
    width: rs(26),
    height: rs(26),
    marginLeft: -rs(13),
    borderRadius: rs(13),
    backgroundColor: rd.color.surface,
    borderWidth: 3,
  },
});
