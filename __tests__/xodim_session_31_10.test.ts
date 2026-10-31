const mockMem = new Map<string, any>();
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => mockMem.set(k, v),
    getString: (k: string) => (typeof mockMem.get(k) === 'string' ? mockMem.get(k) : undefined),
    delete: (k: string) => mockMem.delete(k),
  },
}));
jest.mock('../src/screens/constants', () => ({ URL: 'https://api.test' }));
jest.mock('../src/helper/userAgent', () => ({ getDeviceUserAgent: () => 'jest' }));
jest.mock('../src/helper/forceLogout', () => ({
  forceLogout: jest.fn(),
  isSessionRevokedError: () => false,
}));
jest.mock('../src/helper/passwordChangeSession', () => ({
  OWN_PASSWORD_CHANGE_PATH: '/x',
  isOwnPasswordChangeActive: () => false,
  waitForOwnPasswordChange: async () => null,
}));
jest.mock('../src/helper/ofertaGate', () => ({
  installOfertaToastGuard: () => {},
  isOfertaRequiredError: () => false,
  notifyOfertaRequired: () => {},
}));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock('i18next', () => ({ __esModule: true, default: { t: (s: string) => s } }));

import axios from 'axios';
import { installAuthRefresh, isExpiredError } from '../src/store/api/authInterceptor';
import { exitXodimSession, isXodimSession } from '../src/store/api/token/xodimSession';

const expired = (config: any) =>
  Promise.reject(
    Object.assign(new Error('401'), {
      config,
      response: { status: 401, data: { code: 'UNAUTHORIZED', message: 'Token has expired' }, config },
    }),
  );

describe('xodim session on token expiry', () => {
  beforeEach(() => {
    mockMem.clear();
    mockMem.set('token', 'XODIM');
    mockMem.set('owner_prev_token', 'OWNER');
    mockMem.set('xodim_session', '1');
    mockMem.set('refreshToken', 'PERSONAL_REFRESH');
  });

  it('401 expired in xodim mode restores owner token and does NOT refresh/retry', async () => {
    const post = jest.spyOn(axios, 'post');
    let calls = 0;
    const inst = axios.create({
      adapter: (config: any) => {
        calls++;
        return expired(config);
      },
    });
    installAuthRefresh(inst);

    await expect(inst.get('https://api.test/qarz-daftari/x', { headers: { Authorization: 'Bearer XODIM' } })).rejects.toBeTruthy();
    expect(calls).toBe(1);
    expect(post).not.toHaveBeenCalled();
    expect(isXodimSession()).toBe(false);
    expect(mockMem.get('token')).toBe('OWNER');
    expect(mockMem.get('refreshToken')).toBe('PERSONAL_REFRESH');
  });

  it('parallel late 401 from the ended xodim token is not retried with personal token', async () => {
    const post = jest.spyOn(axios, 'post');
    let calls = 0;
    const inst = axios.create({
      adapter: (config: any) => {
        calls++;
        return expired(config);
      },
    });
    installAuthRefresh(inst);
    await Promise.allSettled([
      inst.get('https://api.test/a', { headers: { Authorization: 'Bearer XODIM' } }),
      inst.get('https://api.test/b', { headers: { Authorization: 'Bearer XODIM' } }),
    ]);
    expect(calls).toBe(2);
    expect(post).not.toHaveBeenCalled();
  });

  it('exitXodimSession is idempotent', () => {
    expect(exitXodimSession()).toBe(true);
    expect(exitXodimSession()).toBe(false);
  });
});

describe('isExpiredError', () => {
  const mk = (data: any, status = 401) => ({ response: { status, data } });
  it('accepts message regex and TOKEN_EXPIRED code', () => {
    expect(isExpiredError(mk({ code: 'UNAUTHORIZED', message: 'Token has expired' }))).toBe(true);
    expect(isExpiredError(mk({ code: 'TOKEN_EXPIRED' }))).toBe(true);
    expect(isExpiredError(mk({ code: 'UNAUTHORIZED', message: 'Invalid' }))).toBe(false);
    expect(isExpiredError(mk({ message: 'expired' }, 403))).toBe(false);
  });
});
