import type { User } from '../types';

// FISH ni TitleCase ko'rinishga keltiradi (server BOSH HARFLI/ALL CAPS beradi ->
// "BOLTAYEV BUNYODBEK" -> "Boltayev Bunyodbek"). Otasining ismi qo'shimchasi
// ("o'g'li"/"qizi"/"ug'li") KICHIK harfda qoladi. Faqat bildirishnomalarda.
// EKSPORT qilindi — DebtTakeFull/DebtTakePart kabi ekranlarда ham FISH ni
// (o'g'li/qizi kichik) TitleCase qilish uchun qayta ishlatiladi.
export const titleCase = (s: string): string =>
  String(s || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w =>
      /^(o.?g.?li|ug.?li|qizi)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(' ');

/**
 * Utility class for formatting user names
 */
export default class ReturnName {
  /**
   * Returns the full name of a creditor (TitleCase)
   * @param item - User object
   * @returns Formatted creditor name
   */
  public static returnCreditorName(item: User): string {
    return titleCase(
      `${item.c_last_name || ''} ${item.c_first_name || ''} ${
        item.c_middle_name || ''
      }`,
    );
  }

  /**
   * Returns the full name of a debitor (TitleCase)
   * @param item - User object
   * @returns Formatted debitor name
   */
  public static returnDebitorName(item: User): string {
    return titleCase(
      `${item.d_last_name || ''} ${item.d_first_name || ''} ${
        item.d_middle_name || ''
      }`,
    );
  }
}
