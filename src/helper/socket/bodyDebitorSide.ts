import { Store } from '../../store/store/Store';
import { getCreditorDataAndDebitorData } from '../../store/api/home';
import { settingDate } from '../index';
import ReturnName from '../returnName';
import { checkingSum } from './serviceFee';
import {
  creditorName,
  debtorName,
  debtorSideCreditorName,
  money,
  spaceDigits,
  tr,
} from './bodyHelpers';

/** Qarz beruvchi nomi + name/start/id parametrlari. */
const base = (item: any) => ({ name: creditorName(item), start: item.created_at, id: item.number });

const endDateChanged = (item: any) => {
  Store.dispatch(getCreditorDataAndDebitorData());
  return tr('531', { ...base(item), end: settingDate(item.end_date) });
};

const residual = (item: any) =>
  tr('552', {
    start: item.created_at,
    id: item.number,
    name: creditorName(item),
    sum: money(item.residual_amount, item.currency),
  });

/** `debitor == reciver` bo'lgandagi matnlar (qabul qiluvchi qarz oluvchi). Mos tur bo'lmasa undefined. */
export const debitorSideBody = (item: any, usd: any): string | undefined => {
  switch (item.type) {
    case 0:
      return tr('contract2', {
        name: debtorSideCreditorName(item),
        sum: money(item.amount, item.currency),
        id: item.number,
        date: item.created,
      });
    case 1:
      return tr('546', {
        name: ReturnName.returnCreditorName(item),
        id: item.number,
        start: item.created_at,
        sum: money(item.refundable_amount, item.currency),
        qoldiq: money(item.residual_amount, item.currency),
      });
    case 4:
      return tr('537', { ...base(item), sum: money(item.vos_summa, item.currency) });
    case 2:
      return tr('546', {
        start: item.created_at,
        id: item.number,
        name: creditorName(item),
        sum: money(item.refundable_amount, item.currency),
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
      return residual(item);
    case 10:
      return tr('561', {
        start: item.created_at,
        number: item.number,
        name: creditorName(item),
        sum: money(item.residual_amount, item.currency),
      });
    case 7:
      return tr('483', { name: creditorName(item), sum: money(item.amount, item.currency) });
    case 8:
      Store.dispatch(getCreditorDataAndDebitorData());
      return tr('523', {
        name: debtorSideCreditorName(item),
        name2: creditorName(item),
        id: item.number,
        sum: money(item.amount, item.currency),
        // DIQQAT: SON uzatiladi (obyekt emas) -> 'NaN'. Xulq o'zgarmagan.
        sum1: checkingSum(item?.amount, usd) + ' ' + item.currency,
      });
    case 13:
      return tr('573', base(item));
    case 22:
      return tr('rejectdebt', {
        start: item.created_at,
        id: item.number,
        sum: spaceDigits(item.refundable_amount.toString()) + ' ' + item.currency,
        end: item.created,
        name: creditorName(item),
      });
    case 11:
      return tr('561', {
        start: item.created_at,
        id: item.number,
        name: debtorName(item),
        sum: money(item.residual_amount, item.currency),
      });
    default:
      return undefined;
  }
};
