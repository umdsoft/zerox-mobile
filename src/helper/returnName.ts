import type { User } from '../types';

/**
 * Utility class for formatting user names
 */
export default class ReturnName {
  /**
   * Returns the full name of a creditor
   * @param item - User object
   * @returns Formatted creditor name
   */
  public static returnCreditorName(item: User): string {
    return `${item.c_last_name || ''} ${item.c_first_name || ''} ${
      item.c_middle_name || ''
    }`.trim();
  }

  /**
   * Returns the full name of a debitor
   * @param item - User object
   * @returns Formatted debitor name
   */
  public static returnDebitorName(item: User): string {
    return `${item.d_last_name || ''} ${item.d_first_name || ''} ${
      item.d_middle_name || ''
    }`.trim();
  }
}
