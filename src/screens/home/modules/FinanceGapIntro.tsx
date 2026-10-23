/**
 * FinanceGapIntro.tsx — 22.10 ("Shaxsiy moliya yangi sayt 22.10.2026"): faol Gap
 * bo'lmaganda bo'sh ekran o'rniga Gap imkoniyatlari haqida ma'lumot + "mutlaqo bepul".
 * Bandlar mavjud funksiyalarga mos: navbat/davralar, to'lov kuzatuvi, ogohlantirish,
 * Telegram guruhi (bot /gap_ulash), uchrashuv joyi + karta, tashkilotchilar.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';

const TEAL = '#0d9488';

type Feature = { icon: string; title: string; desc: string };

const FEATURES: Feature[] = [
  {
    icon: '🔄',
    title: 'Navbat va davralar',
    desc: 'A‘zolar navbati avtomatik aniqlanadi; har oy, 15 yoki 10 kunda davralar jadvali tuziladi',
  },
  {
    icon: '✅',
    title: 'To‘lovlar nazorati',
    desc: 'Har davrada kim to‘lagani va kim kutilayotgani bir qarashda ko‘rinadi',
  },
  {
    icon: '🔔',
    title: 'Eslatma va ogohlantirish',
    desc: 'To‘lov vaqti kelganda a‘zolarga xabar yuboriladi',
  },
  {
    icon: '✈️',
    title: 'Telegram guruhi',
    desc: 'Gapni Telegram guruhingizga ulang — bot davralar haqida guruhga yozib boradi',
  },
  {
    icon: '📍',
    title: 'Uchrashuv joyi va karta',
    desc: 'Uchrashuv manzilini xaritada, qabul qiluvchining karta raqamini bitta joyda saqlang',
  },
  {
    icon: '👥',
    title: 'Birgalikda boshqarish',
    desc: 'Ishonchli a‘zoni tashkilotchi qilib, boshqaruvni bo‘lishing',
  },
];

interface Props {
  onCreate: () => void;
}

export default function FinanceGapIntro({ onCreate }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headIcon}>
          <Text style={styles.headEmoji}>💰</Text>
        </View>
        <View style={styles.freeBadge}>
          <Text allowFontScaling={false} style={styles.freeText}>
            {t('Mutlaqo bepul')}
          </Text>
        </View>
      </View>
      <Text allowFontScaling={false} style={styles.title}>
        {t('Gap — do‘stlar va hamkasblar bilan jamg‘arma')}
      </Text>
      <Text allowFontScaling={false} style={styles.lead}>
        {t('Hozircha faol Gap yo‘q. Gap orqali navbatma-navbat pul yig‘ishni oson va shaffof tashkil qilasiz:')}
      </Text>

      <View style={styles.list}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.row}>
            <View style={styles.rowIcon}>
              <Text style={styles.rowEmoji}>{f.icon}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text allowFontScaling={false} style={styles.rowTitle}>
                {t(f.title)}
              </Text>
              <Text allowFontScaling={false} style={styles.rowDesc}>
                {t(f.desc)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.freeNote}>
        <Text allowFontScaling={false} style={styles.freeNoteText}>
          {t('Gap bo‘limidan foydalanish mutlaqo bepul — hech qanday tarif yoki to‘lov talab qilinmaydi.')}
        </Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        style={styles.cta}
        onPress={onCreate}>
        <Text allowFontScaling={false} style={styles.ctaText}>
          {t('Birinchi Gapni yaratish')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginTop: rs(2),
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headIcon: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    backgroundColor: TEAL + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headEmoji: { fontSize: rs(22) },
  freeBadge: {
    backgroundColor: rd.color.successBg,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
  },
  freeText: { fontFamily: rd.font.bold, fontSize: rs(11.5), color: rd.color.success },
  title: { fontFamily: rd.font.bold, fontSize: rs(16.5), color: rd.color.text, marginTop: rs(12) },
  lead: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    lineHeight: rs(19),
    color: rd.color.textSecondary,
    marginTop: rs(6),
  },
  list: { marginTop: rs(14), gap: rs(12) },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(12) },
  rowIcon: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(12),
    backgroundColor: TEAL + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: rs(16) },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  rowDesc: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    lineHeight: rs(17),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  freeNote: {
    marginTop: rs(16),
    backgroundColor: TEAL + '0F',
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: TEAL + '33',
    padding: rs(12),
  },
  freeNoteText: { fontFamily: rd.font.medium, fontSize: rs(12.5), lineHeight: rs(18), color: TEAL },
  cta: {
    marginTop: rs(14),
    height: rs(48),
    borderRadius: rd.radius.md,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
