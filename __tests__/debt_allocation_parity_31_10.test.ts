/**
 * 31.10 — mobil `debtAllocation.ts` backend `personalDebtAllocation.service` bilan AYNAN bir xil
 * natija berishi shart (oldindan ko'rish va serverdagi haqiqiy taqsimot farq qilmasin).
 * Backend tomonidagi egizak: backend/tests/unit/debt_money_allocation_2026_10_31.test.js (bir xil kirish va
 * kutilgan qiymatlar). Ikkalasidan biri o'zgarsa, ikkinchisi ham o'zgartirilishi kerak.
 */
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
import { allocatePayment } from '../src/screens/home/modules/debtAllocation';

const debts = [
  { id: 3, remaining_amount: 700, due_date: null, start_date: '2026-01-01' },
  { id: 1, remaining_amount: 500.55, due_date: '2026-12-01', start_date: '2026-02-01' },
  { id: 2, remaining_amount: 300.1, due_date: '2026-11-01', start_date: '2026-03-01' },
];

describe('debtAllocation (mobil) — backend bilan bir xil kutilgan qiymatlar', () => {
  test('muddati yaqin birinchi, muddatsiz oxirida, yig\'indi tiyinda aniq', () => {
    const r = allocatePayment(debts, 600.33);
    expect(r.allocations.map(a => a.debt.id)).toEqual([2, 1, 3]);
    expect(r.allocations.map(a => a.pay)).toEqual([300.1, 300.23, 0]);
    expect(r.allocations.map(a => a.closes)).toEqual([true, false, false]);
  });

  test('summa berilmasa hammasi yopiladi; qoldiqdan oshsa over=true', () => {
    const all = allocatePayment(debts, null);
    expect(all.paid).toBe(1500.65);
    expect(all.allocations.every(a => a.closes && a.remainingAfter === 0)).toBe(true);
    expect(allocatePayment(debts, 1500.66).over).toBe(true);
  });

  test('0.1 + 0.2 kasr xatosi yo\'q', () => {
    const r = allocatePayment([{ id: 1, remaining_amount: 0.1 }, { id: 2, remaining_amount: 0.2 }], 0.3);
    expect(r.paid).toBe(0.3);
    expect(r.allocations.every(a => a.closes)).toBe(true);
  });
});
