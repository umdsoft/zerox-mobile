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
    return `${item.clastName || ''} ${item.cfirstName || ''} ${
      item.cmiddleName || ''
    }`.trim();
  }

  /**
   * Returns the full name of a debitor
   * @param item - User object
   * @returns Formatted debitor name
   */
  public static returnDebitorName(item: User): string {
    return `${item.dlastName || ''} ${item.dfirstName || ''} ${
      item.dmiddleName || ''
    }`.trim();
  }
}
