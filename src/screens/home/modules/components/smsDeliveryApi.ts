/**
 * smsDeliveryApi.ts — GET /qarz-daftari/sms/undelivered (banner va "Yetkazilmagan SMS" ekrani uchun umumiy).
 * Ma'lumot YANGI bo'lishi kerak — kesh yo'q, oddiy onlayn so'rov.
 */
import axios from 'axios';
import { storage } from '../../../../store/api/token/getToken';
import { URL } from '../../../constants';
import { smsParams, UndeliveredSms } from './smsDeliveryFormat';

export interface UndeliveredPage {
  count: number;
  rows: UndeliveredSms[];
}

/** `limit` berilsa (banner uchun 1) sahifa hajmi o'zgaradi; qolgan parametrlar smsParams'dan. */
export const fetchUndeliveredPage = async (
  page: number,
  shopId: number | null,
  limit?: number,
): Promise<UndeliveredPage> => {
  const res = await axios.get(`${URL}/qarz-daftari/sms/undelivered`, {
    params: { ...smsParams(page, shopId), ...(limit ? { limit } : {}) },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storage.getString('token')}` },
  });
  const data = res.data?.data;
  if (!res.data?.success || !data || !Array.isArray(data.rows)) throw new Error('bad response');
  return { count: Number(data.count) || 0, rows: data.rows };
};
