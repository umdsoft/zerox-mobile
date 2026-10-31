import { Store } from '../../store/store/Store';
import { getCreditorDataAndDebitorData } from '../../store/api/home';
import { setChangeEndDate } from '../../store/reducers/HomeReducer';
import { settingDate } from '../index';
import ReturnName from '../returnName';
import { checkingSum } from './serviceFee';
import { creditorSideDebtorName, debtorName, money, spaceDigits, tr } from './bodyHelpers';

/** Qarz oluvchi nomi + "n-raqam" parametrlari (ko'p turlarda bir xil: name/start/id). */
const base = (item: any) => ({ name: debtorName(item), start: item.created_at, id: item.number });

const endDateChanged = (item: any) => {
  Store.dispatch(getCreditorDataAndDebitorData());
  Store.dispatch(setChangeEndDate({ end_date: item.end_date }));
  return tr('531', { ...base(item), end: settingDate(item.end_date) });
};

const residual = (key: string, item: any) =>
  tr(key, {
    start: item.created_at,
    id: item.number,
    name: debtorName(item),
    sum: money(item.residual_amount, item.currency),
  });

/**
 * `creditor == reciver` bo'lgandagi matnlar (qabul qiluvchi qarz beruvchi). Mos tur bo'lmasa undefined
 * (chaqiruvchi keyingi — debitor tomoni — tekshiruvga o'tadi).
 */
export const creditorSideBody = (item: any, usd: any): string | undefined => {
  switch (item.type) {
    case 0:
      return tr('contract1', {
        name: creditorSideDebtorName(item),
        sum: money(item.amount, item.currency),
        id: item.number,
        date: item.created,
        summ: checkingSum(item, usd),
      });
    case 1:
      return tr('546', {
        name: ReturnName.returnDebitorName(item),
        id: item.number,
        start: item.created_at,
        sum: money(item.refundable_amount, item.currency),
        qoldiq: money(item.residual_amount, item.currency),
      });
    case 4:
      return tr('537', {
        name: debtorName(item),
        start: item.created_at,
        id: item.number,
        sum: money(item.vos_summa, item.currency),
      });
    case 2:
      return tr('546', {
        end: item.created_at,
        id: item.number,
        name: debtorName(item),
        sum: money(item.inc, item.currency),
        qoldiq: money(item.residual_amount, item.currency),
      });
    case 3:
      return tr('567', { ...base(item), end: settingDate(item.end_date) });
    case 17:
      return tr('525', { ...base(item), sum: money(item.amount, item.currency) });
    case 12:
    case 16:
      return endDateChanged(item);
    case 9:
    case 15:
      return residual('552', item);
    case 10:
    case 11:
      return residual('561', item);
    case 7:
      return tr('513', { name: debtorName(item), sum: money(item.amount, item.currency) });
    case 8: {
      const text = tr(item.token !== null ? '519' : '520', {
        name: debtorName(item),
        id: item.number,
        sum: money(item.amount, item.currency),
        sum1: checkingSum(item, usd) + ' ' + 'UZS',
      });
      Store.dispatch(getCreditorDataAndDebitorData());
      return text;
    }
    case 13:
      return tr('573', base(item));
    case 22:
      return tr('rejectdebt1', {
        start: item.created_at,
        id: item.number,
        sum: spaceDigits(item.refundable_amount.toString()) + ' ' + item.currency,
        end: item.created,
        name: debtorName(item),
      });
    default:
      return undefined;
  }
};
