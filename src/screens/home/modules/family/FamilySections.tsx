import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { ChevronRight, EyeIcon, PencilIcon, ShieldIcon, TrashIcon } from '../../redesign/icons';
import { FamilyInfo, FamilyMemberRow, FamilyRowAction, FamilySectionCard } from '../FinanceFamilySections';
import { personName, RED, GREEN, WATCH_ACCENT, WATCH_TINT, WATCHER_ACCENT, WATCHER_TINT } from './familyLogic';
import { styles } from './familyStyles';

interface FamilySectionsProps {
  asViewer: any[];
  asTarget: any[];
  navigation: any;
  openInvite: (r: 'watched' | 'watcher') => void;
  setInfoSheet: (i: FamilyInfo | null) => void;
  watchInfo: FamilyInfo;
  watcherInfo: FamilyInfo;
  setDelTarget: (it: any) => void;
  openPermsEdit: (it: any) => void;
  setLimitDetail: (it: any) => void;
}
/** 21.10 redizayn: ikki bo'lim — "Men kuzatayotganlar" va "Meni kuzatayotganlar". */
const FamilySections = ({
  asViewer,
  asTarget,
  navigation,
  openInvite,
  setInfoSheet,
  watchInfo,
  watcherInfo,
  setDelTarget,
  openPermsEdit,
  setLimitDetail,
}: FamilySectionsProps) => {
  const { t } = useTranslation();
  return (
    <>
      {/* 21.10 redizayn: ikki bo'lim — alohida aksent/ikonka, soni, holat chipi,
          "i" izohi va bo'sh holatda qisqa tushuntirish + tegishli rol bilan taklif CTA. */}
      <FamilySectionCard
        accent={WATCH_ACCENT}
        tint={WATCH_TINT}
        Icon={EyeIcon}
        title={t('Men kuzatayotganlar')}
        caption={t('Siz ularning moliyasini ko‘rasiz')}
        count={asViewer.length}
        onInfo={() => setInfoSheet(watchInfo)}
        emptyTitle={t('Hech kim yo‘q.')}
        emptyHint={t('Oila a’zosiga taklif yuboring — u qabul qilgach, uning moliyasini shu yerda ko‘rasiz.')}
        ctaLabel={t('Taklif yuborish')}
        onCta={() => openInvite('watched')}>
        {asViewer.map((it, i) => {
          const isPending = it.status === 'pending';
          return (
            <FamilyMemberRow
              key={it.id ?? i}
              isFirst={i === 0}
              name={personName(it)}
              sub={isPending ? t('Javob kutilmoqda') : it.relation_label || t('Ko‘rish uchun bosing')}
              accent={WATCH_ACCENT}
              tint={WATCH_TINT}
              isPending={isPending}
              // Overview faqat FAOL aloqa uchun (backend) — kutilayotganda ochilmaydi.
              onPress={isPending ? undefined : () => navigation.navigate('FinanceFamilyOverview', { id: it.id, name: personName(it) })}
              actions={
                <>
                  <FamilyRowAction onPress={() => setDelTarget(it)} bg={rd.color.errorBg} label={t('Aloqani uzish')}>
                    <TrashIcon size={rs(15)} color={RED} />
                  </FamilyRowAction>
                  {!isPending && <ChevronRight size={rs(18)} color={rd.color.textTertiary} />}
                </>
              }
            />
          );
        })}
      </FamilySectionCard>

      <FamilySectionCard
        accent={WATCHER_ACCENT}
        tint={WATCHER_TINT}
        Icon={ShieldIcon}
        title={t('Meni kuzatayotganlar')}
        caption={t('Ular sizning moliyangizni ko‘radi')}
        count={asTarget.length}
        onInfo={() => setInfoSheet(watcherInfo)}
        emptyTitle={t('Hech kim yo‘q.')}
        emptyHint={t('Hech kim sizning daromad va xarajatlaringizni ko‘rmayapti. Ishongan odamingizga kirish huquqini berishingiz mumkin.')}
        ctaLabel={t('Kuzatuvchi qo‘shish')}
        onCta={() => openInvite('watcher')}>
        {asTarget.map((it, i) => {
          const isPending = it.status === 'pending';
          const hasLimit = !!(it.monthly_limit || (Array.isArray(it.category_limits) && it.category_limits.length > 0));
          return (
            <FamilyMemberRow
              key={it.id ?? i}
              isFirst={i === 0}
              name={personName(it)}
              sub={isPending ? t('Javob kutilmoqda') : it.relation_label || t('Sizni kuzatmoqda')}
              accent={WATCHER_ACCENT}
              tint={WATCHER_TINT}
              isPending={isPending}
              actions={
                <>
                  {/* So'rov: ushbu kuzatuvchiga berilgan RUXSATlarni tahrirlash. */}
                  <FamilyRowAction onPress={() => openPermsEdit(it)} bg={rd.color.primaryTint} label={t('Ruxsatlarni tahrirlash')}>
                    <PencilIcon size={rs(15)} color={rd.color.primary} />
                  </FamilyRowAction>
                  <FamilyRowAction onPress={() => setDelTarget(it)} bg={rd.color.errorBg} label={t('Aloqani uzish')}>
                    <TrashIcon size={rs(15)} color={RED} />
                  </FamilyRowAction>
                </>
              }
              footer={
                // SS11c: limit BOR bo'lsa — "Batafsil" chipi, to'liq ko'rinish alohida modalda.
                hasLimit ? (
                  <TouchableOpacity style={styles.limitChip} activeOpacity={0.85} onPress={() => setLimitDetail(it)}>
                    <View style={[styles.limitDot, { backgroundColor: it.over_limit ? RED : GREEN }]} />
                    <Text allowFontScaling={false} style={[styles.limitChipText, it.over_limit && { color: RED }]}>
                      {it.over_limit ? t('Limitdan oshgan') : t('Limit belgilangan')}
                    </Text>
                    <Text allowFontScaling={false} style={styles.limitChipMore}>{t('Batafsil ›')}</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          );
        })}
      </FamilySectionCard>
    </>
  );
};

export default FamilySections;
