import React from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { LocationIcon } from '../../../redesign/icons';
import MapPicker from '../../MapPicker';
import { formatCardInput, mapsLink, parseLatLng } from '../gapDetailLogic';
import { styles, TEAL } from '../gapDetailStyles';

interface Props {
  venueForm: Record<string, any> | null;
  setVenueForm: React.Dispatch<React.SetStateAction<any>>;
  showMap: boolean;
  setShowMap: (v: boolean) => void;
  saving: boolean;
  onSave: () => void;
}

/** SS11: plastik karta oynasi (BITTA oynada ikkalasi emas — `mode` ga qarab FAQAT bittasi). */
const CardFields = ({ venueForm, patch }: { venueForm: Props['venueForm']; patch: (p: Record<string, any>) => void }) => {
  const { t } = useTranslation();
  return (
    <>
      <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Plastik karta')}</Text>
      <View style={styles.cardField}>
        <Text allowFontScaling={false} style={styles.cardFieldLabel}>{t('💳 Plastik karta raqami')}</Text>
        <TextInput
          allowFontScaling={false}
          value={venueForm?.card_number}
          onChangeText={v => patch({ card_number: formatCardInput(v) })}
          placeholder="8600 1234 5678 9012"
          placeholderTextColor={rd.color.textTertiary}
          keyboardType="number-pad"
          style={styles.cardFieldInput}
        />
        <Text allowFontScaling={false} style={styles.cardFieldHint}>{t('A\'zolar shu raqamga pul o\'tkazadi.')}</Text>
      </View>
      {/* SS7: karta EGASINING ismi (ixtiyoriy) — pul boshqa joyga o'tib ketmasligi uchun. */}
      <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Karta egasi (ixtiyoriy)')}</Text>
      <TextInput
        allowFontScaling={false}
        value={venueForm?.card_holder}
        onChangeText={v => patch({ card_holder: v })}
        placeholder={t('Masalan: Abdullayev Abdulla')}
        placeholderTextColor={rd.color.textTertiary}
        style={styles.venueInput}
        maxLength={100}
      />
    </>
  );
};

const VenueFields = ({ venueForm, patch, onPickMap }: { venueForm: Props['venueForm']; patch: (p: Record<string, any>) => void; onPickMap: () => void }) => {
  const { t } = useTranslation();
  const coord = parseLatLng(venueForm?.location);
  return (
    <>
      <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Uchrashuv joyi')}</Text>
      <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Manzil')}</Text>
      <TextInput
        allowFontScaling={false}
        value={venueForm?.venue}
        onChangeText={v => patch({ venue: v })}
        placeholder={t('Masalan: Chilonzor, 5-kvartal, kafe')}
        placeholderTextColor={rd.color.textTertiary}
        style={styles.venueInput}
      />
      <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Lokatsiya (ixtiyoriy)')}</Text>
      {/* img8: havola joylashtirmasdan — ILOVA ICHIDA xaritadan belgilash. */}
      <TouchableOpacity style={styles.mapPickBtn} activeOpacity={0.85} onPress={onPickMap}>
        <LocationIcon size={rs(16)} color={TEAL} />
        <Text allowFontScaling={false} style={styles.mapPickText}>
          {coord ? 'Xaritada belgilangan — o‘zgartirish' : 'Xaritadan belgilash'}
        </Text>
      </TouchableOpacity>
      {!!coord && (
        <Text allowFontScaling={false} style={styles.mapCoord} numberOfLines={1}>
          {`${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}`}
        </Text>
      )}
    </>
  );
};

/** So'rov: uchrashuv joyi / plastik karta kiritish-tahrirlash modali + ilova ichi xarita (MapPicker). */
const GapVenueModal = ({ venueForm, setVenueForm, showMap, setShowMap, saving, onSave }: Props) => {
  const { t } = useTranslation();
  const close = () => setVenueForm(null);
  const patch = (p: Record<string, any>) => setVenueForm((f: any) => ({ ...f, ...p }));
  return (
    <>
      <Modal visible={!!venueForm} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.confirmCard}>
            {venueForm?.mode === 'card' ? (
              <CardFields venueForm={venueForm} patch={patch} />
            ) : (
              <VenueFields venueForm={venueForm} patch={patch} onPickMap={() => setShowMap(true)} />
            )}
            <View style={[styles.confirmBtns, { marginTop: rs(18) }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={close}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: TEAL }, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
                <Text style={styles.confirmDelText}>{t('Saqlash')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <MapPicker
        visible={showMap}
        initial={parseLatLng(venueForm?.location)}
        onClose={() => setShowMap(false)}
        onPick={c => {
          patch({ location: mapsLink(c.lat, c.lng) });
          setShowMap(false);
        }}
      />
    </>
  );
};

export default GapVenueModal;
