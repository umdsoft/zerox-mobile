import { Store } from '../../store/store/Store';
import { creditorSideBody } from './bodyCreditorSide';
import { debitorSideBody } from './bodyDebitorSide';
import { fixedTypeBody } from './bodyFixed';

/**
 * Bildirishnoma (socket `recive_notification`) uchun matn. Tartib: tur bo'yicha qat'iy matnlar ->
 * `creditor == reciver` tomoni -> `debitor == reciver` tomoni. Mos kelmasa undefined.
 */
export const buildNotificationBody = (item: any): string | undefined => {
  const fixed = fixedTypeBody(item);
  if (fixed !== undefined) return fixed;
  if (item.creditor == item.reciver) {
    const text = creditorSideBody(item, Store.getState().HomeReducer.usd);
    if (text !== undefined) return text;
  }
  if (item.debitor == item.reciver) {
    return debitorSideBody(item, Store.getState().HomeReducer.usd);
  }
  return undefined;
};
