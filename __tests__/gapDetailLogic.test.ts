import {
  buildSettingsBody, buildVenueBody, canSetVenue, canUnpayPayment, effectiveMemberOrder, formatCardInput,
  inviteButtonState, isRoundAllPaid, isRoundDefaultOpen, isRoundOverdue, isVenueAddressMissing, locationUrl, mapsLink,
  mayManageRound, moveInList, parseLatLng, settingsFormFor, toggleRoundOpen, validateNewMember, venueFormFor,
  ymdToDate, dateToYmd, UNPAY_WINDOW_MS,
} from '../src/screens/home/modules/gap/gapDetailLogic';

const NOW = new Date('2026-11-01T10:00:00Z');

describe('parseLatLng / locationUrl / mapsLink', () => {
  test('?q=lat,lng, "lat, lng" va yaroqsiz', () => {
    expect(parseLatLng('https://maps.google.com/?q=41.3,69.2')).toEqual({ lat: 41.3, lng: 69.2 });
    expect(parseLatLng('41.31234, 69.28')).toEqual({ lat: 41.31234, lng: 69.28 });
    expect(parseLatLng('-12.5,-45.25')).toEqual({ lat: -12.5, lng: -45.25 });
    expect(parseLatLng('12,45')).toBeNull(); // kasr qismi talab qilinadi (?q= bo'lmasa)
    expect(parseLatLng('Chilonzor')).toBeNull();
    expect(parseLatLng(undefined)).toBeNull();
  });
  test('havola: https o\'zicha, aks holda qidiruv', () => {
    expect(locationUrl('https://maps.app/x')).toBe('https://maps.app/x');
    expect(locationUrl('HTTPS://maps.app/x')).toBe('HTTPS://maps.app/x');
    expect(locationUrl('http://evil')).toBe('https://maps.google.com/?q=http%3A%2F%2Fevil');
    expect(locationUrl('Chilonzor 5')).toBe('https://maps.google.com/?q=Chilonzor%205');
    expect(mapsLink(40.1, 65.2)).toBe('https://maps.google.com/?q=40.1,65.2');
  });
});

describe('sana yordamchilari', () => {
  test('ymd <-> Date aylanishi', () => {
    expect(dateToYmd(ymdToDate('2026-11-05'))).toBe('2026-11-05');
    expect(dateToYmd(null)).toBeNull();
    expect(ymdToDate('')).toBeNull();
  });
  test('isRoundOverdue: round_expired bayrog\'i ustun; aks holda kun bo\'yicha', () => {
    expect(isRoundOverdue({ round_expired: true, due_date: '2099-01-01' }, NOW)).toBe(true);
    expect(isRoundOverdue({ round_expired: false, due_date: '2000-01-01' }, NOW)).toBe(false);
    expect(isRoundOverdue({ due_date: '2026-10-31' }, NOW)).toBe(true);
    // 01.11: kun TOSHKENT bo'yicha (qurilma TZ'siga bog'liq emas): 18:59Z = 23:59 Toshkent, 19:00Z = ertasi 00:00
    expect(isRoundOverdue({ due_date: '2026-11-01 00:00:00' }, new Date('2026-11-01T18:59:00Z'))).toBe(false); // shu kun — o'tmagan
    expect(isRoundOverdue({ due_date: '2026-11-01 00:00:00' }, new Date('2026-11-01T19:00:00Z'))).toBe(true);
    expect(isRoundOverdue({ due_date: '2026-11-01' }, new Date('2026-11-01T18:59:59Z'))).toBe(false);
    expect(isRoundOverdue({ due_date: '2026-11-01T19:00:00.000Z' }, new Date('2026-11-02T10:00:00Z'))).toBe(false); // = 02.11 Toshkent, shu kun
    expect(isRoundOverdue({ due_date: '2026-11-01T19:00:00.000Z' }, new Date('2026-11-02T19:00:00Z'))).toBe(true);
    expect(isRoundOverdue({ due_date: 'bad' }, NOW)).toBe(false);
    expect(isRoundOverdue({}, NOW)).toBe(false);
  });
});

describe('davralar', () => {
  test('isRoundAllPaid', () => {
    expect(isRoundAllPaid({ total_count: 3, paid_count: 3 })).toBe(true);
    expect(isRoundAllPaid({ total_count: 3, paid_count: 2 })).toBe(false);
    expect(isRoundAllPaid({ total_count: 0, paid_count: 0 })).toBe(false);
    expect(isRoundAllPaid({})).toBe(false);
  });
  test('isRoundDefaultOpen: birinchi yakunlanmagani; hammasi yakunlangan bo\'lsa hech biri', () => {
    const rs = [{ status: 'completed' }, { status: 'pending' }, { status: 'pending' }];
    expect([0, 1, 2].map(i => isRoundDefaultOpen(rs, i))).toEqual([false, true, false]);
    const all = [{ status: 'completed' }, { status: 'completed' }];
    expect([0, 1].map(i => isRoundDefaultOpen(all, i))).toEqual([false, false]);
    expect(isRoundDefaultOpen([{ status: 'pending' }, { status: 'pending' }], 0)).toBe(true);
  });
  test('toggleRoundOpen: standart-ochiqni 1-bosish YOPADI (01.11 tuzatish), immutable', () => {
    const a = {};
    const b = toggleRoundOpen(a, 'r1', true); // hozir ochiq (standart) -> yopiladi
    expect(b).toEqual({ r1: false });
    expect(a).toEqual({});
    expect(toggleRoundOpen(b, 'r1', false)).toEqual({ r1: true });
    expect(toggleRoundOpen({}, 'r2', false)).toEqual({ r2: true }); // yopiq davra ochiladi
    expect(toggleRoundOpen({ r3: true }, 'r3')).toEqual({ r3: false }); // isOpen berilmasa — kalit holati
  });
  test('canSetVenue / mayManageRound', () => {
    const g = { my_member_id: 5 };
    expect(canSetVenue({ recipient_member_id: 5 }, g, false)).toBe(true);
    expect(canSetVenue({ recipient_member_id: 6 }, g, false)).toBe(false);
    expect(canSetVenue({ recipient_member_id: 6 }, g, true)).toBe(true);
    expect(mayManageRound({ recipient_member_id: 5 }, g, false)).toBe(true);
    expect(mayManageRound({ recipient_member_id: 6 }, g, false)).toBe(false);
  });
  test('inviteButtonState', () => {
    const base = { status: 'pending', total_count: 3, paid_count: 1, due_date: '2026-11-05', venue: 'Kafe' };
    const open = { isOpen: true, canSet: true };
    expect(inviteButtonState(base, open, NOW)).toEqual({ asInvite: true });
    expect(inviteButtonState({ ...base, venue: '' }, open, NOW)).toEqual({ asInvite: false });
    expect(inviteButtonState({ ...base, due_date: '2026-10-01' }, open, NOW)).toEqual({ asInvite: false }); // muddati o'tgan
    expect(inviteButtonState(base, { isOpen: false, canSet: true }, NOW)).toBeNull();
    expect(inviteButtonState(base, { isOpen: true, canSet: false }, NOW)).toBeNull();
    expect(inviteButtonState({ ...base, status: 'completed' }, open, NOW)).toBeNull();
    expect(inviteButtonState({ ...base, paid_count: 3 }, open, NOW)).toBeNull();
  });
  test('canUnpayPayment: 24 soat oynasi', () => {
    const t0 = NOW.getTime();
    const paid = (iso?: string) => ({ status: 'paid', paid_at: iso });
    expect(canUnpayPayment(paid('2026-11-01 08:00:00'), true, t0)).toBe(true);
    expect(canUnpayPayment(paid(new Date(t0 - UNPAY_WINDOW_MS).toISOString()), true, t0)).toBe(true); // chegarada
    expect(canUnpayPayment(paid(new Date(t0 - UNPAY_WINDOW_MS - 1).toISOString()), true, t0)).toBe(false);
    // 01.11: zonasiz paid_at = Toshkent devor vaqti (UTC+5), qurilma TZ'iga bog'liq emas
    const wallAt = (h: number, m = 0) => Date.UTC(2026, 10, 1, h - 5, m); // Toshkent h:m -> epoch
    expect(canUnpayPayment(paid('2026-10-31 15:00:00'), true, wallAt(15))).toBe(true); // aynan 24 soat
    expect(canUnpayPayment(paid('2026-10-31 15:00:00'), true, wallAt(15, 1))).toBe(false);
    expect(canUnpayPayment(paid('2026-10-31T15:00:00'), true, wallAt(15, 1))).toBe(false);
    expect(canUnpayPayment(paid('2026-10-31T10:00:00.000Z'), true, Date.UTC(2026, 10, 1, 10, 0))).toBe(true);
    expect(canUnpayPayment(paid(undefined), true, t0)).toBe(true); // sana noma'lum — backend hal qiladi
    expect(canUnpayPayment(paid('garbage'), true, t0)).toBe(true);
    expect(canUnpayPayment(paid('2026-11-01 08:00:00'), false, t0)).toBe(false);
    expect(canUnpayPayment({ status: 'pending' }, true, t0)).toBe(false);
  });
});

describe('a\'zolar tartibi', () => {
  const members = [{ id: 1 }, { id: 2 }, { id: 3 }];
  test('effectiveMemberOrder: bo\'sh qo\'lda -> asl; yo\'qolganlar chiqadi, yangilar oxiriga', () => {
    expect(effectiveMemberOrder(members, [])).toBe(members);
    expect(effectiveMemberOrder(members, [{ id: 3 }, { id: 1 }, { id: 2 }]).map(m => m.id)).toEqual([3, 1, 2]);
    expect(effectiveMemberOrder(members, [{ id: 2 }, { id: 99 }, { id: 1 }]).map(m => m.id)).toEqual([2, 1, 3]);
    expect(effectiveMemberOrder(members, [{ id: '3' }, { id: 1 }]).map(m => m.id)).toEqual([3, 1, 2]); // id satr/son aralash
  });
  test('moveInList: chegaralar, immutable', () => {
    const list = [1, 2, 3];
    expect(moveInList(list, 0, -1)).toBeNull();
    expect(moveInList(list, 2, 1)).toBeNull();
    expect(moveInList(list, 0, 1)).toEqual([2, 1, 3]);
    expect(moveInList(list, 2, -1)).toEqual([1, 3, 2]);
    expect(list).toEqual([1, 2, 3]);
  });
});

describe('uchrashuv joyi / karta / sozlamalar', () => {
  const round = { id: 11, venue: 'Kafe', location: 'L', card_number: '8600', card_holder: 'ALI' };
  test('venueFormFor', () => {
    expect(venueFormFor('venue', round)).toEqual({ mode: 'venue', roundId: 11, venue: 'Kafe', location: 'L', card_number: '8600', card_holder: 'ALI' });
    expect(venueFormFor('card', { id: 1 })).toEqual({ mode: 'card', roundId: 1, venue: '', location: '', card_number: '', card_holder: '' });
  });
  test('isVenueAddressMissing: faqat manzil rejimida', () => {
    expect(isVenueAddressMissing({ mode: 'venue', venue: '  ' })).toBe(true);
    expect(isVenueAddressMissing({ mode: 'venue', venue: 'X' })).toBe(false);
    expect(isVenueAddressMissing({ mode: 'card', venue: '' })).toBe(false);
  });
  test('buildVenueBody: manzil va karta rejimlari', () => {
    expect(buildVenueBody({ mode: 'venue', venue: ' Joy ', location: ' L ' })).toEqual({ venue: 'Joy', location: 'L' });
    expect(buildVenueBody({ mode: 'venue', venue: 'Joy', location: undefined })).toEqual({ venue: 'Joy', location: '' });
    expect(buildVenueBody({ mode: 'card', card_number: ' 8600-1234 5678*', card_holder: ' Ali ', venue: 'ignored' })).toEqual({
      card_number: '86001234 5678', card_holder: 'Ali',
    });
  });
  test('formatCardInput', () => {
    expect(formatCardInput('9860123412341234999')).toBe('9860 1234 1234 1234');
    expect(formatCardInput('98a60 12')).toBe('9860 12');
    expect(formatCardInput('')).toBe('');
  });
  test('settingsFormFor / buildSettingsBody', () => {
    const f = settingsFormFor({ name: 'G', frequency: undefined, day_of_month: undefined, start_date: '2026-11-05' });
    expect(f.name).toBe('G');
    expect(f.frequency).toBe('monthly');
    expect(f.day_of_month).toBe('1');
    expect(dateToYmd(f.start_date)).toBe('2026-11-05');
    expect(buildSettingsBody({ ...f, name: ' Yangi ', day_of_month: '0' })).toEqual({
      name: 'Yangi', frequency: 'monthly', day_of_month: 1, start_date: '2026-11-05',
    });
    expect(buildSettingsBody({ name: 'A', frequency: '15days', day_of_month: '12', start_date: null }).start_date).toBeNull();
  });
  test('validateNewMember', () => {
    expect(validateNewMember('  ', '931234567')).toBe('Ism kiriting');
    expect(validateNewMember('Ali', '93123')).toBe('Telefon raqamini to‘liq kiriting');
    expect(validateNewMember('Ali', '931234567')).toBeNull();
  });
});
