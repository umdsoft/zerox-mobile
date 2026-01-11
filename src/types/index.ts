/**
 * Central type definitions for the ZeroX application
 * This file consolidates commonly used types to improve type safety throughout the codebase
 */

// ============================================================================
// User Types
// ============================================================================

/**
 * User type identifier
 * 1 = Company/Organization
 * 2 = Individual Person
 */
export type UserType = 1 | 2;

/**
 * Base user interface with common properties
 */
export interface BaseUser {
  id: string | number;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Company/Organization user
 */
export interface CompanyUser extends BaseUser {
  dtypes: 1;
  dcompany: string;
  ctypes?: 1;
  ccopmany?: string;
}

/**
 * Individual person user
 */
export interface PersonUser extends BaseUser {
  dtypes: 2;
  dfirstName?: string;
  dlastName?: string;
  dmiddleName?: string;
  ctypes?: 2;
  cfirstName?: string;
  clastName?: string;
  cmiddleName?: string;
}

/**
 * Union type for any user (company or person)
 */
export type User = CompanyUser | PersonUser;

// ============================================================================
// Debt/Transaction Types
// ============================================================================

/**
 * Debt status types
 */
export type DebtStatus =
  | 'active'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled';

/**
 * Transaction type
 */
export type TransactionType = 'debt' | 'payment' | 'transfer';

/**
 * Debt/Transaction item
 */
export interface DebtItem {
  id: string | number;
  amount: number;
  currency?: string;
  date?: string;
  deadline?: string;
  status?: DebtStatus;
  type?: TransactionType;
  description?: string;
  creditor?: User;
  debitor?: User;
  ctypes?: UserType;
  dtypes?: UserType;
  ccopmany?: string;
  dcompany?: string;
  cfirstName?: string;
  clastName?: string;
  cmiddleName?: string;
  dfirstName?: string;
  dlastName?: string;
  dmiddleName?: string;
}

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Screen names in the application
 */
export type ScreenName =
  | 'Home'
  | 'Notification'
  | 'UserMoneyResult'
  | 'Profile'
  | 'Settings'
  | 'UserScreen'
  | 'SearchUser'
  | 'QrScan'
  | 'Contract'
  | 'SendMoney'
  | 'DebtHistory'
  | string; // Allow other screen names

/**
 * Navigation parameters for screens
 */
export type NavigationParams = {
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Common loading state
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

/**
 * Modal props
 */
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
}

/**
 * List item props
 */
export interface ListItemProps<T = any> {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  item: T;
  index: number;
  onPress?: (item: T) => void;
  onLongPress?: (item: T) => void;
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification data from Firebase
 */
export interface NotificationData {
  id: string | number;
  title?: string;
  body?: string;
  data?: {
    [key: string]: string;
  };
  type?: string;
  timestamp?: string;
}

// ============================================================================
// Socket/Real-time Types
// ============================================================================

/**
 * Socket event names
 */
export type SocketEvent =
  | 'connect'
  | 'disconnect'
  | 'notification'
  | 'update'
  | 'message'
  | string;

/**
 * Socket event callback
 */
export type SocketCallback<T = any> = (data: T) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

// ============================================================================
// Form/Input Types
// ============================================================================

/**
 * Input validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Form field state
 */
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties of T required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Extract promise result type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
