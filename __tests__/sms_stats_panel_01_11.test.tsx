/**
 * SmsStatsPanel: faqat "Yetkazilmagan" kartasi bosiladi (role=button, chevron, ro'yxat ekraniga o'tadi);
 * "Jami SMS" / "Qoldiq SMS" / "Sarflangan" kartalari bosilmaydi.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../src/screens/home/modules/financeApi', () => ({
  financeApi: {
    getSubscription: jest.fn().mockResolvedValue({ data: { data: { sms: { total: 100, used: 40, remaining: 60 } } } }),
    getSmsStats: jest.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));
jest.mock('../src/screens/home/modules/components/smsDeliveryApi', () => ({
  fetchUndeliveredPage: jest.fn().mockResolvedValue({ count: 7, rows: [] }),
}));
jest.mock('../src/screens/home/redesign/icons', () => {
  const mk = (name: string) => () => require('react').createElement('Icon', { name });
  return {
    CheckCircleIcon: mk('check'),
    ChevronRight: mk('chevron'),
    LedgerIcon: mk('ledger'),
    MessageIcon: mk('message'),
    WarningIcon: mk('warning'),
  };
});

import SmsStatsPanel from '../src/screens/home/drawer/drawerScreens/SmsStatsPanel';

const mount = async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => { r = TestRenderer.create(<SmsStatsPanel />); });
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  return r;
};
const byLabel = (r: TestRenderer.ReactTestRenderer, label: string) =>
  r.root.findAll(n => n.props.accessibilityLabel === label && n.props.onPress);

beforeEach(() => mockNavigate.mockReset());

test('"Yetkazilmagan" kartasi role=button, chevron bor va bosilganda ro\'yxat ekraniga o\'tadi', async () => {
  const r = await mount();
  const cards = byLabel(r, 'Yetkazilmagan');
  expect(cards.length).toBeGreaterThan(0);
  expect(cards[0].props.accessibilityRole).toBe('button');
  expect(r.root.findAll(n => String(n.type) === 'Icon' && n.props.name === 'chevron')).toHaveLength(1);
  await act(async () => { cards[0].props.onPress(); });
  expect(mockNavigate).toHaveBeenCalledWith('QarzDaftariYetkazilmagan', { shopId: null });
});

test('qolgan uchta karta bosilmaydi', async () => {
  const r = await mount();
  for (const label of ['Jami SMS', 'Qoldiq SMS', 'Sarflangan']) {
    expect(byLabel(r, label)).toHaveLength(0);
    expect(r.root.findAll(n => n.props.accessibilityRole === 'button' && n.props.accessibilityLabel === label)).toHaveLength(0);
  }
});
