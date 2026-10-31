import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClockIcon,
  HandCoinReturnIcon,
  CheckIcon,
  LockIcon,
  MessageIcon,
  PhoneCallIcon,
  PhoneIcon,
  PlusIcon,
  StorefrontIcon,
  TrashIcon,
  UserIcon,
} from '../../redesign/icons';
import DebtActionButton, { pastelFg } from '../DebtActionButton';
import { BanIcon } from '../FinanceDebtActionModal';
import { fDate } from '../financeMoney';
import { styles } from './debtDetailStyles';
import type { DebtDetailState } from './useDebtDetail';

/** SARLAVHA: kim + tur + holat; amallar (holatga qarab, sayt pastel tugmalari); kontragent sahifasidan kirilganda — tur + qarz sanasi. */
const DebtHeadCard = ({ s }: { s: DebtDetailState }) => {
  const { t, d, hideParty, payoutCard, demandLocked, demanding } = s;
  const { borrowed, accent, status, shopAddress, partyPhone, completed, remaining, settleTitle } = s.view!;
  const { showMore, showSettle, showDemand, showForgiveBtn, showDelete, hasActions } = s.flags!;
  const PartyIcon = d.is_shop_debt ? StorefrontIcon : UserIcon;
  const { setShowSms, sendSms, openPay, demandRepay, addMore, setShowForgive, setShowDel } = s;
  return (
    <View style={styles.headCard}>
      <View style={styles.headTop}>
        <View style={[styles.avatar, { backgroundColor: accent + '16' }]}>
          {hideParty ? (
            borrowed ? (
              <ArrowDownLeft size={rs(22)} color={accent} />
            ) : (
              <ArrowUpRight size={rs(22)} color={accent} />
            )
          ) : (
            <PartyIcon size={rs(22)} color={accent} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.headName} numberOfLines={2}>
            {hideParty ? (borrowed ? t('Olingan qarz') : t('Berilgan qarz')) : d.source_name}
          </Text>
          {hideParty ? (
            <Text allowFontScaling={false} style={styles.headSub}>
              {t('Qarz sanasi')}: {fDate(d.start_date || d.created_at)}
            </Text>
          ) : null}
          <View style={styles.headMeta}>
            {!hideParty && (
              <View style={[styles.badge, { backgroundColor: accent + '16' }]}>
                <Text allowFontScaling={false} style={[styles.badgeText, { color: accent }]}>
                  {borrowed ? t('Olingan qarz') : t('Berilgan qarz')}
                </Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: status.color + '16' }]}>
              <Text allowFontScaling={false} style={[styles.badgeText, { color: status.color }]}>{status.text}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SS-DEV (2026-09-24): do'kon manzili va telefon nom ostida */}
      {!!shopAddress && !hideParty && d.is_shop_debt && (
        <View style={styles.phoneRow}>
          <StorefrontIcon size={rs(15)} color={rd.color.textTertiary} />
          <Text allowFontScaling={false} style={styles.phoneText} numberOfLines={2}>{shopAddress}</Text>
        </View>
      )}
      {!!partyPhone && !hideParty && (
        <View style={styles.phoneRow}>
          <PhoneIcon size={rs(15)} color={rd.color.textTertiary} />
          <Text allowFontScaling={false} style={styles.phoneText} numberOfLines={1}>{partyPhone}</Text>
          <View style={styles.phoneActions}>
            {/* 03.10 (7-rasm): yopilgan (qoldiq 0) qarzda shablon kerak emas — SMS ilovasi bo'sh matn bilan */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => (completed || remaining <= 0 ? sendSms() : setShowSms(true))}
              style={styles.smsBtn}
              accessibilityLabel={t('SMS yuborish')}>
              <MessageIcon size={rs(15)} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => Linking.openURL(`tel:${partyPhone.replace(/\s/g, '')}`).catch(() => {})}
              style={styles.callBtn}
              accessibilityLabel={t('Qo‘ng‘iroq qilish')}>
              <PhoneCallIcon size={rs(15)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 02.10: AMALLAR — holatga qarab (sayt pastel tugmalari) */}
      {hasActions && (
        <View style={styles.actGrid}>
          {showMore && (
            <DebtActionButton
              label={borrowed ? t('Yana qarz olish') : t('Yana qarz berish')}
              tone="blue"
              icon={<PlusIcon size={rs(15)} color={pastelFg('blue')} />}
              onPress={addMore}
            />
          )}
          {showSettle && (
            <DebtActionButton
              label={settleTitle}
              tone="green"
              icon={
                borrowed ? (
                  <HandCoinReturnIcon size={rs(15)} color={pastelFg('green')} />
                ) : (
                  <CheckIcon size={rs(15)} color={pastelFg('green')} strokeWidth={2.6} />
                )
              }
              onPress={openPay}
            />
          )}
          {showDemand && (
            <DebtActionButton
              label={demanding ? t('Yuborilmoqda...') : t('Talab qilish')}
              tone="yellow"
              icon={<ClockIcon size={rs(15)} color={pastelFg('yellow')} />}
              trailing={demandLocked ? <LockIcon size={rs(13)} color={pastelFg('yellow')} /> : null}
              onPress={demandRepay}
            />
          )}
          {showForgiveBtn && (
            <DebtActionButton
              label={t('Voz kechish')}
              tone="red"
              icon={<BanIcon size={rs(15)} color={pastelFg('red')} strokeWidth={2.4} />}
              onPress={() => setShowForgive(true)}
            />
          )}
          {showDelete && (
            <DebtActionButton
              label={t('O‘chirish')}
              tone="red"
              icon={<TrashIcon size={rs(15)} color={pastelFg('red')} />}
              onPress={() => setShowDel(true)}
            />
          )}
        </View>
      )}
      {showDemand && payoutCard && !payoutCard.ready && (
        <Text allowFontScaling={false} style={styles.demandHint}>
          {t('Talab qilish uchun avval plastik karta ma’lumotlaringizni kiriting.')}
        </Text>
      )}
    </View>
  );
};

export default DebtHeadCard;
