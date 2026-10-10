/**
 * Viloyat / tuman tanlash oynasi — markazlashgan DETACHED karta (fon qorayadi).
 * 10.10: QarzDaftariFaoliyat'dan ajratildi — do'kon yaratish va tahrirlash ekranlari umumiy ishlatadi.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { localizePlace } from '../../../helper/uzCyrillic';
import { rd, rs } from '../../../theme/rd';
import { CheckIcon } from '../redesign/icons';

const BLUE = '#2f6fed';

type Props = {
  visible: boolean;
  title: string;
  data: string[];
  selected: string;
  onPick: (value: string) => void;
  onClose: () => void;
};

const RegionPickerModal = ({ visible, title, data, selected, onPick, onClose }: Props) => {
  const { i18n } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={item => item}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => {
              const isSel = item === selected;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.row, isSel && styles.rowSel]}
                  onPress={() => onPick(item)}
                >
                  <Text style={[styles.rowText, isSel && styles.rowTextSel]} numberOfLines={1}>
                    {localizePlace(item, i18n.language)}
                  </Text>
                  {isSel && <CheckIcon size={rs(18)} color={BLUE} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default RegionPickerModal;

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(22) },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,18,32,0.6)' },
  card: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(16),
    paddingBottom: rs(14),
    paddingHorizontal: rs(16),
    maxHeight: '70%',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  title: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  close: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.textTertiary, paddingHorizontal: rs(4) },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(14),
    paddingHorizontal: rs(12),
    borderRadius: rs(12),
  },
  sep: { height: 1, backgroundColor: rd.color.border, marginHorizontal: rs(12) },
  rowSel: { backgroundColor: rd.color.primaryTint },
  rowText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(14.5), color: rd.color.text },
  rowTextSel: { fontFamily: rd.font.semibold, color: BLUE },
});
