import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t } from 'i18next';
import Popover from 'react-native-popover-view';
import { Placement } from 'react-native-popover-view/dist/Types';
import { MaskedTextInput } from 'react-native-advanced-input-mask';
import { settingDate } from '../../../helper';
import QuestionMarkIcon from '../../../images/questionMark';
import { rd, rs } from '../../../theme/rd';
import { CalendarIcon, IdCardIcon, SearchIcon } from '../../home/redesign/icons';
import HeroGradient from './HeroGradient';
import SearchPulse from './SearchPulse';
import { ACCENT_GIVE } from './searchUserLogic';
import { styles } from './searchUserStyles';

interface SearchFormProps {
  type: number;
  accent: typeof ACCENT_GIVE;
  userID: string;
  setUserID: (v: string) => void;
  focused: boolean;
  setFocused: (v: boolean) => void;
  date: Date | null;
  datePickerOpen: boolean;
  openDatePicker: () => void;
  disabled: boolean;
  onSearch: () => void;
}

/** Qidiruv formasi: hero (gradient + animatsiyali ikonka), ID maydoni, tug'ilgan sana, "Qidirish" tugmasi. */
const SearchForm = ({
  type,
  accent,
  userID,
  setUserID,
  focused,
  setFocused,
  date,
  datePickerOpen: open,
  openDatePicker,
  disabled,
  onSearch: SearchUser,
}: SearchFormProps) => (
  <>
    {/* SS-DEV (2026-10-05): yangi hero — gradient (berish: ko'k, olish:
        yashil) + animatsiyali ikonka (odam silueti, pulsli halqalar,
        atrofida aylanuvchi lupa). Matn o'zgarmagan. */}
    <View style={styles.heroCard}>
      <HeroGradient stops={accent.gradient} id={`srch${type}`} />
      <View style={styles.heroDecor1} />
      <View style={styles.heroDecor2} />
      <SearchPulse color={accent.solid} />
      <Text style={styles.heroCardTitle} allowFontScaling={false}>
        {type === 1 ? t('Qarz berish') : t('Qarz olish')}
      </Text>
    </View>

    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: accent.solid }]} />
    {/* Foydalanuvchi ID */}
    <View style={styles.fieldGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{t('210')}</Text>
        <Popover
          placement={Placement.BOTTOM}
          popoverStyle={styles.tooltip}
          backgroundStyle={styles.tooltipBackdrop}
          arrowSize={{ width: rs(16), height: rs(9) }}
          from={
            <TouchableOpacity
              style={{ marginLeft: rs(6) }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <QuestionMarkIcon
                width={rs(18)}
                height={rs(18)}
                color={rd.color.primary}
              />
            </TouchableOpacity>
          }
        >
          <View style={styles.tooltipInner}>
            <Text style={styles.tooltipText} allowFontScaling={false}>
              {t('130')}
            </Text>
          </View>
        </Popover>
      </View>

      <View
        style={[
          styles.inputWrap,
          focused && { borderColor: accent.solid },
        ]}
      >
        <View style={[styles.fieldIcon, { backgroundColor: accent.tint }]}>
          <IdCardIcon size={rs(18)} color={accent.solid} />
        </View>
        <MaskedTextInput
          value={userID}
          placeholder="100000/AA"
          autoCapitalize="characters"
          allowFontScaling={false}
          onChangeText={(formatted, extracted) => {
            setUserID(extracted.toUpperCase());
          }}
          mask="[000000]{/}[AA]"
          placeholderTextColor={rd.color.textTertiary}
          keyboardType="default"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.inputField}
        />
      </View>
    </View>

    {/* Tug'ilgan sana */}
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { marginBottom: rs(8) }]}>
        {t('213')}
      </Text>
      <TouchableOpacity
        onPress={openDatePicker}
        activeOpacity={0.8}
        style={[styles.dateInput, open && { borderColor: accent.solid }]}
      >
        <View style={[styles.fieldIcon, { backgroundColor: accent.tint }]}>
          <CalendarIcon size={rs(18)} color={accent.solid} />
        </View>
        {!date ? (
          <Text style={styles.datePlaceholder} allowFontScaling={false}>
            {t('kk.oo.yyyy')}
          </Text>
        ) : (
          <Text style={styles.dateValue} allowFontScaling={false}>
            {settingDate(date)}
          </Text>
        )}
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      disabled={disabled}
      onPress={SearchUser}
      activeOpacity={0.8}
      style={[
        styles.primaryButton,
        { backgroundColor: accent.solid, shadowColor: accent.solid },
        disabled && styles.primaryButtonDisabled,
      ]}
    >
      <View style={styles.btnIcon}>
        <SearchIcon
          size={rs(18)}
          color={disabled ? rd.color.textTertiary : rd.color.onPrimary}
        />
      </View>
      <Text
        style={[
          styles.primaryButtonText,
          disabled && styles.primaryButtonTextDisabled,
        ]}
      >
        {t('216')}
      </Text>
    </TouchableOpacity>
    </View>
  </>
);

export default SearchForm;
