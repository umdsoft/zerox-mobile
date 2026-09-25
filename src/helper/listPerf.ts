// SS-PERF (2026-09-25): FlatList uchun umumiy virtualizatsiya sozlamalari.
// removeClippedSubviews faqat Android'da (iOS'da ba'zan qatorlar "yo'qolib" qoladi).
import { Platform } from 'react-native';

export const LIST_PERF_PROPS = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 7,
  removeClippedSubviews: Platform.OS === 'android',
} as const;
