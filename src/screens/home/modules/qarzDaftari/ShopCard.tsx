import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { ChevronRight, PlusIcon, StorefrontIcon } from '../../redesign/icons';
import { BLUE } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

interface ShopCardProps {
  title: string;
  sub: string;
  /** Do'kon YO'Q (ro'yxat ma'lum va bo'sh) -> "+" ikonka. */
  isEmpty: boolean;
  onPress: () => void;
}

/**
 * SS13: Hero ostidagi do'kon cardi.
 * - do'kon YO'Q  -> "Do'kon qo'shish" (bosilsa DARHOL yaratish sahifasi)
 * - aks holda    -> tanlangan do'kon nomi / "Barcha do'konlar"; bosilsa modalda ro'yxat ochiladi.
 */
const ShopCard = ({ title, sub, isEmpty, onPress }: ShopCardProps) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={styles.allShopsCard}>
    <View style={styles.allShopsIcon}>
      {isEmpty ? (
        <PlusIcon size={rs(20)} color={BLUE} />
      ) : (
        <StorefrontIcon size={rs(20)} color={BLUE} />
      )}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.allShopsTitle} numberOfLines={1}>{title}</Text>
      {!!sub && (
        <Text style={styles.allShopsSub} numberOfLines={1}>{sub}</Text>
      )}
    </View>
    <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
  </TouchableOpacity>
);

export default ShopCard;
