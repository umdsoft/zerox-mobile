import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles, RED, TEAL } from '../gapDetailStyles';

interface ShellProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Umumiy tasdiq oynasi qobig'i: shaffof fon (bosilsa yopiladi) + confirmCard. */
const ConfirmShell = ({ visible, onClose, children }: ShellProps) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={styles.confirmCard}>{children}</View>
    </View>
  </Modal>
);

interface ButtonsProps {
  cancelLabel: string;
  confirmLabel: string;
  color: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmButtons = ({ cancelLabel, confirmLabel, color, busy, onCancel, onConfirm }: ButtonsProps) => (
  <View style={styles.confirmBtns}>
    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
      <Text style={styles.cancelText}>{cancelLabel}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.confirmDel, { backgroundColor: color }, busy && { opacity: 0.6 }]} disabled={busy} onPress={onConfirm}>
      <Text style={styles.confirmDelText}>{confirmLabel}</Text>
    </TouchableOpacity>
  </View>
);

interface DeleteMemberProps {
  member: Record<string, any> | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** SS12: A'ZONI o'chirish tasdig'i — ilgari savat ikonasi DARHOL o'chirardi. */
export const GapDeleteMemberModal = ({ member, busy, onCancel, onConfirm }: DeleteMemberProps) => {
  const { t } = useTranslation();
  return (
    <ConfirmShell visible={!!member} onClose={onCancel}>
      <Text allowFontScaling={false} style={styles.confirmTitle}>{t('A‘zoni o‘chirish')}</Text>
      <Text allowFontScaling={false} style={styles.confirmText}>
        "{member?.name || member?.phone || 'A‘zo'}" haqiqatda ham gapdan o‘chirilsinmi?
        Bu amalni qaytarib bo‘lmaydi.
      </Text>
      <ConfirmButtons cancelLabel={t('Bekor')} confirmLabel={t('O‘chirish')} color={RED} busy={busy} onCancel={onCancel} onConfirm={onConfirm} />
    </ConfirmShell>
  );
};

interface CoOrgProps {
  coOrg: { member: any; add: boolean } | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** SS6 (2026-09-18): tashkilotchi tayinlash / olib tashlash tasdig'i. */
export const GapCoOrgModal = ({ coOrg, busy, onCancel, onConfirm }: CoOrgProps) => {
  const { t } = useTranslation();
  const name = coOrg?.member?.name || t('A‘zo');
  return (
    <ConfirmShell visible={!!coOrg} onClose={onCancel}>
      <Text allowFontScaling={false} style={styles.confirmTitle}>
        {coOrg?.add ? t('Tashkilotchi qilish') : t('Tashkilotchilikni olib tashlash')}
      </Text>
      <Text allowFontScaling={false} style={styles.confirmText}>
        {coOrg?.add
          ? t('"{{name}}" ham tashkilotchi bo‘ladi: uchrashuv joyi, plastik karta va to‘lovlarni belgilash imkoniga ega bo‘ladi. Istalgan vaqtda olib tashlashingiz mumkin.', { name })
          : t('"{{name}}" endi tashkilotchi bo‘lmaydi.', { name })}
      </Text>
      <ConfirmButtons
        cancelLabel={t('Bekor')}
        confirmLabel={coOrg?.add ? t('Tasdiqlash') : t('Olib tashlash')}
        color={coOrg?.add ? TEAL : RED}
        busy={busy}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </ConfirmShell>
  );
};

interface DeleteGapProps {
  visible: boolean;
  gapName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const GapDeleteGapModal = ({ visible, gapName, busy, onCancel, onConfirm }: DeleteGapProps) => {
  const { t } = useTranslation();
  return (
    <ConfirmShell visible={visible} onClose={onCancel}>
      <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Gapni o‘chirish')}</Text>
      <Text allowFontScaling={false} style={styles.confirmText}>"{gapName}" gapini o‘chirasizmi?</Text>
      <ConfirmButtons cancelLabel={t('Bekor')} confirmLabel={t('O‘chirish')} color={RED} busy={busy} onCancel={onCancel} onConfirm={onConfirm} />
    </ConfirmShell>
  );
};
