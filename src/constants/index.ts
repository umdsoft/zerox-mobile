/**
 * Application-wide constants
 * Centralized constants to avoid hardcoded strings throughout the application
 */

// ============================================================================
// Notification Messages
// ============================================================================

/**
 * Update notification messages in different languages
 */
export const UPDATE_NOTIFICATION_MESSAGES = {
  ru: 'Доступна новая версия приложения. Пожалуйста обновите приложение!',
  uz_cyrillic: 'Илованинг янги версияси мавжуд. Илтимос, иловани янгиланг!',
  uz_latin: 'Ilovaning yangi versiyasi mavjud. Iltimos, ilovani yangilang!',
} as const;

/**
 * Check if a message is an update notification
 */
export const isUpdateNotification = (message: string | undefined): boolean => {
  if (!message) return false;
  return Object.values(UPDATE_NOTIFICATION_MESSAGES).some(
    msg => msg === message,
  );
};

// ============================================================================
// App Configuration
// ============================================================================

/**
 * App loading timeout (milliseconds)
 */
export const APP_LOADING_TIMEOUT = 2500;

/**
 * WebView URL for tablet devices
 */
export const TABLET_WEBVIEW_URL = 'https://zerox.uz';

// ============================================================================
// User Type Constants
// ============================================================================

/**
 * User type identifiers
 */
export const USER_TYPES = {
  COMPANY: 1,
  PERSON: 2,
} as const;

// ============================================================================
// Status Bar Configuration
// ============================================================================

/**
 * Status bar configurations
 */
export const STATUS_BAR = {
  backgroundColor: '#fff',
  barStyle: 'dark-content' as const,
};

// ============================================================================
// Deep Link Paths
// ============================================================================

/**
 * Deep link paths used in the application
 */
export const DEEP_LINK_PATHS = {
  USER_MONEY_RESULT: 'UserMoneyResult',
  NOTIFICATION: 'Notification',
} as const;

// ============================================================================
// Screen Names
// ============================================================================

/**
 * Screen names for navigation
 */
export const SCREENS = {
  HOME: 'Home',
  NOTIFICATION: 'Notification',
  USER_MONEY_RESULT: 'UserMoneyResult',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  USER_SCREEN: 'UserScreen',
  SEARCH_USER: 'SearchUser',
  QR_SCAN: 'QrScan',
  CONTRACT: 'Contract',
  SEND_MONEY: 'SendMoney',
  DEBT_HISTORY: 'DebtHistory',
} as const;

// ============================================================================
// Event Types
// ============================================================================

/**
 * Socket event types
 */
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NOTIFICATION: 'notification',
  UPDATE: 'update',
  MESSAGE: 'message',
  ERROR: 'error',
} as const;

// ============================================================================
// Log Box Ignored Messages
// ============================================================================

/**
 * Messages to ignore in LogBox
 */
export const LOG_BOX_IGNORE_MESSAGES = [
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'new NativeEventEmitter',
] as const;

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * MMKV storage keys
 */
export const STORAGE_KEYS = {
  VERSION: 'version',
  TOKEN: 'token',
  USER: 'user',
  LANGUAGE: 'language',
  THEME: 'theme',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];
export type ScreenName = (typeof SCREENS)[keyof typeof SCREENS];
export type SocketEventType =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
