import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { ChevronRight } from '../../../redesign/icons';
import type { GapDetail } from '../useGapDetail';
import { styles, TEAL } from '../gapDetailStyles';
import GapAddMemberForm from './GapAddMemberForm';
import GapMemberRow from './GapMemberRow';

const ORDER_MODES = [['random', '🎲 Tasodifiy'], ['manual', '✋ O‘zimiz tanlaymiz']] as const;

/** A'zolar akkordeoni (R17): sarlavha + PDF, navbat rejimi (SS11), a'zolar ro'yxati, "A'zo qo'shish" formasi. */
const GapMembersCard = ({ d }: { d: GapDetail }) => {
  const { t } = useTranslation();
  const { g, members, isDraft, isOrganizer, membersOpen, orderMode, effectiveOrder } = d;
  const draftOrganizer = isDraft && isOrganizer;
  const manual = orderMode === 'manual' && draftOrganizer;
  const list = manual ? effectiveOrder : members;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => d.setMembersOpen(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text allowFontScaling={false} style={[styles.cardTitle, { marginBottom: 0 }]}>{t('A‘zolar')} ({members.length})</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(10) }}>
          {/* SS6 (2026-09-18): navbat tartibi va to'lov holati PDF — saytdagi/botdagi bilan AYNAN bir manba. */}
          <TouchableOpacity style={styles.pdfBtn} onPress={d.sharePdf} disabled={d.pdfBusy} accessibilityLabel="PDF ulashish">
            <Text allowFontScaling={false} style={styles.pdfBtnText}>{d.pdfBusy ? '…' : '📄 PDF'}</Text>
          </TouchableOpacity>
          <View style={{ transform: [{ rotate: membersOpen ? '90deg' : '0deg' }] }}>
            <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
          </View>
        </View>
      </TouchableOpacity>
      {/* SS11: NAVBAT REJIMI — faqat gap BOSHLANMASDAN oldin va faqat tashkilotchiga ko'rinadi. */}
      {membersOpen && draftOrganizer && (
        <View style={styles.orderModeRow}>
          {ORDER_MODES.map(([k, label]) => {
            const on = orderMode === k;
            return (
              <TouchableOpacity
                key={k}
                activeOpacity={0.85}
                onPress={() => d.setOrderMode(k)}
                style={[styles.orderModeBtn, on && { backgroundColor: TEAL, borderColor: TEAL }]}>
                <Text allowFontScaling={false} style={[styles.orderModeText, on && { color: '#fff' }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {membersOpen && list.map((m, i) => (
        <GapMemberRow
          key={m.id ?? i}
          m={m}
          index={i}
          g={g!}
          orderNo={manual ? i + 1 : (m.turn_order || i + 1)}
          manual={manual}
          isFirst={i === 0}
          isLast={i === effectiveOrder.length - 1}
          canDelete={draftOrganizer && m.id !== g!.my_member_id}
          onMove={d.moveMember}
          onCoOrg={(member, add) => d.setCoOrg({ member, add })}
          onDelete={d.setDelMember}
        />
      ))}
      {membersOpen && draftOrganizer && (
        <GapAddMemberForm
          name={d.addName}
          phone={d.addPhone}
          amount={d.addAmount}
          busy={d.busy}
          onName={d.setAddName}
          onPhone={d.onAddPhoneChange}
          onAmount={d.setAddAmount}
          onSubmit={d.addMember}
        />
      )}
    </View>
  );
};

export default GapMembersCard;
