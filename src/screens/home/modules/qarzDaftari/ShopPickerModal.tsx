import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { PlusIcon } from '../../redesign/icons';
import ShopRow from './ShopRow';
import { BLUE } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

interface ShopPickerModalProps {
  visible: boolean;
  shops: any[];
  shop: { id: number } | null;
  /** Ro'yxat noma'lum (oflayn va keshda yo'q). */
  shopsUnknown: boolean;
  /** Orqa fon / Android back: tanlovsiz yopish (kutilayotgan amal ham bekor bo'ladi). */
  onRequestClose: () => void;
  /** "✕" tugmasi: faqat modal yopiladi. */
  onCloseButton: () => void;
  onPick: (item: any) => void;
  onEdit: (item: any) => void;
  onAdd: () => void;
}

/** SS11-2: do'konlar ro'yxati — orqasi qoraygan modal. Ro'yxat BO'SH bo'lsa ham oxirida "Yangi do'kon qo'shish" turadi. */
const ShopPickerModal = ({
  visible,
  shops,
  shop,
  shopsUnknown,
  onRequestClose,
  onCloseButton,
  onPick,
  onEdit,
  onAdd,
}: ShopPickerModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}>
      <View style={styles.shopModalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
        <View style={styles.shopModalCard}>
          <View style={styles.shopModalHead}>
            <Text style={styles.shopModalTitle}>{t('Barcha do‘konlar')}</Text>
            <TouchableOpacity
              onPress={onCloseButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.shopModalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            /* SS13-5: 2+ do'konda ro'yxat boshida "Barcha do'konlar" qatori (tanlovni bekor qiladi).
               1 ta do'konda bunday qator KERAK EMAS (tanlov baribir bitta). */
            data={shops.length > 1 ? [{ __all: true }, ...shops] : shops}
            keyExtractor={(it: any, i: number) => (it?.__all ? 'all' : String(it?.id ?? i))}
            showsVerticalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            ItemSeparatorComponent={() => <View style={styles.shopSep} />}
            renderItem={({ item }: any) => (
              <ShopRow item={item} shop={shop} onPick={onPick} onEdit={onEdit} />
            )}
            ListEmptyComponent={
              <Text style={styles.shopEmpty}>
                {shopsUnknown
                  ? t('Bu ma’lumot oflayn saqlanmagan — internet tiklanganda yuklanadi')
                  : t('Do‘konlar yo‘q.')}
              </Text>
            }
          />
          <TouchableOpacity activeOpacity={0.85} style={styles.shopAddBtn} onPress={onAdd}>
            <PlusIcon size={rs(16)} color={BLUE} />
            <Text style={styles.shopAddText}>{t('Yangi do‘kon qo‘shish')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ShopPickerModal;
