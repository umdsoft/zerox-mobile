import React from 'react';
import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { safeOpenURL } from '@helper/safeOpenURL';
import { useApiAction } from '../../../../hooks/useApiAction';
import { financeApi } from '../financeApi';
import { buildSmsTemplates, computeNearestDue, computeSmsNet, phoneTail9 } from './debtGroupLogic';
import type { GroupData } from './useGroupData';

/** Kontragent (ism/telefon): tahrirlash oynasi, SMS shablonlari, qo'ng'iroq, "yana qarz berish/olish" yo'naltirishi. */
export function useGroupContact(g: GroupData) {
  const { t, navigation, title, phone, list, setList, ownItems, balance } = g;
  const [editOpen, setEditOpen] = React.useState(false);
  const { run, loading: saving } = useApiAction();
  const [showSms, setShowSms] = React.useState(false);

  const [name, setName] = React.useState(String(title || ''));
  const [phoneEdit, setPhoneEdit] = React.useState(() => phoneTail9(phone));

  const saveEdit = () => {
    if (saving) return;
    const nm = name.trim();
    if (nm.length < 2) {
      Toast.show({ type: 'error2', props: { desc: t('Ismni kiriting') } });
      return;
    }
    if (phoneEdit && phoneEdit.length !== 9) {
      Toast.show({ type: 'error2', props: { desc: t('Telefon raqamini to‘liq kiriting') } });
      return;
    }
    return run(
      async () => {
        const body = { source_name: nm, phone: phoneEdit ? `+998${phoneEdit}` : null };
        // SS-AUDIT (2026-09-25): allSettled — qisman muvaffaqiyat ham mahalliy ro'yxatda aks etadi.
        const results = await Promise.allSettled(ownItems.map(d => financeApi.updateDebt(d.id, body)));
        const okIds = new Set(ownItems.filter((_, i) => results[i].status === 'fulfilled').map(d => d.id));
        setList(prev => prev.map(d => (okIds.has(d.id) ? { ...d, source_name: nm, phone: body.phone } : d)));
        if (okIds.size !== ownItems.length) {
          throw new Error('partial');
        }
        setEditOpen(false);
      },
      { success: t('Saqlandi'), error: t('Xatolik yuz berdi') },
    );
  };

  // SS-AUDIT (2026-09-25): .catch — dialer yo'q qurilmada unhandled rejection bo'lmasin.
  const call = () => phone && Linking.openURL(`tel:${String(phone).replace(/\s/g, '')}`).catch(() => {});

  const smsNet = React.useMemo(() => computeSmsNet(balance), [balance]);
  // 03.10 (7-rasm): qoldiq yo'q — shablon kerak emas, SMS ilovasi bo'sh matn bilan ochiladi.
  const hasOutstanding = smsNet.owed.length > 0 || smsNet.owe.length > 0;
  const nearestDue = React.useMemo(() => computeNearestDue(list), [list]);
  const smsTemplates = (): string[] => buildSmsTemplates({ name, title, smsNet, nearestDue });

  const sendSms = (text?: string) => {
    setShowSms(false);
    if (!phone) return;
    const to = String(phone).replace(/\s/g, '');
    const url = text ? `sms:${to}?body=${encodeURIComponent(text)}` : `sms:${to}`;
    safeOpenURL(url); // SS-SEC (2026-09-25): faqat https/tel/sms/tg
  };

  /** Shu kontragent bilan yangi qarz rasmiylashtirish. */
  const addDebt = (initialType: 'lent' | 'borrowed') =>
    navigation.navigate('FinanceDebtAdd', {
      initialType,
      initialName: name || title || '',
      initialPhone: phone || '',
    });

  return {
    displayName: name || title,
    name,
    setName,
    phoneEdit,
    setPhoneEdit,
    editOpen,
    setEditOpen,
    saving,
    saveEdit,
    showSms,
    setShowSms,
    hasOutstanding,
    smsTemplates,
    sendSms,
    call,
    addDebt,
  };
}

export type GroupContact = ReturnType<typeof useGroupContact>;
