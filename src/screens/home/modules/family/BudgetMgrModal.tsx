import React from 'react';
import { Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { BLUE, GREEN, RED } from './familyLogic';
import { styles } from './familyStyles';

interface BudgetMgrModalProps {
  visible: boolean;
  onClose: () => void;
  budget: any;
  busyBudget: boolean;
  viewerSel: any[];
  addBudgetMember: (mid: any) => void;
  removeBudgetMember: (mid: any) => void;
  toggleViewer: (id: any) => void;
  saveViewers: () => void;
}
/** SS11: Budjet a'zolari + ko'rish huquqi boshqaruvi. */
const BudgetMgrModal = ({
  visible: showBudgetMgr,
  onClose,
  budget,
  busyBudget,
  viewerSel,
  addBudgetMember,
  removeBudgetMember,
  toggleViewer,
  saveViewers,
}: BudgetMgrModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal visible={showBudgetMgr} transparent animationType="slide" statusBarTranslucent onRequestClose={() => onClose()}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Budjet boshqaruvi')}</Text>

            <Text allowFontScaling={false} style={styles.label}>{t('Budjet a\'zolari')}</Text>
            {(budget?.members || []).filter((m: any) => !m.is_self).map((m: any) => (
              <View key={`bm${m.id}`} style={styles.bmRow}>
                <Text allowFontScaling={false} style={styles.bmName} numberOfLines={1}>{m.name}</Text>
                <TouchableOpacity onPress={() => removeBudgetMember(m.id)} disabled={busyBudget} style={[styles.bmBtn, { backgroundColor: RED + '12' }]}>
                  <Text allowFontScaling={false} style={[styles.bmBtnText, { color: RED }]}>{t('Chiqarish')}</Text>
                </TouchableOpacity>
              </View>
            ))}
            {/* SS9 FIX: ilgari `can_add:false` a'zolar JIM YASHIRILARDI — ekran bo'sh
                ko'rinib, "a'zo qo'shishning iloji yo'q" degan taassurot qolardi. Endi
                hammasi ko'rinadi; qo'shib bo'lmaydiganida SABABI yozib qo'yiladi. */}
            {(budget?.available_members || []).map((m: any) => (
              <View key={`am${m.id}`} style={styles.bmRow}>
                <View style={{ flex: 1, paddingRight: rs(10) }}>
                  <Text allowFontScaling={false} style={styles.bmName} numberOfLines={1}>{m.name}</Text>
                  {!m.can_add && (
                    <Text allowFontScaling={false} style={styles.bmSub}>
                      {t('Daromad va xarajatni to‘liq ko‘rish ruxsati yo‘q — a\'zodan so‘rang.')}
                    </Text>
                  )}
                </View>
                {m.can_add ? (
                  <TouchableOpacity onPress={() => addBudgetMember(m.id)} disabled={busyBudget} style={[styles.bmBtn, { backgroundColor: GREEN + '14' }]}>
                    <Text allowFontScaling={false} style={[styles.bmBtnText, { color: GREEN }]}>{t('+ Qo‘shish')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.bmBtn, { backgroundColor: rd.color.border + '55' }]}>
                    <Text allowFontScaling={false} style={[styles.bmBtnText, { color: rd.color.textTertiary }]}>{t('Ruxsat yo‘q')}</Text>
                  </View>
                )}
              </View>
            ))}
            {!(budget?.members || []).filter((m: any) => !m.is_self).length && !(budget?.available_members || []).length && (
              <Text style={styles.emptyText}>
                Kuzatuvdagi a'zo yo‘q. Avval "Oila" bo‘limidan a'zo taklif qiling — u qabul
                qilgach shu yerda budjetga qo‘shiladi.
              </Text>
            )}

            <Text allowFontScaling={false} style={styles.label}>{t('Ko‘rish huquqi')}</Text>
            <Text allowFontScaling={false} style={[styles.sub, { marginBottom: rs(6) }]}>{t('Budjetni kim ko‘ra olishini belgilang.')}</Text>
            {(budget?.shareable_members || []).map((m: any) => {
              const on = viewerSel.includes(String(m.id));
              return (
                <View key={`sv${m.id}`} style={styles.bmRow}>
                  <Text allowFontScaling={false} style={styles.bmName} numberOfLines={1}>{m.name}</Text>
                  <Switch value={on} onValueChange={() => toggleViewer(m.id)} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
                </View>
              );
            })}
            {!(budget?.shareable_members || []).length && (
              <Text style={styles.emptyText}>{t('Ko‘rish huquqini berish uchun a\'zo yo‘q.')}</Text>
            )}
          </ScrollView>
          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onClose()}><Text style={styles.cancelText}>{t('Yopish')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, busyBudget && { opacity: 0.6 }]} onPress={saveViewers} disabled={busyBudget}><Text style={styles.saveText}>{t('Saqlash')}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BudgetMgrModal;
