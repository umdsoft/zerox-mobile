/**
 * Logging utility for the ZeroX application
 * Provides structured logging with different levels
 * In production, only warnings and errors are logged
 */

const IS_DEV = __DEV__;

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Log a debug message (only in development)
 * @param message - Debug message
 * @param data - Optional data to log
 */
export const logDebug = (message: string, data?: any): void => {
  if (IS_DEV) {
    console.log(`[${LogLevel.DEBUG}] ${message}`, data ?? '');
  }
};

/**
 * Log an info message (only in development)
 * @param message - Info message
 * @param data - Optional data to log
 */
export const logInfo = (message: string, data?: any): void => {
  if (IS_DEV) {
    console.info(`[${LogLevel.INFO}] ${message}`, data ?? '');
  }
};

/**
 * Log a warning message
 * @param message - Warning message
 * @param data - Optional data to log
 */
export const logWarn = (message: string, data?: any): void => {
  console.warn(`[${LogLevel.WARN}] ${message}`, data ?? '');
};

/**
 * Log an error message
 * @param message - Error message
 * @param error - Optional error object or data
 */
export const logError = (message: string, error?: any): void => {
  console.error(`[${LogLevel.ERROR}] ${message}`, error ?? '');
};

/**
 * Default export for backward compatibility
 */
export default {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
};
