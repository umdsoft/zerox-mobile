import React, {useEffect} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';

/** Majburiy route param'lar yetishmayaptimi (null/undefined). `params` null bo'lishi mumkin. */
export const missingRouteParams = (
  params: Record<string, unknown> | null | undefined,
  required: readonly string[],
): boolean => {
  // params umuman yo'q (push / tiklangan nav state) yoki majburiy kalit yo'q.
  if (params == null) return true;
  return required.some(k => params[k] == null);
};

/**
 * Ekranni "majburiy route param'siz crash"dan himoyalaydi: push'dan / tiklangan
 * nav state'dan param'siz ochilsa Inner MOUNT QILINMAYDI, goBack() (yo'q bo'lsa `fallbackRoute`: auth ekranlar uchun 'LoginWithPhone').
 */
export function withRequiredParams<P extends object>(
  Inner: React.ComponentType<P>,
  required: readonly string[],
  fallbackRoute = 'BottomTabNavigator',
): React.FC<P> {
  const Guard: React.FC<P> = props => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const missing = missingRouteParams(route.params, required);
    useEffect(() => {
      if (!missing) return;
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate(fallbackRoute);
    }, [missing, navigation]);
    return missing ? null : <Inner {...props} />;
  };
  Guard.displayName = `withRequiredParams(${Inner.displayName || Inner.name})`;
  return Guard;
}
