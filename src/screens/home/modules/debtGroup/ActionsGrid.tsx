import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { CheckIcon, ClockIcon, HandCoinReturnIcon, LockIcon, PlusIcon } from '../../redesign/icons';
import DebtActionButton, { PASTEL } from '../DebtActionButton';
import { BanIcon } from '../FinanceDebtActionModal';
import type { Side } from './debtGroupLogic';
import { styles } from './debtGroupStyles';

interface ActionsGridProps {
  side: Side;
  isShop: boolean;
  /** Amal qilish mumkin bo'lgan ochiq qarzlar soni. */
  actionCount: number;
  demandTarget: boolean;
  demanding: boolean;
  demandLocked: boolean;
  addDebt: (initialType: 'lent' | 'borrowed') => void;
  openAct: (mode: 'close' | 'pay' | 'forgive') => void;
  onDemand: () => void;
}

/** Sayt tartibidagi pastel amal tugmalari: berilgan -> 4 ta, olingan -> 2 ta, noma'lum -> Qarz berish/olish. */
const ActionsGrid = ({
  side,
  isShop,
  actionCount,
  demandTarget,
  demanding,
  demandLocked,
  addDebt,
  openAct,
  onDemand,
}: ActionsGridProps) => {
  const { t } = useTranslation();
  if (isShop) return null;
  const noAct = !actionCount;
  if (side === 'lent') {
    return (
      <View style={styles.actGrid}>
        <DebtActionButton label={t('Yana qarz berish')} tone="blue" icon={<PlusIcon size={rs(15)} color={PASTEL.blue.fg} />} onPress={() => addDebt('lent')} />
        <DebtActionButton
          label={t('Qarzni yopish')}
          tone="green"
          disabled={noAct}
          icon={<CheckIcon size={rs(15)} color={noAct ? PASTEL.off.fg : PASTEL.green.fg} strokeWidth={2.6} />}
          onPress={() => openAct('close')}
        />
        <DebtActionButton
          label={demanding ? t('Yuborilmoqda...') : t('Talab qilish')}
          tone="yellow"
          disabled={!demandTarget}
          icon={<ClockIcon size={rs(15)} color={!demandTarget ? PASTEL.off.fg : PASTEL.yellow.fg} />}
          trailing={demandLocked ? <LockIcon size={rs(13)} color={!demandTarget ? PASTEL.off.fg : PASTEL.yellow.fg} /> : null}
          onPress={onDemand}
        />
        <DebtActionButton
          label={t('Voz kechish')}
          tone="red"
          disabled={noAct}
          icon={<BanIcon size={rs(15)} color={noAct ? PASTEL.off.fg : PASTEL.red.fg} strokeWidth={2.4} />}
          onPress={() => openAct('forgive')}
        />
      </View>
    );
  }
  if (side === 'borrowed') {
    return (
      <View style={styles.actGrid}>
        <DebtActionButton label={t('Yana qarz olish')} tone="blue" icon={<PlusIcon size={rs(15)} color={PASTEL.blue.fg} />} onPress={() => addDebt('borrowed')} />
        <DebtActionButton
          label={t('Qarzni qaytarish')}
          tone="green"
          disabled={noAct}
          icon={<HandCoinReturnIcon size={rs(15)} color={noAct ? PASTEL.off.fg : PASTEL.green.fg} />}
          onPress={() => openAct('pay')}
        />
      </View>
    );
  }
  return (
    <View style={styles.actGrid}>
      <DebtActionButton label={t('Qarz berish')} tone="green" icon={<PlusIcon size={rs(15)} color={PASTEL.green.fg} />} onPress={() => addDebt('lent')} />
      <DebtActionButton label={t('Qarz olish')} tone="red" icon={<PlusIcon size={rs(15)} color={PASTEL.red.fg} />} onPress={() => addDebt('borrowed')} />
    </View>
  );};

export default ActionsGrid;
