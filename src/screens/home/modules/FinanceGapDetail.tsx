/**
 * FinanceGapDetail.tsx — Gap tafsiloti (web pages/finance/gap/_id.vue). Yupqa kompozitsiya (SOLID 2-bosqich):
 *   - ma'lumot + amallar:  gap/useGapDetail.ts   (endpoint, payload, toast, navigatsiya)
 *   - sof mantiq:          gap/gapDetailLogic.ts
 *   - ko'rinish bo'limlari: gap/components/*.tsx (uslublar: gap/gapDetailStyles.ts)
 * DRAFT: a'zolarni boshqarish + "Boshlash" (shuffle -> navbat+davralar).
 * FAOL/TUGALLANGAN: navbat, davralar (recipient, paid_count/total), har to'lovni "To'landi" qilish
 * (tashkilotchi yoki qabul qiluvchi). O'chirish (tashkilotchi).
 * Backend: GET /finance/gap/:id, POST members, DELETE members, POST shuffle, POST payments/:pid/pay, DELETE.
 *
 * ⚠️ useGapDetail() har doim, `if (!g)` erta-return'idan OLDIN chaqiriladi (Rules of Hooks; 2026-09-19 oq ekran).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { TrashIcon } from '../redesign/icons';
import { GapCoOrgModal, GapDeleteGapModal, GapDeleteMemberModal } from './gap/components/GapConfirmModals';
import GapHeadCard from './gap/components/GapHeadCard';
import GapMembersCard from './gap/components/GapMembersCard';
import GapRoundsCard from './gap/components/GapRoundsCard';
import GapSettingsModal from './gap/components/GapSettingsModal';
import GapVenueModal from './gap/components/GapVenueModal';
import { styles, RED } from './gap/gapDetailStyles';
import { useGapDetail } from './gap/useGapDetail';

const FinanceGapDetail = () => {
  const { t } = useTranslation();
  const d = useGapDetail();
  const { g, members, isDraft, isOrganizer } = d;

  if (!g) {
    return (<View style={styles.container}><RdHeader title={t('Gap')} /><Loading /></View>);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS11: sozlamalar (gear) — FAQAT gap boshlanmasdan oldin va tashkilotchiga. */}
      <RdHeader
        title={g.name || 'Gap'}
        right={
          isDraft && isOrganizer ? (
            <TouchableOpacity activeOpacity={0.8} style={styles.gearBtn} onPress={d.openSettings}>
              <Text allowFontScaling={false} style={styles.gearIcon}>⚙️</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GapHeadCard g={g} memberCount={members.length} isDraft={isDraft} />
        <GapMembersCard d={d} />

        {/* Boshlash (draft) */}
        {isDraft && isOrganizer && (
          <TouchableOpacity style={[styles.startBtn, d.busy && { opacity: 0.6 }]} onPress={d.start} disabled={d.busy} activeOpacity={0.85}>
            <Text allowFontScaling={false} style={styles.startText}>{t('Gapni boshlash (navbat aniqlanadi)')}</Text>
          </TouchableOpacity>
        )}

        <GapRoundsCard d={d} />

        {/* O'chirish */}
        {isOrganizer && (
          <TouchableOpacity style={styles.delBtn} onPress={() => d.setShowDel(true)} activeOpacity={0.85}>
            <TrashIcon size={rs(18)} color={RED} />
            <Text allowFontScaling={false} style={styles.delText}>{t('Gapni o‘chirish')}</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: rs(24) }} />
      </ScrollView>

      <GapSettingsModal settings={d.settings} setSettings={d.setSettings} saving={d.savingSet} onSave={d.saveSettings} />
      <GapDeleteMemberModal member={d.delMember} busy={d.busy} onCancel={() => d.setDelMember(null)} onConfirm={d.removeMember} />
      <GapCoOrgModal coOrg={d.coOrg} busy={d.busy} onCancel={() => d.setCoOrg(null)} onConfirm={d.applyCoOrg} />
      <GapDeleteGapModal visible={d.showDel} gapName={g.name} busy={d.busy} onCancel={() => d.setShowDel(false)} onConfirm={d.doDelete} />
      <GapVenueModal
        venueForm={d.venueForm}
        setVenueForm={d.setVenueForm}
        showMap={d.showMap}
        setShowMap={d.setShowMap}
        saving={d.savingVenue}
        onSave={d.saveVenue}
      />
    </View>
  );
};

export default FinanceGapDetail;
