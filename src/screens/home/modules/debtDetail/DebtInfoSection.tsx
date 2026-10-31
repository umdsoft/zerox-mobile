import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { WarningIcon } from '../../redesign/icons';
import { fDate, fMoney, num } from '../financeMoney';
import { BLUE, fDateTime, GREEN, RED, ROSE } from './debtDetailLogic';
import { styles } from './debtDetailStyles';
import type { DebtDetailState } from './useDebtDetail';

const Row = ({ label, value, danger, badge }: { label: string; value: string; danger?: boolean; badge?: string }) => (
  <View style={styles.infoRow}>
    <Text allowFontScaling={false} style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoRight}>
      <Text allowFontScaling={false} style={[styles.infoValue, danger && { color: RED }]} numberOfLines={2}>{value}</Text>
      {!!badge && (
        <View style={[styles.badge, { backgroundColor: RED + '16', marginTop: rs(3) }]}>
          <Text allowFontScaling={false} style={[styles.badgeText, { color: RED }]}>{badge}</Text>
        </View>
      )}
    </View>
  </View>
);

/** Summa plitalari, progress, ma'lumot kartasi, ko'zgu tushuntirishi va shikoyat tugmasi. */
const DebtInfoSection = ({ s }: { s: DebtDetailState }) => {
  const { t, d, isMirror, openComplaint } = s;
  const { borrowed, accent, total, paid, remaining, pct, active, overdue, userNote, returnedDate, canComplain } = s.view!;
  return (
    <>
    {/* Summa plitalari */}
    <View style={styles.tiles}>
      <View style={styles.tile}>
        <Text allowFontScaling={false} style={styles.tileLabel}>{t('Jami')}</Text>
        <Text allowFontScaling={false} style={styles.tileVal} numberOfLines={1} adjustsFontSizeToFit>{fMoney(total, d.currency)}</Text>
      </View>
      <View style={styles.tile}>
        <Text allowFontScaling={false} style={styles.tileLabel}>{t('To‘langan')}</Text>
        <Text allowFontScaling={false} style={[styles.tileVal, { color: GREEN }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(paid, d.currency)}</Text>
      </View>
      <View style={styles.tile}>
        <Text allowFontScaling={false} style={styles.tileLabel}>{t('Qoldiq')}</Text>
        <Text allowFontScaling={false} style={[styles.tileVal, { color: borrowed ? RED : BLUE }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(remaining, d.currency)}</Text>
      </View>
    </View>
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: accent }]} />
    </View>
    <Text allowFontScaling={false} style={[styles.pctText, { color: accent }]}>{t('{{p}}% to‘landi', { p: pct })}</Text>

    {/* Ma'lumot (sayt: qarz sanasi, muddat / qaytarilgan sana, izoh) */}
    <View style={styles.infoCard}>
      <Row label={t('Qarz sanasi')} value={fDate(d.start_date || d.created_at) || '—'} />
      {returnedDate ? (
        <Row label={t('Qaytarilgan sana')} value={fDate(returnedDate)} />
      ) : (
        <Row
          label={t('Qaytarish muddati')}
          value={d.due_date ? fDate(d.due_date) : '—'}
          danger={overdue}
          badge={overdue ? t('Muddati o‘tgan') : ''}
        />
      )}
      {num(d.interest_rate) > 0 && <Row label={t('Foiz stavkasi')} value={`${num(d.interest_rate)}%`} />}
      {/* 03.10 (8-rasm): voz kechish avtomatik izohi ("Kechirilgan (voz kechildi)") — tarixda bor, qator yashiriladi */}
      {userNote ? <Row label={isMirror ? t('Mahsulot yoki izoh') : t('Izoh')} value={userNote} /> : null}
      {!!d.created_at && <Row label={t('Qayd etilgan')} value={fDateTime(d.created_at)} />}
    </View>

    {/* SS6: KO'ZGU qarz — tushuntirish (sayt "hamkor qaydi" matnlari).
        03.10 (3-rasm): faqat AMALDAGI qarzda — yopilgan/voz kechilganda amal yo'q, izoh ortiqcha. */}
    {isMirror && active ? (
      <View style={styles.mirrorNote}>
        <Text allowFontScaling={false} style={styles.mirrorNoteTitle}>
          {d.is_shop_debt ? t('👁 Kuzatuv rejimi') : t('🤝 Hamkor qaydi')}
        </Text>
        <Text allowFontScaling={false} style={styles.mirrorNoteText}>
          {d.is_shop_debt
            ? t('Bu qarz do‘kon tomonidan yuritiladi — faqat ko‘rish. Yopish/o‘zgartirish do‘kon egasining qo‘lida.')
            : d.can_operate
            ? t('Bu qarzni «{{name}}» kiritgan — siz qarz beruvchisiz, shuning uchun to‘lov qayd etish, talab qilish va voz kechish sizda.', { name: d.source_name || '' })
            : t('Bu qarzni «{{name}}» kiritgan, shuning uchun uni faqat u o‘zgartira oladi — siz esa ko‘rishingiz mumkin.', { name: d.source_name || '' })}
        </Text>
      </View>
    ) : null}

    {/* SS-DEV (2026-09-24): SHIKOYAT QILISH — do'kon qarzi va hamkor qaydi (men qarzdor). */}
    {canComplain && (
      <TouchableOpacity activeOpacity={0.85} onPress={openComplaint} style={styles.complainBtn}>
        <WarningIcon size={rs(17)} color={ROSE} />
        <Text allowFontScaling={false} style={styles.complainText}>{t('Shikoyat qilish')}</Text>
      </TouchableOpacity>
    )}
    </>
  );
};

export default DebtInfoSection;
