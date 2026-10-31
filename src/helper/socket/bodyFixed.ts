import i18next from 'i18next';
import { Store } from '../../store/store/Store';
import ReturnName from '../returnName';
import { getFullName } from '../../screens/home/notifications/all/QarzShartnomasiRejectTime';
import { debtorName, spaceDigits, tr } from './bodyHelpers';

/** Eski kod: dtypes 2/1 bo'lmasa '' (null emas). */
const debtorNameOrEmpty = (item: any) =>
  item.dtypes === 2 ? ReturnName.returnDebitorName(item) : item.dtypes === 1 ? item.dcompany : '';

const currentUserId = () => (Store.getState() as any).HomeReducer.user?.data?.id;

/** Faqat tur (type) bo'yicha — qabul qiluvchi tomoniga bog'liq bo'lmagan matnlar. Mos kelmasa undefined. */
export const fixedTypeBody = (item: any): string | undefined => {
  // 30.10: type 49 — yetkazilmagan SMS (matn backenddan; mijozga qisqa umumiy matn).
  if (item?.type === 49) return i18next.t('SMS qarzdorga yetkazilmadi') as string;
  if (item.type === 21) {
    const userId = currentUserId();
    if (item.creciver === userId) {
      return tr('501', {
        name: item.dtypes === 2 ? getFullName('receiver', item) : item.dtypes === 1 ? item.dcompany : null,
        id: item.number,
        start: item.created,
      });
    }
    if (item.csender === userId) {
      return tr('495', {
        name: item.ctypes === 2 ? getFullName('sender', item) : item.ctypes === 1 ? item.ccompany : null,
        id: item.number,
        start: item.created,
      });
    }
  }
  if (item.type === 24 && currentUserId() === item.creditor) {
    return tr('636', {
      name: debtorName(item),
      sum: spaceDigits(item.token.toString()),
      id: item.duid,
    });
  }
  if (item.type === 23 && currentUserId() === item.reciver) {
    return tr('630', {
      name: item.ctypes === 2 ? ReturnName.returnCreditorName(item) : item.ctypes === 1 ? item.ccompany : null,
      sum: spaceDigits(item.token.toString()),
      id: item.cuid.slice(0, 6) + '/' + item.cuid.slice(-2),
    });
  }
  if (item.type === 25) return tr('759');
  if (item.type === 27) {
    const userId = currentUserId();
    if (userId === item.creditor) {
      return tr('579', {
        name: ReturnName.returnDebitorName(item),
        start: item.created,
        id: item.number,
        end: item.created,
      });
    }
    if (userId === item.debitor) {
      return tr('qshuqqm', {
        name: item.ctypes === 2 ? ReturnName.returnCreditorName(item) : item.ccompany,
        start: item.created,
        id: item.number,
        end: item.created,
      });
    }
  }
  if (item.type === 19) return tr('237', { name: debtorName(item) });
  if (item.type === 31) return debtorNameOrEmpty(item) + ' ' + tr('873');
  if (item.type === 30) return debtorNameOrEmpty(item) + ' ' + tr('867');
  return undefined;
};
