/**
 * FinanceCategorySelect.tsx — kategoriya tanlash (web components/finance/CategorySelect.vue).
 * Trigger tugma -> bottom-sheet Modal: qidiruv + ro'yxat + inline "➕ Qo'shish" (emoji + nom).
 *
 * Props:
 *   value       — tanlangan id (yoki maqsad uchun emoji)
 *   categories  — [{id, icon, name}]
 *   accent      — hex rang (ko'k/yashil/binafsha)
 *   onSelect(id)
 *   onAdd({name, icon})   — ota API create qiladi (yoki lokal)
 *   placeholder, loading
 *   labelFn?    — nom -> ko'rsatish (default catLabel)
 *   onDelete?(c) — 21.10: berilsa, sheet'da "Tahrirlash" rejimi (🗑) + uzoq bosish orqali
 *                 o'chirish (tasdiq bilan). Ota API'ni chaqiradi; true = muvaffaqiyatli.
 *                 Fallback "Boshqalar" (default 'boshqalar' / 'other_income') o'chirilmaydi.
 */
import React from 'react';
import { t } from 'i18next';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { catLabel } from './financeMoney';
import {
  CheckIcon,
  ChevronRight,
  CloseIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from '../redesign/icons';

const EMOJIS = [
  '🛒', '🍔', '🏠', '🚗', '✈️', '💊', '👕', '📱', '💡', '💧', '🎓', '🎁',
  '🏦', '💼', '💰', '📈', '🎬', '🎵', '⚽', '🏋️', '🐶', '☕', '🧾', '🔧',
  '📚', '💳', '🎯', '🌴', '🍼', '🛠️',
];

const DANGER = '#EF4444';
// Fallback kategoriyalar (backend ham 400 qaytaradi): kategoriyasiz/Gap yozuvlari shularga tushadi.
const PROTECTED_DEFAULTS = ['boshqalar', 'other_income'];

export const isCategoryDeletable = (c: any): boolean => {
  if (!c || c.id == null) return false;
  const isDefault = c.is_default === true || Number(c.is_default) === 1;
  return !(isDefault && PROTECTED_DEFAULTS.includes(String(c.name)));
};

const FinanceCategorySelect = ({
  value,
  categories,
  accent,
  onSelect,
  onAdd,
  placeholder,
  loading,
  labelFn = catLabel,
  onDelete,
}: {
  value: any;
  categories: any[];
  accent: string;
  onSelect: (id: any) => void;
  onAdd?: (c: { name: string; icon: string }) => void;
  placeholder?: string;
  loading?: boolean;
  labelFn?: (name?: string) => string;
  onDelete?: (c: any) => Promise<boolean> | boolean;
}) => {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newIcon, setNewIcon] = React.useState('');
  const [editing, setEditing] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<any>(null);
  const [deleting, setDeleting] = React.useState(false);

  const selected = (categories || []).find(c => String(c?.id) === String(value));
  const filtered = (categories || []).filter(c =>
    labelFn(c?.name).toLowerCase().includes(q.trim().toLowerCase()),
  );

  const close = () => {
    setOpen(false);
    setAdding(false);
    setNewName('');
    setNewIcon('');
    setQ('');
    setEditing(false);
    setPendingDelete(null);
  };

  const canDelete = (c: any) => !!onDelete && isCategoryDeletable(c);

  const confirmDelete = async () => {
    if (!onDelete || !pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const ok = await onDelete(pendingDelete);
      if (ok) setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const submitAdd = () => {
    if (!newName.trim() || !onAdd) return;
    onAdd({ name: newName.trim(), icon: newIcon || '📦' });
    close();
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        style={[styles.trigger, open && { borderColor: accent }]}>
        <Text
          allowFontScaling={false}
          style={[styles.triggerText, !selected && styles.triggerPlaceholder]}
          numberOfLines={1}>
          {selected
            ? `${selected.icon ? selected.icon + '  ' : ''}${labelFn(selected.name)}`
            : placeholder || 'Kategoriyani tanlang'}
        </Text>
        <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text allowFontScaling={false} style={styles.sheetTitle}>
              {placeholder || 'Kategoriyani tanlang'}
            </Text>
            <View style={styles.headActions}>
              {onDelete && (
                <TouchableOpacity
                  onPress={() => {
                    setEditing(e => !e);
                    setPendingDelete(null);
                    setAdding(false);
                  }}
                  accessibilityRole="button"
                  style={[styles.editBtn, editing && { backgroundColor: accent + '14' }]}>
                  <Text allowFontScaling={false} style={[styles.editBtnText, { color: accent }]}>
                    {editing ? t('Tayyor') : t('Tahrirlash')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={close} style={styles.closeBtn}>
                <CloseIcon size={rs(18)} color={rd.color.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Qidiruv */}
          <View style={styles.searchBox}>
            <SearchIcon size={rs(17)} color={rd.color.textTertiary} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t('Qidirish...')}
              placeholderTextColor={rd.color.textTertiary}
              style={styles.searchInput}
              allowFontScaling={false}
            />
          </View>

          {/* Ro'yxat */}
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text allowFontScaling={false} style={styles.noCat}>
                {t('Kategoriya topilmadi')}
              </Text>
            ) : (
              filtered.map((c, i) => {
                const active = String(c?.id) === String(value);
                const deletable = canDelete(c);
                return (
                  <TouchableOpacity
                    key={c?.id ?? i}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (editing) {
                        if (deletable) setPendingDelete(c);
                        return;
                      }
                      onSelect(c.id);
                      close();
                    }}
                    onLongPress={deletable ? () => setPendingDelete(c) : undefined}
                    delayLongPress={350}
                    style={[styles.row, active && { backgroundColor: accent + '12' }]}>
                    <Text allowFontScaling={false} style={styles.rowIcon}>
                      {c?.icon || '📦'}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.rowName, active && { color: accent }]}
                      numberOfLines={1}>
                      {labelFn(c?.name)}
                    </Text>
                    {editing ? (
                      deletable && (
                        <TouchableOpacity
                          onPress={() => setPendingDelete(c)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityRole="button"
                          accessibilityLabel={t('O‘chirish')}
                          style={styles.trashBtn}>
                          <TrashIcon size={rs(16)} color={DANGER} />
                        </TouchableOpacity>
                      )
                    ) : (
                      active && <CheckIcon size={rs(16)} color={accent} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* 21.10: o'chirish tasdig'i — ichki Modal EMAS (iOS'da Modal ustida Modal ochilmaydi). */}
          {pendingDelete && (
            <View style={styles.confirmBox}>
              <Text allowFontScaling={false} style={styles.confirmTitle}>
                {`${pendingDelete.icon ? pendingDelete.icon + '  ' : ''}${labelFn(pendingDelete.name)}`}
              </Text>
              <Text allowFontScaling={false} style={styles.confirmText}>
                {`${t('Kategoriyani o‘chirasizmi?')} ${t('Avvalgi yozuvlar saqlanib qoladi.')}`}
              </Text>
              <View style={styles.confirmRow}>
                <TouchableOpacity
                  disabled={deleting}
                  onPress={() => setPendingDelete(null)}
                  style={[styles.confirmBtn, styles.confirmCancel]}>
                  <Text allowFontScaling={false} style={styles.confirmCancelText}>
                    {t('Bekor qilish')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={deleting}
                  onPress={confirmDelete}
                  style={[styles.confirmBtn, styles.confirmDelete, deleting && styles.dim]}>
                  <Text allowFontScaling={false} style={styles.confirmDeleteText}>
                    {t('O‘chirish')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Inline qo'shish */}
          {onAdd && !pendingDelete && !editing &&
            (adding ? (
              <View style={styles.addBox}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                  {EMOJIS.map(e => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setNewIcon(e)}
                      style={[
                        styles.emojiBtn,
                        newIcon === e && { borderColor: accent, backgroundColor: accent + '12' },
                      ]}>
                      <Text allowFontScaling={false} style={styles.emoji}>
                        {e}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.addInputRow}>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder={t('Kategoriya nomi')}
                    placeholderTextColor={rd.color.textTertiary}
                    style={styles.addInput}
                    allowFontScaling={false}
                    onSubmitEditing={submitAdd}
                  />
                  <TouchableOpacity
                    disabled={!newName.trim() || loading}
                    onPress={submitAdd}
                    style={[
                      styles.addSubmit,
                      { backgroundColor: accent },
                      (!newName.trim() || loading) && { opacity: 0.5 },
                    ]}>
                    <Text allowFontScaling={false} style={styles.addSubmitText}>
                      {t('Qo‘shish')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAdding(true)}
                style={styles.addTrigger}>
                <PlusIcon size={rs(16)} color={accent} />
                <Text allowFontScaling={false} style={[styles.addTriggerText, { color: accent }]}>
                  {t('Yangi kategoriya qo‘shish')}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      </Modal>
    </>
  );
};

export default FinanceCategorySelect;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
  },
  triggerText: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  triggerPlaceholder: { color: rd.color.textTertiary },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: rd.color.page,
    borderTopLeftRadius: rs(22),
    borderTopRightRadius: rs(22),
    paddingHorizontal: rs(16),
    paddingTop: rs(14),
    paddingBottom: rs(24),
    maxHeight: '76%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  sheetTitle: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  editBtn: {
    paddingHorizontal: rs(12),
    height: rs(32),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13.5) },
  trashBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: DANGER + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBox: {
    marginTop: rs(10),
    padding: rs(14),
    borderRadius: rs(14),
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: DANGER + '40',
  },
  confirmTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text },
  confirmText: {
    marginTop: rs(4),
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    lineHeight: rs(18),
    color: rd.color.textSecondary,
  },
  confirmRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
  confirmBtn: {
    flex: 1,
    borderRadius: rs(12),
    paddingVertical: rs(11),
    alignItems: 'center',
  },
  confirmCancel: { backgroundColor: rd.color.surfaceAlt },
  confirmDelete: { backgroundColor: DANGER },
  dim: { opacity: 0.6 },
  confirmCancelText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  confirmDeleteText: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: '#fff' },
  closeBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.pill,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    height: rs(46),
    marginBottom: rs(10),
  },
  searchInput: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.text, padding: 0 },
  list: { flexGrow: 0 },
  noCat: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    textAlign: 'center',
    paddingVertical: rs(24),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingHorizontal: rs(12),
    paddingVertical: rs(12),
    borderRadius: rs(12),
  },
  rowIcon: { fontSize: rs(20) },
  rowName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    marginTop: rs(10),
    paddingVertical: rs(12),
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: rd.color.border,
  },
  addTriggerText: { fontFamily: rd.font.semibold, fontSize: rs(13.5) },
  addBox: { marginTop: rs(10) },
  emojiRow: { flexGrow: 0, marginBottom: rs(10) },
  emojiBtn: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(8),
  },
  emoji: { fontSize: rs(20) },
  addInputRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  addInput: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(11),
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
  },
  addSubmit: {
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
  },
  addSubmitText: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: '#fff' },
});
