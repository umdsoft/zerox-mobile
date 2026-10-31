/**
 * 31.10 — mobil `debtAllocation.ts` backend `personalDebtAllocationOrder` ('economic_v1') bilan AYNAN bir xil
 * natija berishi shart (oldindan ko'rish va serverdagi haqiqiy taqsimot farq qilmasin).
 * Fixture backend/tests/unit/fixtures/debt_allocation_economic.json nusxasi (o'zgarsa — ikkalasini yangilang).
 */
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
import { allocatePayment, ymdOf } from '../src/screens/home/modules/debtAllocation';

const fixture = require('./fixtures/debt_allocation_economic.json');

describe('debtAllocation (mobil) — economic_v1, backend bilan umumiy fixture', () => {
  test.each(fixture.cases.map((c: any) => [c.name, c]))('%s', (_n: string, c: any) => {
    const r = allocatePayment(c.debts, c.amount, { today: fixture.today, ...(c.opts || {}) });
    expect(r.over).toBe(false);
    expect(r.order_rule).toBe('economic_v1');
    expect(r.allocations.map(a => a.debt.id)).toEqual(c.expected.order);
    expect(r.allocations.map(a => a.reason)).toEqual(c.expected.reasons);
    expect(r.allocations.map(a => a.pay)).toEqual(c.expected.pays);
    expect(r.paid).toBe(c.expected.paid);
    expect(r.total).toBe(c.expected.total);
  });

  test('qoldiqdan oshsa over=true; 0.1 + 0.2 kasr xatosi yo\'q', () => {
    expect(allocatePayment([{ id: 1, remaining_amount: 10 }], 10.01).over).toBe(true);
    const r = allocatePayment([{ id: 1, remaining_amount: 0.1 }, { id: 2, remaining_amount: 0.2 }], 0.3);
    expect(r.paid).toBe(0.3);
    expect(r.allocations.every(a => a.closes)).toBe(true);
  });

  test('sana: ISO(Z) Toshkent sanasiga, matn sanasi o\'zgarmaydi', () => {
    expect(ymdOf('2026-11-01')).toBe('2026-11-01');
    expect(ymdOf('2026-11-01 00:00:00')).toBe('2026-11-01');
    expect(ymdOf('2026-10-31T19:00:00.000Z')).toBe('2026-11-01');
    expect(ymdOf(null)).toBeNull();
  });
});
