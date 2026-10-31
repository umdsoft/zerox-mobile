import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { ChevronRight } from '../../../redesign/icons';
import { fDate } from '../../financeMoney';
import { canSetVenue, inviteButtonState, mayManageRound } from '../gapDetailLogic';
import type { GapDetail } from '../useGapDetail';
import { styles, TEAL } from '../gapDetailStyles';
import GapPaymentRow from './GapPaymentRow';
import GapRoundCardBox from './GapRoundCardBox';
import { GapAttendance, GapRoundInvite } from './GapRoundNotify';
import GapRoundVenue from './GapRoundVenue';

interface Props {
  d: GapDetail;
  r: Record<string, any>;
  roundKey: string;
  isOpen: boolean;
}

/** Bitta davra: sarlavha (ochib-yopiladi, N7), joy, karta, taklif/ogohlantirish tugmasi, davomat, to'lovlar. */
const GapRoundItem = ({ d, r, roundKey, isOpen }: Props) => {
  const { t } = useTranslation();
  const g = d.g!;
  const canSet = canSetVenue(r, g, d.isOrganizer);
  const invite = inviteButtonState(r, { isOpen, canSet });
  const att = r.attendance;
  const hasAttendance = isOpen && att && ((att.going || []).length || (att.not_going || []).length);
  const mayManage = mayManageRound(r, g, d.isOrganizer);

  return (
    <View style={styles.round}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => d.toggleRound(roundKey, isOpen)}>
        <View style={styles.roundHead}>
          <Text allowFontScaling={false} style={styles.roundNo}>{r.round_no}-{t('davra')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
            <Text allowFontScaling={false} style={styles.roundDate}>{fDate(r.due_date)}</Text>
            <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
              <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
            </View>
          </View>
        </View>
        <Text allowFontScaling={false} style={styles.roundRecipient}>{t('Qabul qiluvchi:')} <Text style={{ fontFamily: rd.font.bold, color: TEAL }}>{r.recipient_name || '—'}</Text></Text>
        <Text allowFontScaling={false} style={styles.roundProgress}>{r.paid_count}/{r.total_count} {t('to‘langan')}</Text>
      </TouchableOpacity>
      {isOpen && (
        <GapRoundVenue r={r} canSet={canSet} onOpenVenue={d.openVenue} onOpenCard={d.openCard} onOpenLocation={d.openLocation} />
      )}
      {isOpen && r.card_number ? (
        <GapRoundCardBox r={r} canSet={canSet} onCopy={d.copyCard} onEdit={d.openCard} />
      ) : null}
      {invite && <GapRoundInvite r={r} asInvite={invite.asInvite} sending={!!d.sendingRounds[String(r.id)]} onInvite={d.sendInvite} />}
      {hasAttendance ? <GapAttendance attendance={att} /> : null}
      {isOpen && (r.payments || []).map((p: any, j: number) => (
        <GapPaymentRow key={p.id ?? j} p={p} mayManage={mayManage} busy={d.busy} onPay={d.pay} onUnpay={d.unpay} />
      ))}
    </View>
  );
};

export default GapRoundItem;
