/**
 * FinanceFamily.tsx — Oila (web pages/finance/family/index.vue).
 * Uch bo'lim: menga kelgan takliflar (qabul/rad), men kuzatayotganlar (overview),
 * meni kuzatayotganlar. Telefon orqali taklif (rol: men kuzataman / meni kuzatadi).
 * Backend: GET /finance/family, POST /finance/family/invite, POST /:id/respond, DELETE /:id.
 */
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { num } from './financeMoney';
import { PlusIcon } from '../redesign/icons';
import { FamilyInfoSheet } from './FinanceFamilySections';
import BudgetMgrModal from './family/BudgetMgrModal';
import DeleteConfirmModal from './family/DeleteConfirmModal';
import FamilyBudgetCard from './family/FamilyBudgetCard';
import FamilySections from './family/FamilySections';
import InviteModal from './family/InviteModal';
import LimitDetailModal from './family/LimitDetailModal';
import PendingInvites from './family/PendingInvites';
import PermsEditModal from './family/PermsEditModal';
import { styles } from './family/familyStyles';
import { useFinanceFamily } from './family/useFinanceFamily';

const FinanceFamily = () => {
  const f = useFinanceFamily();
  const { t, budget } = f;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Oila moliyasi')} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => f.openInvite('watched')}>
          <PlusIcon size={rs(18)} color="#fff" />
          <Text allowFontScaling={false} style={styles.addBtnText}>{t('Taklif yuborish')}</Text>
        </TouchableOpacity>

        {budget && (num(budget.total_income_uzs) > 0 || num(budget.total_expense_uzs) > 0) && (
          <FamilyBudgetCard budget={budget} onManage={f.openBudgetMgr} />
        )}

        {f.pending.length > 0 && <PendingInvites pending={f.pending} busy={f.busy} respond={f.respond} />}

        <FamilySections
          asViewer={f.asViewer}
          asTarget={f.asTarget}
          navigation={f.navigation}
          openInvite={f.openInvite}
          setInfoSheet={f.setInfoSheet}
          watchInfo={f.watchInfo}
          watcherInfo={f.watcherInfo}
          setDelTarget={f.setDelTarget}
          openPermsEdit={f.openPermsEdit}
          setLimitDetail={f.setLimitDetail}
        />
        <View style={{ height: rs(20) }} />
      </ScrollView>

      <InviteModal
        visible={f.invite}
        onClose={f.closeInvite}
        phone={f.phone}
        setPhone={f.setPhone}
        role={f.role}
        setRole={f.setRole}
        relation={f.relation}
        setRelation={f.setRelation}
        perms={f.perms}
        setPerms={f.setPerms}
        togglePerm={f.togglePerm}
        setPermDetail={f.setPermDetail}
        saving={f.saving}
        onSubmit={f.submitInvite}
      />

      <PermsEditModal
        target={f.editTarget}
        onClose={() => f.setEditTarget(null)}
        perms={f.perms}
        setPerms={f.setPerms}
        togglePerm={f.togglePerm}
        setPermDetail={f.setPermDetail}
        saving={f.savingPerms}
        onSave={f.savePerms}
      />

      <BudgetMgrModal
        visible={f.showBudgetMgr}
        onClose={() => f.setShowBudgetMgr(false)}
        budget={budget}
        busyBudget={f.busyBudget}
        viewerSel={f.viewerSel}
        addBudgetMember={f.addBudgetMember}
        removeBudgetMember={f.removeBudgetMember}
        toggleViewer={f.toggleViewer}
        saveViewers={f.saveViewers}
      />

      <LimitDetailModal limitDetail={f.limitDetail} onClose={() => f.setLimitDetail(null)} catName={f.catName} />

      {/* 21.10: bo'lim izohi ("i" tugmasi) */}
      <FamilyInfoSheet info={f.infoSheet} onClose={() => f.setInfoSheet(null)} />

      <DeleteConfirmModal delTarget={f.delTarget} onClose={() => f.setDelTarget(null)} doDelete={f.doDelete} />
    </View>
  );
};

export default FinanceFamily;
