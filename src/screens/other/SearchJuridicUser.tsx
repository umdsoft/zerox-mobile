import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { BackGroundIcon } from '../../helper/homeIcon';
import { style } from '../../theme/style';

import { useNavigation } from '@react-navigation/native';
import Loading from '../components/Loading';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
// import TextInputMask from 'react-native-text-input-mask';
import axios from 'axios';
import DatePicker from '@react-native-community/datetimepicker';
import { URL } from '../constants';
import OtherHeader from '../components/OtherHeader';
import { t } from 'i18next';
import { MaskedTextInput } from 'react-native-advanced-input-mask';
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
        URL + +'/user/search',
        {
          id: userID,
          stir: stir,
          type: 2,
        },
        {
          headers: {
            Connection: 'close',
          },
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
      <View
        style={{
          width: style.width,
          position: 'absolute',
          height: style.height / 3,
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('210')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={styles.main}>
            <View style={styles.aboutUsContainer}>
              <View
                style={{
                  width: '100%',
                  alignSelf: 'center',
                  marginVertical: 20,
                }}
              >
                <View style={{ alignSelf: 'center' }}>
                  <View style={styles.TextInputLabelContainer}>
                    <View style={styles.inputTitle}>
                      <Text style={styles.phoneText}>STIRni kiriting</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        value={stir}
                        maxLength={9}
                        placeholder="STIRni kiriting"
                        onChangeText={text => setStir(text)}
                        placeholderTextColor={style.placeHolderColor}
                        keyboardType="numeric"
                        style={[styles.TextInput, { paddingLeft: 15 }]}
                      />
                    </View>
                  </View>
                  <View style={styles.TextInputLabelContainer}>
                    <View style={styles.inputTitle}>
                      <Text style={styles.phoneText}>ID raqamini kiriting</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <MaskedTextInput
                        value={userID}
                        placeholder="ID raqamini kiriting"
                        autoCapitalize="characters"
                        onChangeText={(formatted, extracted) => {
                          setUserID(extracted);
                        }}
                        mask="[000000]{/}[AA]"
                        placeholderTextColor={style.placeHolderColor}
                        keyboardType="default"
                        style={[styles.TextInput, { paddingLeft: 15 }]}
                      />
                    </View>
                  </View>
                </View>
                {error && (
                  <Text
                    style={{
                      color: 'red',
                      fontFamily: style.fontFamilyMedium,
                      fontSize: style.fontSize.small,
                      alignSelf: 'center',
                      marginTop: 8,
                    }}
                  >
                    Bunday foydalanuvchi topilmadi!
                  </Text>
                )}
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20,
                  }}
                >
                  <TouchableOpacity
                    disabled={disabled}
                    onPress={SearchUser}
                    activeOpacity={0.8}
                    style={[
                      styles.registerButton,
                      {
                        backgroundColor: disabled
                          ? style.disabledButtonColor
                          : style.blue,
                      },
                    ]}
                  >
                    <Text style={styles.textButton}>Izlash</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          {error === false && loading === false && data?.success && (
            <UserInfo user={data?.user} navigation={navigation} />
          )}
        </View>
      </ScrollView>
      {open && (
        <DatePicker
          open={open}
          date={date}
          style={{
            backgroundColor: '#fff',
            alignSelf: 'center',
          }}
          mode="date"
          confirmText="OK"
          cancelText={t('804')}
          theme="light"
          modal={true}
          onCancel={() => {
            setOpen(false);
          }}
          title="Tug’ilgan sanani kiriting"
          onConfirm={date => {
            setDate(date);
            setOpen(false);
          }}
        />
      )}
      {/* <Toast config={toastConfig} /> */}
      {/* <DateModal
        open={open}
        setOpen={setOpen}
        date={date}
        setDate={setDate}
        title={`Tug'ulgan sanangizni \nkiriting`}
      /> */}
    </View>
  );
};

const UserInfo = ({ user, navigation }) => {
  return (
    <View style={styles.main}>
      <View style={styles.aboutUsContainer}>
        <View
          style={{
            flex: 1,
            width: '90%',
            alignSelf: 'center',
            marginVertical: 20,
          }}
        >
          <View>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('UserInformationOfDebt');
              }}
              activeOpacity={0.8}
              style={styles.getUserInfoButton}
            >
              <Text
                style={[styles.textButton, { fontSize: style.fontSize.small }]}
              >
                Ma’lumotlarni ko‘rish
              </Text>
            </TouchableOpacity>
          </View>
          <View>
            <View style={[styles.TextInputLabelContainer, { width: '100%' }]}>
              <View style={styles.inputTitle}>
                <Text style={styles.phoneText}>FISH : </Text>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={
                    `${user?.last_name} ${user?.first_name} ${user?.middle_name}` ||
                    null
                  }
                  placeholderTextColor={style.placeHolderColor}
                  editable={false}
                  keyboardType="default"
                  style={[styles.TextInput, { paddingLeft: 15 }]}
                />
              </View>
            </View>
            <View style={[styles.TextInputLabelContainer, { width: '100%' }]}>
              <View style={styles.inputTitle}>
                <Text style={styles.phoneText}>Ro`yxatdan o`tgan:</Text>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  editable={false}
                  placeholderTextColor={style.placeHolderColor}
                  value={user?.createdAt.slice(0, 10)}
                  keyboardType="default"
                  style={[styles.TextInput, { paddingLeft: 15 }]}
                />
              </View>
            </View>
            <View style={[styles.TextInputLabelContainer, { width: '100%' }]}>
              <View style={styles.inputTitle}>
                <Text style={styles.phoneText}>ID raqami:</Text>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  placeholderTextColor={style.placeHolderColor}
                  value={user?.uid}
                  editable={false}
                  keyboardType="default"
                  style={[styles.TextInput, { paddingLeft: 15 }]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SearchJuridicUser;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  dateText: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
    textAlign: 'center',
  },
  registerButton: {
    width: '90%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  getUserInfoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    width: style.width / 3,
    borderRadius: 10,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
    marginTop: 20,
  },
  title: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyBold,
    color: style.textColor,
  },

  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginBottom: 10,
  },
});
