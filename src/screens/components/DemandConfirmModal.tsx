/**
 * DemandConfirmModal.tsx — 03.10: "Talab SMS yuborilsinmi?" markaziy tasdiq oynasi.
 *
 * Egasining hujjati (5-rasm): "Talab qilish" bosilganda SMS darhol ketmaydi — avval
 * oldin kiritilgan karta (yashirilgan raqam + egasi / bank, Telegram raqami) ko'rsatiladi:
 *   • "Yuborish" (OK) — talab SMS yuboriladi;
 *   • X / fon / orqaga — oyna yopiladi, SMS YUBORILMAYDI;
 *   • "Kartani o'zgartirish" — karta oynasi (qaytilgach shu oyna yangi karta bilan).
 * Tarif qulfida (Free / muddati tugagan) — o'rniga "Tarif cheklovi" oynasi (PlanLimitModal).
 * Ikkala modul (Shaxsiy qarz, Qarz daftari) uchun YAGONA komponent; oqim — useDemandFlow.ts.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { rd, rs } from '../../theme/rd';
import { cardDigits, localBrand } from '../../helper/cardBin';
import { fmtPhoneUzFull } from '../../helper/phone';
import {
  CloseIcon,
  InfoIcon,
  MessageIcon,
  PencilIcon,
} from '../home/redesign/icons';
import type { DemandModalState } from '../home/modules/useDemandFlow';
import PlanLimitModal from '../home/drawer/drawerScreens/PlanLimitModal';

type Props = DemandModalState & {
  /** Karta yo'q bo'lganda (masalan xodim) — nima bo'lishini tushuntiruvchi matn. */
  noCardNote?: string;
};

const BACKDROP = 'rgba(15,23,42,0.45)';
const GRAD_ID = 'demandCardGrad';

/** "8600 •••• •••• 1234" — o'rtadagi 8 raqam yashiriladi. */
const maskCard = (raw: string): string => {
  const d = cardDigits(raw);
  if (d.length < 8) return d;
  return `${d.slice(0, 4)} •••• •••• ${d.slice(-4)}`;
};

const PlasticCard = ({
  number,
  holder,
  bank,
}: {
  number: string;
  holder?: string;
  bank: string;
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.plastic}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={GRAD_ID} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={rd.color.gradient[0]} />
            <Stop offset="1" stopColor={rd.color.gradient[1]} />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#${GRAD_ID})`}
        />
      </Svg>
      <View style={styles.plasticTop}>
        <View style={styles.chip} />
        {!!bank && (
          <Text allowFontScaling={false} style={styles.bank}>
            {bank}
          </Text>
        )}
      </View>
      <Text
        allowFontScaling={false}
        style={styles.cardNumber}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {maskCard(number)}
      </Text>
      <Text allowFontScaling={false} style={styles.holderLabel}>
        {t('Karta egasi')}
      </Text>
      <Text allowFontScaling={false} style={styles.holder} numberOfLines={1}>
        {holder ? holder.toUpperCase() : '—'}
      </Text>
    </View>
  );
};

const DemandConfirmModal = ({
  visible,
  busy,
  card,
  preview,
  canChangeCard,
  onConfirm,
  onClose,
  onChangeCard,
  plan,
  noCardNote,
}: Props) => {
  const { t } = useTranslation();
  const bank = card ? localBrand(card.number) : '';

  return (
    <>
      {/* 03.10: tarif cheklovi (Free / muddati tugagan) — sabab matni + "Tariflarni ko'rish". */}
      <PlanLimitModal
        visible={plan.visible}
        message={plan.message}
        onClose={plan.onClose}
        onUpgrade={plan.onUpgrade}
      />
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel={t('Yopish')}
        >
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <TouchableOpacity
              onPress={onClose}
              disabled={busy}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('Yopish')}
              style={styles.closeBtn}
            >
              <CloseIcon size={rs(16)} color={rd.color.textSecondary} />
            </TouchableOpacity>

            <View style={styles.iconWrap}>
              <MessageIcon size={rs(22)} color={rd.color.warning} />
            </View>
            <Text
              allowFontScaling={false}
              style={styles.title}
              accessibilityRole="header"
            >
              {t('Talab SMS yuborilsinmi?')}
            </Text>
            <Text allowFontScaling={false} style={styles.subtitle}>
              {card
                ? t(
                    'Qarzdorga qarzni qaytarish talabi SMS orqali yuboriladi. SMS’da quyidagi karta ko‘rsatiladi.',
                  )
                : t('Qarzdorga qarzni qaytarish talabi SMS orqali yuboriladi.')}
            </Text>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {card ? (
                <>
                  <PlasticCard
                    number={card.number}
                    holder={card.holder}
                    bank={bank}
                  />
                  {!!card.telegramPhone && (
                    <View style={styles.tgRow}>
                      <Text allowFontScaling={false} style={styles.tgLabel}>
                        {t('Telegram uchun telefon raqami')}
                      </Text>
                      <Text allowFontScaling={false} style={styles.tgValue}>
                        {fmtPhoneUzFull(card.telegramPhone)}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noteBox}>
                  <InfoIcon size={rs(16)} color={rd.color.warning} />
                  <Text allowFontScaling={false} style={styles.noteText}>
                    {noCardNote || t('Plastik karta kiritilmagan.')}
                  </Text>
                </View>
              )}

              {!!preview && (
                <View style={styles.previewBox}>
                  <Text allowFontScaling={false} style={styles.previewLabel}>
                    {t('SMS matni')}
                  </Text>
                  <Text allowFontScaling={false} style={styles.previewText}>
                    {preview}
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onConfirm}
              disabled={busy}
              accessibilityRole="button"
              style={[styles.primaryBtn, busy && styles.btnBusy]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={rd.color.onPrimary} />
              ) : (
                <Text allowFontScaling={false} style={styles.primaryText}>
                  {t('Yuborish')}
                </Text>
              )}
            </TouchableOpacity>
            {canChangeCard && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onChangeCard}
                disabled={busy}
                accessibilityRole="button"
                style={styles.secondaryBtn}
              >
                <PencilIcon size={rs(14)} color={rd.color.primary} />
                <Text allowFontScaling={false} style={styles.secondaryText}>
                  {card ? t('Kartani o‘zgartirish') : t('Karta qo‘shish')}
                </Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default DemandConfirmModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: BACKDROP,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(20),
  },
  sheet: {
    width: '100%',
    maxWidth: rs(420),
    maxHeight: '88%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    paddingHorizontal: rs(18),
    paddingTop: rs(22),
    paddingBottom: rs(14),
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: rs(12),
    right: rs(12),
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconWrap: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    backgroundColor: rd.color.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(10),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    textAlign: 'center',
    marginBottom: rs(6),
    paddingHorizontal: rs(28),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    lineHeight: rs(18),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginBottom: rs(14),
  },
  body: { alignSelf: 'stretch', flexGrow: 0 },
  bodyContent: { paddingBottom: rs(4) },

  plastic: {
    borderRadius: rd.radius.lg,
    overflow: 'hidden',
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    minHeight: rs(128),
  },
  plasticTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(14),
  },
  chip: {
    width: rs(30),
    height: rs(22),
    borderRadius: rs(5),
    backgroundColor: rd.color.onPrimaryChip,
    borderWidth: 1,
    borderColor: rd.color.onPrimaryMuted,
  },
  bank: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.onPrimary,
    letterSpacing: 0.5,
  },
  cardNumber: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.onPrimary,
    letterSpacing: 1.2,
    marginBottom: rs(12),
  },
  holderLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(10),
    color: rd.color.onPrimaryMuted,
  },
  holder: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.onPrimary,
    marginTop: rs(2),
  },

  tgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(8),
    marginTop: rs(10),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
  },
  tgLabel: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  tgValue: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.text,
  },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(8),
    padding: rs(12),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.warningBg,
  },
  noteText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    lineHeight: rs(18),
    color: rd.color.text,
  },

  previewBox: {
    marginTop: rs(10),
    padding: rs(12),
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
  },
  previewLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11),
    color: rd.color.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: rs(4),
  },
  previewText: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    lineHeight: rs(18),
    color: rd.color.text,
  },

  primaryBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: rs(48),
    marginTop: rs(14),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.primary,
  },
  btnBusy: { opacity: 0.7 },
  primaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
  secondaryBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    height: rs(44),
    marginTop: rs(8),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.primaryTint,
  },
  secondaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.primary,
  },
});
