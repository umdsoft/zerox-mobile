/**
 * financeDebtUi.tsx — "Shaxsiy qarz" ro'yxat / hisobot sahifalarining UMUMIY UI bo'laklari.
 *
 * 02.10 (mobil hujjat, 3/10b/11-band): sayt sahifalari (pages/finance/debts/list/_kind.vue,
 * report/_side.vue) tarkibi mobilda — FinanceDebtList va FinanceDebtReport ikkalasi ham
 * shu bo'laklardan foydalanadi (nusxa saqlanmaydi):
 *   - DebtToolbar   — qidiruv (FISh / telefon / summa) + "Yuklash" (CSV) + "N ta qarz";
 *   - DebtSvodCards — svod: Jami berilgan (olingan) / Qaytarilgan / Jarayonda (qoldiq)
 *                     yoki yakunlangan hisobotda "Voz kechilgan" (sayt DebtSummaryCards);
 *   - FilterChips   — holat / valyuta tablari (nuqta + son);
 *   - ShowMoreButton — "Yana ko'rsatish (N)".
 * 03.10 (mobil hujjat, 2/4-band): svod — bitta ixcham karta (3 ustun), tablar — bitta qatorli
 * segment, toolbar — ro'yxat boshida ("N ta qarz" + "Yuklash", ostida qidiruv).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { ArrowDown, CloseIcon, SearchIcon } from '../redesign/icons';
import { fMoney } from './financeMoney';
import { DebtSide, DebtSvod, SvodRow } from './financeDebtGroups';

// SearchDebitor "Yuklash" tugmasi bilan bir xil yashil (Excel/CSV).
const EXPORT_GREEN = '#16a34a';
const ROSE = '#be123c';
const AMBER = '#b45309';

// ───────────────────────── Qidiruv + Yuklash ─────────────────────────

/**
 * 03.10 (mobil hujjat, 2/4-band): qidiruv sahifa TEPASIDAN ro'yxat boshiga ko'chirildi —
 * ekranlar uni svod/tablardan KEYIN, qatorlar oldidan joylaydi. Ko'rinish ixcham:
 * 1-qator — "N ta qarz" (ro'yxat sarlavhasi) + kichik "Yuklash"; 2-qator — qidiruv maydoni.
 */
export const DebtToolbar = ({
  search,
  onSearch,
  onDownload,
  count,
  disabled,
}: {
  search: string;
  onSearch: (v: string) => void;
  onDownload: () => void;
  count: number;
  disabled?: boolean;
}) => {
  const { t } = useTranslation();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={styles.toolbar}>
      <View style={styles.toolbarRow}>
        <Text allowFontScaling={false} style={styles.countText} numberOfLines={1}>
          {t('{{n}} ta qarz', { n: count })}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDownload}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabled }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={[styles.downloadBtn, disabled && styles.downloadBtnDisabled]}>
          <ArrowDown size={rs(13)} color={rd.color.onPrimary} />
          <Text allowFontScaling={false} style={styles.downloadText}>
            {t('Yuklash')}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
        <SearchIcon size={rs(16)} color={rd.color.textTertiary} />
        <TextInput
          allowFontScaling={false}
          value={search}
          onChangeText={onSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t('FISh, telefon yoki summa bo‘yicha qidirish...')}
          placeholderTextColor={rd.color.textTertiary}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity
            onPress={() => onSearch('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('Tozalash')}>
            <CloseIcon size={rs(15)} color={rd.color.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

// ───────────────────────── Svod (ixcham) ─────────────────────────

type SvodLine = { currency: string; value: number };

/** Summa + kichikroq valyuta kodi; tor ustunga sig'magsa shrift avtomatik kichrayadi. */
const SvodAmount = ({ line, color }: { line: SvodLine; color: string }) => (
  <Text
    allowFontScaling={false}
    style={[styles.svodAmount, { color }]}
    numberOfLines={1}
    adjustsFontSizeToFit
    minimumFontScale={0.6}>
    {fMoney(line.value, '').trim()}
    <Text style={styles.svodCur}> {line.currency}</Text>
  </Text>
);

const SvodCol = ({
  label,
  dot,
  color,
  lines,
  foot,
  divider,
}: {
  label: string;
  dot: string;
  color: string;
  lines: SvodLine[];
  foot: string;
  divider?: boolean;
}) => (
  <View style={[styles.svodCol, divider && styles.svodColDivider]}>
    <View style={styles.svodLabelRow}>
      <View style={[styles.svodDot, { backgroundColor: dot }]} />
      <Text allowFontScaling={false} style={styles.svodLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </Text>
    </View>
    {lines.map(l => (
      <SvodAmount key={l.currency} line={l} color={color} />
    ))}
    <Text allowFontScaling={false} style={styles.svodFoot} numberOfLines={1}>
      {foot}
    </Text>
  </View>
);

/**
 * Sayt DebtSummaryCards: Jami berilgan (olingan) / Qaytarilgan / Jarayonda (qoldiq) yoki
 * `closedOnly` da Voz kechilgan. Valyutalar ALOHIDA qatorlarda (hech qachon qo'shilmaydi).
 *
 * 03.10 (mobil hujjat, 2/4-band): uchta katta karta ekranning deyarli yarmini egallardi —
 * endi BITTA ixcham karta, 3 ustun (ajratkich chiziq bilan). Faol ro'yxatda voz kechilgan
 * summa (bo'lsa) kartaning pastki bir qatorida.
 */
export const DebtSvodCards = ({
  svod,
  side,
  closedOnly,
}: {
  svod: DebtSvod;
  side: DebtSide;
  closedOnly?: boolean;
}) => {
  const { t } = useTranslation();
  const lent = side === 'lent';
  const tone = lent ? rd.color.primary : rd.color.error;
  const rows: SvodRow[] = svod.rows.length
    ? svod.rows
    : [{ currency: 'UZS', total: 0, paid: 0, left: 0, forgiven: 0 }];
  const pick = (k: 'total' | 'paid' | 'left' | 'forgiven'): SvodLine[] =>
    rows.map(r => ({ currency: r.currency, value: r[k] }));
  const forgivenRows = closedOnly ? [] : svod.rows.filter(r => r.forgiven > 0.5);
  return (
    <View style={styles.svodCard}>
      <View style={styles.svodCols}>
        <SvodCol
          label={lent ? t('Jami berilgan') : t('Jami olingan')}
          dot={tone}
          color={rd.color.text}
          lines={pick('total')}
          foot={t('{{n}} ta qarz', { n: svod.count })}
        />
        <SvodCol
          divider
          label={t('Qaytarilgan')}
          dot={rd.color.success}
          color={rd.color.success}
          lines={pick('paid')}
          foot={t('{{n}} ta yopilgan', { n: svod.closedCount })}
        />
        {closedOnly ? (
          <SvodCol
            divider
            label={t('Voz kechilgan')}
            dot={ROSE}
            color={ROSE}
            lines={pick('forgiven')}
            foot={t('{{n}} ta qarz', { n: svod.forgivenCount })}
          />
        ) : (
          <SvodCol
            divider
            label={t('Jarayonda (qoldiq)')}
            dot={AMBER}
            color={tone}
            lines={pick('left')}
            foot={t('{{n}} ta faol', { n: svod.openCount })}
          />
        )}
      </View>
      {forgivenRows.length ? (
        <View style={styles.svodNote}>
          <View style={[styles.svodDot, { backgroundColor: ROSE }]} />
          <Text
            allowFontScaling={false}
            style={styles.svodNoteText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}>
            {t('Voz kechilgan')}: {forgivenRows.map(r => fMoney(r.forgiven, r.currency)).join(' · ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// ───────────────────────── Tablar (holat / valyuta) ─────────────────────────

export type ChipDef = { key: string; label: string; count: number; dot: string; soft: string; fg: string };

/**
 * 03.10 (mobil hujjat, 2-band): "Barchasi / Tugallangan / Voz kechilgan" ikki qatorga
 * tushardi — endi segment-boshqaruv: BITTA qator, tablar kenglikni bo'lishadi, uzun
 * yozuv sig'magsa shrift biroz kichrayadi (qatorga o'tmaydi).
 */
export const FilterChips = ({
  chips,
  active,
  onChange,
}: {
  chips: ChipDef[];
  active: string;
  onChange: (k: string) => void;
}) => (
  <View style={styles.segment} accessibilityRole="tablist">
    {chips.map(c => {
      const on = c.key === active;
      return (
        <TouchableOpacity
          key={c.key}
          activeOpacity={0.85}
          onPress={() => onChange(c.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: on }}
          style={[styles.segBtn, on && styles.segBtnOn]}>
          <Text
            allowFontScaling={false}
            style={[styles.segText, on ? { color: c.fg } : null]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}>
            {c.label}
          </Text>
          <View style={[styles.segCount, { backgroundColor: on ? c.dot : c.soft }]}>
            <Text allowFontScaling={false} style={[styles.segCountText, { color: on ? '#fff' : c.fg }]}>
              {c.count}
            </Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ───────────────────────── "Yana ko'rsatish" ─────────────────────────

export const ShowMoreButton = ({ rest, onPress }: { rest: number; onPress: () => void }) => {
  const { t } = useTranslation();
  if (rest <= 0) return null;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.moreBtn} accessibilityRole="button">
      <Text allowFontScaling={false} style={styles.moreText}>
        {t('Yana ko‘rsatish')} ({rest})
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 03.10: ixcham toolbar (ro'yxat boshida)
  toolbar: { gap: rs(8), marginBottom: rs(12) },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(10) },
  countText: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.md,
    height: rs(42),
    paddingHorizontal: rs(12),
  },
  searchBoxFocused: { borderColor: rd.color.primary },
  searchInput: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.text,
    paddingVertical: 0,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    height: rs(32),
    paddingHorizontal: rs(12),
    borderRadius: rd.radius.pill,
    backgroundColor: EXPORT_GREEN,
  },
  downloadBtnDisabled: { opacity: 0.5 },
  downloadText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.onPrimary },

  // 03.10: ixcham svod — bitta karta, 3 ustun
  svodCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(12),
    paddingHorizontal: rs(4),
    marginBottom: rs(12),
  },
  svodCols: { flexDirection: 'row' },
  svodCol: { flex: 1, minWidth: 0, paddingHorizontal: rs(8) },
  svodColDivider: { borderLeftWidth: 1, borderLeftColor: rd.color.border },
  svodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginBottom: rs(5) },
  svodDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  svodLabel: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(10.5), color: rd.color.textSecondary },
  svodAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), lineHeight: rs(19) },
  svodCur: { fontFamily: rd.font.medium, fontSize: rs(10) },
  svodFoot: { fontFamily: rd.font.regular, fontSize: rs(10.5), color: rd.color.textTertiary, marginTop: rs(4) },
  svodNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(10),
    marginHorizontal: rs(8),
    paddingTop: rs(8),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  svodNoteText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(11), color: ROSE },

  // 03.10: segment-tablar (bitta qator)
  segment: {
    flexDirection: 'row',
    gap: rs(4),
    padding: rs(3),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    marginBottom: rs(12),
  },
  segBtn: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(5),
    height: rs(34),
    paddingHorizontal: rs(6),
    borderRadius: rs(9),
  },
  segBtnOn: {
    backgroundColor: rd.color.surface,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  segText: { flexShrink: 1, fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  segCount: {
    minWidth: rs(18),
    height: rs(18),
    paddingHorizontal: rs(5),
    borderRadius: rs(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  segCountText: { fontFamily: rd.font.bold, fontSize: rs(10.5) },

  moreBtn: {
    alignSelf: 'center',
    marginTop: rs(4),
    paddingHorizontal: rs(20),
    paddingVertical: rs(10),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  moreText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary },
});
