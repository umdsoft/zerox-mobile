import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Loading from '../components/Loading';
import axios from 'axios';
import DatePicker from 'react-native-date-picker';
import { URL } from '../constants';
import { t } from 'i18next';
import { MaskedTextInput } from 'react-native-advanced-input-mask';
import { rd, rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';
import { BuildingIcon, UserIcon, ChevronRight } from '../home/redesign/icons';

const SearchJuridicUser = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stir, setStir] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [userID, setUserID] = useState('');
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [focused, setFocused] = useState<'stir' | 'id' | null>(null);
  useEffect(() => {
    if (stir.length === 9) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [stir, userID]);
  const SearchUser = async () => {
    try {
      setLoading(true);
      setError(false);
      const { data, status } = await axios.post(
        URL + '/user/search',
        {
          id: userID,
          stir: stir,
          type: 2,
        },
        {
          headers: {},
        },
      );
      if (status === 200) {
        setData(data);
      }
    } catch (error) {
      setError(true);
    }
    setLoading(false);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('210')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          {/* STIR */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>STIRni kiriting</Text>
            <View
              style={[
                styles.inputWrap,
                focused === 'stir' && styles.inputWrapFocused,
              ]}
            >
              <BuildingIcon size={rs(18)} color={rd.color.textTertiary} />
              <TextInput
                value={stir}
                maxLength={9}
                placeholder="STIRni kiriting"
                onChangeText={text => setStir(text)}
                onFocus={() => setFocused('stir')}
                onBlur={() => setFocused(null)}
                placeholderTextColor={rd.color.textTertiary}
                keyboardType="numeric"
                allowFontScaling={false}
                style={styles.inputField}
              />
            </View>
          </View>

          {/* ID raqami */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ID raqamini kiriting</Text>
            <View
              style={[
                styles.inputWrap,
                focused === 'id' && styles.inputWrapFocused,
              ]}
            >
              <UserIcon size={rs(18)} color={rd.color.textTertiary} />
              <MaskedTextInput
                value={userID}
                placeholder="ID raqamini kiriting"
                autoCapitalize="characters"
                allowFontScaling={false}
                onChangeText={(formatted, extracted) => {
                  setUserID(extracted);
                }}
                onFocus={() => setFocused('id')}
                onBlur={() => setFocused(null)}
                mask="[000000]{/}[AA]"
                placeholderTextColor={rd.color.textTertiary}
                keyboardType="default"
                style={styles.inputField}
              />
            </View>
          </View>

          {error && (
            <Text style={styles.errorText}>Bunday foydalanuvchi topilmadi!</Text>
          )}

          <TouchableOpacity
            disabled={disabled}
            onPress={SearchUser}
            activeOpacity={0.8}
            style={[
              styles.primaryButton,
              disabled && styles.primaryButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                disabled && styles.primaryButtonTextDisabled,
              ]}
            >
              Izlash
            </Text>
          </TouchableOpacity>
        </View>

        {error === false && loading === false && data?.success && (
          <UserInfo user={data?.user} navigation={navigation} />
        )}
      </ScrollView>

      <DatePicker
        open={open}
        date={date}
        style={{
          backgroundColor: rd.color.surface,
          alignSelf: 'center',
        }}
        mode="date"
        confirmText="OK"
        cancelText={t('804')}
        theme="light"
        modal={true}
        minimumDate={new Date()}
        onCancel={() => {
          setOpen(false);
        }}
        title={t('801')}
        onConfirm={date => {
          setDate(date);
          setOpen(false);
        }}
      />
    </View>
  );
};

const UserInfo = ({ user, navigation }) => {
  const fullName =
    (user?.last_name || '') +
    ' ' +
    (user?.first_name || '') +
    ' ' +
    (user?.middle_name || '');

  const initials = (
    (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')
  ).toUpperCase();

  return (
    <View style={[styles.card, styles.userCard]}>
      {/* Foydalanuvchi kartasi */}
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          {initials ? (
            <Text style={styles.avatarText}>{initials}</Text>
          ) : (
            <UserIcon size={rs(24)} color={rd.color.primary} />
          )}
        </View>
        <View style={styles.userMeta}>
          <Text style={styles.userName} numberOfLines={2}>
            {fullName.trim()}
          </Text>
          <Text style={styles.userDetail}>ID: {user?.uid}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>FISH</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {`${user?.last_name} ${user?.first_name} ${user?.middle_name}`}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Ro`yxatdan o`tgan</Text>
        <Text style={styles.infoValue}>{user?.createdAt.slice(0, 10)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>ID raqami</Text>
        <Text style={styles.infoValue}>{user?.uid}</Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          navigation.navigate('UserInformationOfDebt');
        }}
        activeOpacity={0.8}
        style={[styles.primaryButton, styles.actionButton]}
      >
        <Text style={styles.primaryButtonText}>Ma’lumotlarni ko‘rish</Text>
        <ChevronRight size={rs(18)} color={rd.color.onPrimary} />
      </TouchableOpacity>
    </View>
  );
};

export default SearchJuridicUser;

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    paddingBottom: rs(40),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  userCard: {
    marginTop: rs(16),
  },
  fieldGroup: {
    marginBottom: rs(18),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    height: rs(56),
    paddingHorizontal: rs(16),
  },
  inputWrapFocused: {
    borderColor: rd.color.primary,
  },
  inputField: {
    flex: 1,
    marginLeft: rs(10),
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  errorText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.error,
    textAlign: 'center',
    marginBottom: rs(12),
  },
  primaryButton: {
    backgroundColor: rd.color.primary,
    height: rs(54),
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
  primaryButtonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
    textAlign: 'center',
  },
  primaryButtonTextDisabled: {
    color: rd.color.textTertiary,
  },
  actionButton: {
    marginTop: rs(20),
    paddingHorizontal: rs(12),
  },
  // UserInfo
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: rs(52),
    height: rs(52),
    borderRadius: rs(26),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(18),
    color: rd.color.primary,
  },
  userMeta: {
    flex: 1,
    marginLeft: rs(14),
  },
  userName: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  userDetail: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginTop: rs(4),
  },
  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(16),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(8),
  },
  infoLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginRight: rs(12),
  },
  infoValue: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
    textAlign: 'right',
  },
});
