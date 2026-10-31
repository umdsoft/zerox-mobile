import React, { useRef } from 'react';
import { RefreshControl, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { t } from 'i18next';
import { LIST_PERF_PROPS } from '../../../helper/listPerf';
import { rd, rs } from '../../../theme/rd';
import { NotifItemBoundary } from '../notifications/all/NotifFallback';
import RdEmpty from './RdEmpty';
import { renderNotificationItem } from './renderNotificationItem';
import { useNotificationActions } from './useNotificationActions';
import { useNotificationFeed } from './useNotificationFeed';

const EmptyListComponent = () => <RdEmpty text={t('Bildirishnomalar mavjud emas')} />;

/** "Bildirishnoma" tabi: bildirishnomalar ro'yxati (har bir qator ErrorBoundary ichida). */
const Bildrishnoma = () => {
  const listRef = useRef(null);
  const feed = useNotificationFeed();
  const actions = useNotificationActions();

  // SS-DEV (2026-09-26): har bir qator ErrorBoundary ichida — bitta karta render'da yiqilsa (null maydon va h.k.)
  // faqat o'sha qator fallback bo'ladi, ro'yxat/ekran emas.
  const renderRow = ({ item }: { item: any; index: number }) => (
    <NotifItemBoundary item={item} okay={actions.okay}>
      {renderNotificationItem(item, actions)}
    </NotifItemBoundary>
  );

  return (
    <View style={{ flex: 1, backgroundColor: rd.color.page }}>
      <Animated.FlatList
        ref={listRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: rs(16), paddingBottom: rs(16) }}
        refreshControl={
          <RefreshControl refreshing={feed.loading} onRefresh={feed.onRefresh} tintColor={rd.color.primary} />
        }
        keyExtractor={item => item.id?.toString()}
        ListEmptyComponent={EmptyListComponent}
        data={feed.bild}
        onEndReachedThreshold={0.5}
        // SS-PERF (2026-09-25): 500 tagacha bildirishnoma — virtualizatsiya oynasi cheklandi
        // (ilgari default: 21 ekran oynasi, 50 ta boshlang'ich).
        {...LIST_PERF_PROPS}
        initialNumToRender={8}
        renderItem={renderRow}
      />
    </View>
  );
};

export default Bildrishnoma;
