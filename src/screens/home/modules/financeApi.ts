/**
 * financeApi.ts — Shaxsiy moliya REST chaqiruvlari (imperativ: POST/PUT/DELETE + ba'zi GET).
 * GET ro'yxatlar odatda `useFetch` bilan olinadi; bu yerda yozuv amallari + edit-prefill.
 *
 * Envelope: har javob { success, data } (yoki xatoda { success:false, message }).
 * Barcha yo'l `/finance/*`; base = constants URL (/api/v1).
 */
import axios from 'axios';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';

const auth = () => ({
  headers: { Authorization: `Bearer ${storage.getString('token')}` },
});

const base = `${URL}/finance`;

export const financeApi = {
  // ── Dashboard ──
  getDashboard: () => axios.get(`${base}/dashboard`, auth()),
  getHealth: () => axios.get(`${base}/health`, auth()),

  // ── Xarajat (Expense) ──
  getExpenses: (params: any) => axios.get(`${base}/expenses`, { ...auth(), params }),
  getExpenseStats: (year: number, month: number) =>
    axios.get(`${base}/expenses/stats`, { ...auth(), params: { year, month } }),
  getExpenseCategories: () => axios.get(`${base}/expenses/categories`, auth()),
  createExpenseCategory: (body: { name: string; icon?: string }) =>
    axios.post(`${base}/expenses/categories`, body, auth()),
  createExpense: (body: any) => axios.post(`${base}/expenses`, { source: 'mobile', ...body }, auth()),
  // OFD chek QR'ini parse qilib xarajat prefill ma'lumotini qaytaradi (yozmaydi).
  // So'rov SS6: OFD API sekin bo'lsa mobil UZOQ MUZLAMASIN — client timeout 22s
  // (backend OFD timeout 15s + tarmoq). Timeout bo'lsa foydalanuvchi qayta urinadi.
  scanReceipt: (qr: string) =>
    axios.post(`${base}/receipt/scan`, { qr }, { ...auth(), timeout: 22000 }),
  getExpenseById: (id: any) => axios.get(`${base}/expenses/${id}`, auth()),
  updateExpense: (id: any, body: any) => axios.put(`${base}/expenses/${id}`, body, auth()),
  deleteExpense: (id: any) => axios.delete(`${base}/expenses/${id}`, auth()),

  // ── Daromad (Income) ──
  getIncomes: (params: any) => axios.get(`${base}/incomes`, { ...auth(), params }),
  getIncomeStats: (year: number, month: number) =>
    axios.get(`${base}/incomes/stats`, { ...auth(), params: { year, month } }),
  getIncomeCategories: () => axios.get(`${base}/incomes/categories`, auth()),
  createIncomeCategory: (body: { name: string; icon?: string }) =>
    axios.post(`${base}/incomes/categories`, body, auth()),
  createIncome: (body: any) => axios.post(`${base}/incomes`, { source: 'mobile', ...body }, auth()),
  getIncomeById: (id: any) => axios.get(`${base}/incomes/${id}`, auth()),
  updateIncome: (id: any, body: any) => axios.put(`${base}/incomes/${id}`, body, auth()),
  deleteIncome: (id: any) => axios.delete(`${base}/incomes/${id}`, auth()),

  // ── Maqsad (Goal) ──
  getGoals: (status?: string) =>
    axios.get(`${base}/goals`, { ...auth(), params: status ? { status } : {} }),
  getGoalStats: () => axios.get(`${base}/goals/stats`, auth()),
  getGoalById: (id: any) => axios.get(`${base}/goals/${id}`, auth()),
  createGoal: (body: any) => axios.post(`${base}/goals`, body, auth()),
  updateGoal: (id: any, body: any) => axios.put(`${base}/goals/${id}`, body, auth()),
  addGoalAmount: (id: any, amount: number) =>
    axios.post(`${base}/goals/${id}/add-amount`, { amount }, auth()),
  deleteGoal: (id: any) => axios.delete(`${base}/goals/${id}`, auth()),

  // ── Analitika ──
  getInsights: () => axios.get(`${base}/analytics/insights`, auth()),
  getExpenseAnalytics: (year: number, month: number) =>
    axios.get(`${base}/analytics/expenses`, { ...auth(), params: { year, month } }),
  getIncomeAnalytics: (year: number, month: number) =>
    axios.get(`${base}/analytics/incomes`, { ...auth(), params: { year, month } }),
  getGoalAnalytics: () => axios.get(`${base}/analytics/goals`, auth()),

  // ── Byudjet / Limitlar (Budget) ──
  getBudgetLimitsStatus: (year: number, month: number) =>
    axios.get(`${base}/budgets/limits-status`, { ...auth(), params: { year, month } }),
  saveBudget: (body: any) => axios.post(`${base}/budgets`, body, auth()),
  deleteBudget: (id: any) => axios.delete(`${base}/budgets/${id}`, auth()),

  // ── Tavsiyalar (Recommendations / Advice) ──
  getRecommendations: () => axios.get(`${base}/recommendations`, auth()),

  // ── Shaxsiy qarzlar (Personal debts) ──
  getDebts: (params?: any) => axios.get(`${base}/debts`, { ...auth(), params: params || {} }),
  getDebtStats: () => axios.get(`${base}/debts/stats`, auth()),
  getDebtById: (id: any) => axios.get(`${base}/debts/${id}`, auth()),
  createDebt: (body: any) => axios.post(`${base}/debts`, body, auth()),
  updateDebt: (id: any, body: any) => axios.put(`${base}/debts/${id}`, body, auth()),
  deleteDebt: (id: any) => axios.delete(`${base}/debts/${id}`, auth()),
  addDebtPayment: (id: any, body: any) => axios.post(`${base}/debts/${id}/payments`, body, auth()),
  // SS17: mavjud qarzga qo'shimcha (ustiga qo'shish).
  increaseDebt: (id: any, body: any) => axios.post(`${base}/debts/${id}/increase`, body, auth()),
  // SS2: shaxsiy plastik karta (qarz qaytarish rekvizitlari) + qaytarishni talab qilish.
  getPayoutCard: () => axios.get(`${base}/payout-card`, auth()),
  savePayoutCard: (body: any) => axios.put(`${base}/payout-card`, body, auth()),
  demandRepayment: (id: any) => axios.post(`${base}/debts/${id}/demand`, {}, auth()),
  // SS4 (2026-09-19): kontragent sahifasidan qarzdan voz kechish.
  forgiveDebt: (id: any) => axios.post(`${base}/debts/${id}/forgive`, {}, auth()),
  // SS-DEV (2026-09-24): KO'ZGU qarzda MEN QARZ BERUVCHI bo'lsam (`can_operate`,
  // qarshi tomon "oldim" deb kiritgan) — sayt `group/_key.vue` dagi kabi
  // yopish / to'lov qayd etish / talab qilish / voz kechish. Yozuv qarshi
  // tomonniki, shu bois oddiy `/payments`, `/forgive`, `/demand` 404 beradi —
  // backend `mirror-*` endpointlari telefon mosligini tekshirib ruxsat beradi.
  //   mirror-payment: `amount` berilmasa — QOLDIQNING HAMMASI (qarzni yopish);
  //                   javob: { data: payment, remaining_amount }.
  //   mirror-forgive: status=completed, remaining=0.
  //   mirror-demand : karta (payout card) shart — 400 `no-card` / `no-phone`.
  //   mirror-hide   : TUGALLANGAN ko'zgu qarzni faqat MENING ro'yxatimdan olib tashlash.
  mirrorPayDebt: (id: any, body: { amount?: number; payment_date?: string; notes?: string }) =>
    axios.post(`${base}/debts/${id}/mirror-payment`, body || {}, auth()),
  mirrorForgiveDebt: (id: any) => axios.post(`${base}/debts/${id}/mirror-forgive`, {}, auth()),
  mirrorDemandDebt: (id: any) => axios.post(`${base}/debts/${id}/mirror-demand`, {}, auth()),
  mirrorHideDebt: (id: any) => axios.post(`${base}/debts/${id}/mirror-hide`, {}, auth()),
  // SS-AUDIT (2026-09-25): "ko'zgu bo'lsa mirror-*, aks holda oddiy" tarmoqlanishi
  // 4 joyda (FinanceDebtDetail demand/forgive, FinanceDebtGroup runAction) takrorlanardi.
  demandDebtAny: (id: any, mirror: boolean) =>
    mirror ? financeApi.mirrorDemandDebt(id) : financeApi.demandRepayment(id),
  forgiveDebtAny: (id: any, mirror: boolean) =>
    mirror ? financeApi.mirrorForgiveDebt(id) : financeApi.forgiveDebt(id),
  // SS-DEV (2026-09-24): QARZDOR shikoyati — qarshi tomon (hamkor yoki do'kon)
  // noto'g'ri yozgan qarz bo'yicha. Backend `parseComplaintInput`: `reason` —
  // 'not_taken' | 'fully_paid' | 'partly_paid' | 'other' (ixtiyoriy), `izoh` —
  // sabab tanlanmasa MAJBURIY (500 belgigacha). Javob: { success, duplicate? }.
  //   odam-odam: POST /finance/debts/:id/complaint (personal_debts.id)
  //   do'kon:    POST /finance/debts/shop/:qarzId/complaint ("shop_12" ham qabul qilinadi)
  complainDebt: (id: any, body: { reason?: string; izoh?: string }) =>
    axios.post(`${base}/debts/${id}/complaint`, body, auth()),
  complainShopDebt: (id: any, body: { reason?: string; izoh?: string }) =>
    axios.post(`${base}/debts/shop/${id}/complaint`, body, auth()),

  // ── Qarzdorlar (Debtors reliability) ──
  getDebtors: () => axios.get(`${base}/debtors`, auth()),
  getDebtorById: (id: any) => axios.get(`${base}/debtors/${id}`, auth()),

  // ── Rejalashtirilgan to'lovlar (Scheduled payments) ──
  getScheduledPayments: () => axios.get(`${base}/scheduled-payments`, auth()),
  createScheduledPayment: (body: any) => axios.post(`${base}/scheduled-payments`, body, auth()),
  updateScheduledPayment: (id: any, body: any) =>
    axios.put(`${base}/scheduled-payments/${id}`, body, auth()),
  deleteScheduledPayment: (id: any) => axios.delete(`${base}/scheduled-payments/${id}`, auth()),
  confirmScheduledPayment: (id: any) =>
    // SS15: mobil orqali tasdiqlanган → manba 'mobile' (sayt "Mobil ilova" ko'rsatadi).
    axios.post(`${base}/scheduled-payments/${id}/confirm`, { source: 'mobile' }, auth()),
  skipScheduledPayment: (id: any) =>
    axios.post(`${base}/scheduled-payments/${id}/skip`, {}, auth()),
  // Amalga oshirilgan to'lovlar tarixi (expenses.scheduled_payment_id).
  scheduledPaymentHistory: (id: any) =>
    axios.get(`${base}/scheduled-payments/${id}/history`, auth()),

  // ── Kutilayotgan daromadlar (Scheduled incomes) ──
  getScheduledIncomes: () => axios.get(`${base}/scheduled-incomes`, auth()),
  createScheduledIncome: (body: any) => axios.post(`${base}/scheduled-incomes`, body, auth()),
  updateScheduledIncome: (id: any, body: any) =>
    axios.put(`${base}/scheduled-incomes/${id}`, body, auth()),
  deleteScheduledIncome: (id: any) => axios.delete(`${base}/scheduled-incomes/${id}`, auth()),
  confirmScheduledIncome: (id: any) =>
    // SS15: mobil orqali qabul qilingan → manba 'mobile'.
    axios.post(`${base}/scheduled-incomes/${id}/confirm`, { source: 'mobile' }, auth()),
  skipScheduledIncome: (id: any) =>
    axios.post(`${base}/scheduled-incomes/${id}/skip`, {}, auth()),
  // Qabul qilingan daromadlar tarixi (incomes.scheduled_income_id).
  scheduledIncomeHistory: (id: any) =>
    axios.get(`${base}/scheduled-incomes/${id}/history`, auth()),

  // ── Oila (Family) ──
  getFamily: () => axios.get(`${base}/family`, auth()),
  inviteFamily: (body: any) => axios.post(`${base}/family/invite`, body, auth()),
  respondFamily: (id: any, body: any) => axios.post(`${base}/family/${id}/respond`, body, auth()),
  updateFamily: (id: any, body: any) => axios.patch(`${base}/family/${id}`, body, auth()),
  deleteFamily: (id: any) => axios.delete(`${base}/family/${id}`, auth()),
  getFamilyOverview: (id: any, year: number, month: number) =>
    axios.get(`${base}/family/${id}/overview`, { ...auth(), params: { year, month } }),
  getFamilyBudget: () => axios.get(`${base}/family/budget`, auth()),
  // SS11: oila budjeti a'zolari + ko'rish huquqi.
  addBudgetMember: (body: { member_id: any }) => axios.post(`${base}/family/budget/members`, body, auth()),
  removeBudgetMember: (memberId: any) => axios.delete(`${base}/family/budget/members/${memberId}`, auth()),
  setBudgetViewers: (body: { viewer_ids: any[] }) => axios.put(`${base}/family/budget/viewers`, body, auth()),

  // ── Gap (ROSCA / qora kassa) ──
  getGaps: () => axios.get(`${base}/gap`, auth()),
  createGap: (body: any) => axios.post(`${base}/gap`, body, auth()),
  getGapById: (id: any) => axios.get(`${base}/gap/${id}`, auth()),
  deleteGap: (id: any) => axios.delete(`${base}/gap/${id}`, auth()),
  addGapMember: (id: any, body: any) => axios.post(`${base}/gap/${id}/members`, body, auth()),
  deleteGapMember: (id: any, mid: any) => axios.delete(`${base}/gap/${id}/members/${mid}`, auth()),
  shuffleGap: (id: any, body?: any) => axios.post(`${base}/gap/${id}/shuffle`, body || {}, auth()),
  payGap: (id: any, pid: any) => axios.post(`${base}/gap/${id}/payments/${pid}/pay`, {}, auth()),
  // SS3 (2026-09-15): to'lovni bekor qilish — 24 soat ichida, tashkilotchi yoki
  // qabul qiluvchi. Bog'langan Xarajat/Daromad yozuvlari ham o'chiriladi.
  unpayGap: (id: any, pid: any) =>
    axios.post(`${base}/gap/${id}/payments/${pid}/unpay`, {}, auth()),
  updateGap: (id: any, body: any) => axios.patch(`${base}/gap/${id}`, body, auth()),
  // SS6 (2026-09-18): gapda IKKINCHI tashkilotchi. Tayinlash/olib tashlash FAQAT
  // dastlabki tashkilotchida (backend tekshiradi) — jami 2 tadan oshmaydi.
  setGapCoOrganizer: (id: any, memberId: any) =>
    axios.post(`${base}/gap/${id}/co-organizer`, { member_id: memberId }, auth()),
  removeGapCoOrganizer: (id: any) =>
    axios.delete(`${base}/gap/${id}/co-organizer`, auth()),
  // Davra uchrashuv joyini kiritish (tashkilotchi yoki navbatdagi a'zo).
  setGapRoundVenue: (id: any, roundId: any, body: { venue?: string; location?: string; card_number?: string; card_holder?: string }) =>
    axios.put(`${base}/gap/${id}/rounds/${roundId}/venue`, body, auth()),
  // SS4: "Taklif yuborish" — davra ma'lumoti saqlangach a'zolarga Telegram taklifi (avtomatik emas).
  notifyGapRound: (id: any, roundId: any) =>
    axios.post(`${base}/gap/${id}/rounds/${roundId}/notify`, {}, auth()),
  // SS8: ilova ichidan davomat javobi + bildirishnoma kartasi uchun tafsilot.
  setGapAttendance: (id: any, roundId: any, status: 'going' | 'not_going') =>
    axios.post(`${base}/gap/${id}/rounds/${roundId}/attendance`, { status }, auth()),
  getGapInvite: (roundId: any) => axios.get(`${base}/gap/invite/${roundId}`, auth()),

  // ── Foydalanuvchi profili (SS1, 2026-09-17) ──
  // `/finance` emas, `/user` ostida — shu bois to'liq yo'l yoziladi.
  getMe: () => axios.get(`${URL}/user/me`, auth()),
  // FISh ni BIR MARTA saqlash: MyID'dan o'tmagan foydalanuvchining ismi tizimda
  // yo'q, shaxsiy qarz hujjatlarida esa u kerak. Ism allaqachon bo'lsa backend
  // uni o'zgartirmaydi (changed:false qaytaradi).
  setMyFish: (fish: string) => axios.post(`${URL}/user/set-fish`, { fish }, auth()),
};
