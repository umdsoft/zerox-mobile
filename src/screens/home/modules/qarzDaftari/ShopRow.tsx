import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { PencilIcon, StorefrontIcon } from '../../redesign/icons';
import { BLUE } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

interface ShopRowProps {
  item: any;
  /** Joriy tanlov (null = "Barcha do'konlar"). */
  shop: { id: number } | null;
  onPick: (item: any) => void;
  onEdit: (item: any) => void;
}

const ShopRow = ({ item, shop, onPick, onEdit }: ShopRowProps) => {
  const { t } = useTranslation();
  const isAll = !!item.__all;
  const selected = isAll ? !shop : !!shop && shop.id === Number(item.id);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.shopRow,
        // SS5 (2026-09-14): "Barcha do'konlar" qatori DOIM ochiq ko'k —
        // u do'kon emas, balki "filtрsiz ko'rinish" rejimi, shu bois
        // ro'yxatdagi haqiqiy do'konlardan vizual farq qilib turishi kerak.
        isAll && styles.shopRowAll,
        selected && styles.shopRowOn,
        isAll && selected && styles.shopRowAllOn,
      ]}
      onPress={() => onPick(item)}>
      <View style={styles.shopRowIcon}>
        <StorefrontIcon size={rs(18)} color={BLUE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.shopRowName, selected && { color: BLUE }]}
          numberOfLines={1}>
          {isAll ? t('Barcha do‘konlar') : item.nomi}
        </Text>
        {!isAll && !!item.is_xodim_role && (
          <Text style={styles.shopRowSub}>{t('Xodim')}</Text>
        )}
      </View>
      {/* Qator OXIRIDA — TAHRIRLASH tugmasi (ilgari oddiy `>` strelka
          edi; so'rov bo'yicha endi QALAM ikonkasi, chunki u shunchaki
          o'tish emas, do'konni BOSHQARISH oynasini ochadi:
          tahrirlash + xodimlar + karta ulash).
          Xodim o'zga egaga tegishli do'konni tahrirlay olmaydi. */}
      {!isAll && !item.is_xodim_role ? (
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.shopEditBtn}
          onPress={() => onEdit(item)}>
          <PencilIcon size={rs(18)} color={BLUE} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: rs(34) }} />
      )}
    </TouchableOpacity>
  );
};

export default ShopRow;
