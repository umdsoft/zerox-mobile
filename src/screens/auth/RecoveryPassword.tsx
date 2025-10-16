// import {
//   StyleSheet,
//   View,
//   TextInput,
//   ScrollView,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   Text,
// } from 'react-native';
// import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
// import {useNavigation} from '@react-navigation/native';
// import {normalize, style} from '../../theme/style';

// import axios from 'axios';
// import OtherHeader from '../components/OtherHeader';
// import {URL} from '../constants';
// import Toast from 'react-native-toast-message';
// import {toastConfig} from '../components/ToastConfig';
// import {storage} from '../../store/api/token/getToken';
// import Loading from '../components/Loading';
// import Check from '../../images/CheckIcon';
// import PasswordInput from '../components/PasswordInput';
// import NewPasspord from '../../images/NewPassword';
// import MainText from '../components/MainText';
// import {colors} from '../../theme/colors';
// import {fontSize} from '../../theme/font';
// import {t} from 'i18next';
// const RecoveryPassword = () => {
//   // 1 type parolni uzgartirish
//   // 2 parolni tiklash
//   let scrollRef = useRef(null);

//   const navigation = useNavigation();

//   const [prevPas, setPrevPas] = useState('');
//   const [loading, setLoading] = useState(false);

//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [lower, setLower] = useState(false);
//   const [upper, setUpper] = useState(false);
//   const [number, setNumber] = useState(false);
//   const [space, setSpace] = useState(true);
//   const [symbole, setSymbole] = useState(false);
//   const [min, setMin] = useState(false);
//   const [disabled, setDisabled] = useState(true);

//   const onChangeText = text => {
//     setPassword(text);
//   };
//   const onPrevPassChangeText = text => {
//     console.log(text.split(''), 'text');
//     setPrevPas(text);
//   };

//   const changePasswordHandle = useCallback(async () => {
//     try {
//       console.log(storage.getString('token'));
//       setLoading(true);
//       const data = await fetch(URL + '/user/edit/password', {
//         body: JSON.stringify({
//           newPass: password,
//           prevPass: prevPas,
//         }),
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${storage.getString('token')}`,
//         },
//       });
//       const json = await data.json();
//       console.log(json, 'json');
//       if (json.code === 4) {
//         setLoading(false);
//         Toast.show({
//           autoHide: true,
//           visibilityTime: 3000,
//           position: 'bottom',
//           type: 'error2',
//           props: {
//             title: 'Xatolik',
//             desc: t('Yangi parol joriy paroldan farq qilishi lozim'),
//           },
//         });
//       }
//       if (json.code === 0) {
//         setLoading(false);
//         Toast.show({
//           autoHide: true,
//           visibilityTime: 3000,
//           position: 'bottom',
//           type: 'error2',
//           props: {title: 'Xatolik', desc: 'Bunday foydalanuvchi topilmadi.'},
//         });
//       }
//       if (json.code === 1) {
//         setLoading(false);
//         Toast.show({
//           autoHide: true,
//           visibilityTime: 3000,
//           position: 'bottom',
//           type: 'error2',
//           props: {
//             title: 'Xatolik',
//             desc: t('Joriy parolni noto‘g‘ri kiritdingiz'),
//           },
//         });
//       }
//       if (json.code === 2) {
//         setLoading(false);
//         Toast.show({
//           autoHide: true,
//           visibilityTime: 3000,
//           position: 'bottom',
//           type: 'omad',
//           props: {desc: t('changepassword')},
//         });
//         setTimeout(() => {
//           navigation.navigate('BottomTabNavigator');
//         }, 3000);
//       }
//       if (json.code === 3) {
//         Toast.show({
//           autoHide: true,
//           visibilityTime: 3000,
//           position: 'bottom',
//           type: 'error2',
//           props: {
//             title: 'Xatolik',
//             desc: 'Parolni o‘zgartirishda xatolik sodir bo‘ldi.',
//           },
//         });
//       }
//       setLoading(false);
//     } catch (error) {
//       console.log(error?.message);
//       console.error(JSON.stringify(error));
//       setLoading(false);
//     }
//   }, [password, prevPas, navigation]);

//   const renderValidation = useMemo(() => {
//     return (
//       <View style={{width: '90%', marginTop: 10}}>
//         <View style={styles.icon}>
//           <Check width={20} height={20} color={min ? 'green' : '#000'} />
//           <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
//             {/* {t('63')} */}
//             {t('78')}
//           </MainText>
//         </View>
//         <View style={styles.icon}>
//           <Check width={20} height={20} color={lower ? 'green' : '#000'} />
//           <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
//             {t('81')}
//           </MainText>
//         </View>
//         <View style={styles.icon}>
//           <Check width={20} height={20} color={upper ? 'green' : '#000'} />
//           <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
//             {t('75')}
//           </MainText>
//         </View>
//         <View style={styles.icon}>
//           <Check width={20} height={20} color={number ? 'green' : '#000'} />
//           <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
//             {t('84')}
//           </MainText>
//         </View>
//         <View style={styles.icon}>
//           <Check width={20} height={20} color={symbole ? 'green' : '#000'} />
//           <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
//             {t('87')}
//           </MainText>
//         </View>
//         <View style={styles.icon}>
//           <Check width={20} height={20} color={space ? 'green' : '#000'} />
//           <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
//             {t('90')}
//           </MainText>
//         </View>
//         <View style={styles.icon}>
//           <Check
//             width={20}
//             height={20}
//             color={password === confirmPassword ? 'green' : '#000'}
//           />
//           <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
//             {t('Yangi parollar mos kelmayapti')}
//           </MainText>
//         </View>
//       </View>
//     );
//   }, [lower, min, number, space, symbole, password, confirmPassword, upper]);

//   useEffect(() => {
//     if (
//       lower === true &&
//       upper === true &&
//       min === true &&
//       number === true &&
//       symbole === true &&
//       space === true &&
//       password === confirmPassword &&
//       prevPas.length > 0
//     ) {
//       setDisabled(false);
//     } else {
//       setDisabled(true);
//     }
//   }, [
//     confirmPassword,
//     lower,
//     min,
//     number,
//     password,
//     prevPas,
//     space,
//     symbole,
//     upper,
//   ]);

//   if (loading) {
//     return <Loading />;
//   }

//   return (
//     <View style={[styles.container]}>
//       <OtherHeader
//         title={t('678')}
//         titleColor="#000"
//         iconColor={'#fff'}
//         backgroundColor={style.blue}
//       />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
//         <ScrollView
//           contentContainerStyle={{bottom: 20}}
//           showsVerticalScrollIndicator={false}>
//           <View>
//             <View
//               style={{
//                 alignItems: 'center',
//                 // flex: 0.5,
//                 justifyContent: 'center',
//               }}>
//               <NewPasspord width={normalize(150)} height={normalize(150)} />
//             </View>

//             <View style={styles.main}>
//               <View
//                 style={{
//                   width: '90%',
//                   paddingLeft: 0,
//                   paddingRight: 0,
//                   marginBottom: 15,
//                 }}>
//                 <MainText color={colors.black} size={fontSize[12]}>
//                   {t('66')}
//                 </MainText>
//               </View>
//               <View
//                 style={[
//                   styles.TextInputLabelContainer,
//                   {marginTop: 15, marginBottom: 15},
//                 ]}>
//                 <View style={styles.title}>
//                   <MainText color={colors.black} size={fontSize[12]}>
//                     {t('693')}
//                   </MainText>
//                 </View>
//                 <View style={{flex: 1}}>
//                   <TextInput
//                     value={prevPas}
//                     onChangeText={onPrevPassChangeText}
//                     keyboardType="default"
//                     style={styles.TextInput}
//                   />
//                 </View>
//               </View>
//               <View style={{width: '90%'}}>
//                 <PasswordInput
//                   title={t('696')}
//                   password={password}
//                   onChangeText={onChangeText}
//                   setLower={setLower}
//                   setMin={setMin}
//                   setSymbole={setSymbole}
//                   setUpper={setUpper}
//                   setNumber={setNumber}
//                   setSpace={setSpace}
//                 />
//               </View>

//               <View style={[styles.TextInputLabelContainer, {marginTop: 15}]}>
//                 <View style={styles.title}>
//                   <MainText color={colors.black} size={fontSize[12]}>
//                     {t('699')}
//                   </MainText>
//                 </View>
//                 <View style={{flex: 1}}>
//                   <TextInput
//                     value={confirmPassword}
//                     onChangeText={text => {
//                       setConfirmPassword(text);
//                     }}
//                     keyboardType="default"
//                     style={styles.TextInput}
//                   />
//                 </View>
//               </View>
//               {renderValidation}
//             </View>
//             <View style={styles.enterButtonContainer}>
//               <TouchableOpacity
//                 disabled={disabled}
//                 activeOpacity={0.8}
//                 onPress={changePasswordHandle}
//                 style={[
//                   styles.enterButton,
//                   {
//                     backgroundColor: disabled
//                       ? style.disabledButtonColor
//                       : style.blue,
//                   },
//                 ]}>
//                 <MainText color={colors.white} size={fontSize[16]}>
//                   {t('93')}
//                 </MainText>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//       {/* <Toast config={toastConfig} /> */}
//     </View>
//   );
// };

// export default RecoveryPassword;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   title: {
//     position: 'absolute',
//     marginLeft: 15,
//     flex: 1,
//     zIndex: 1,
//     top: -10,
//     backgroundColor: '#fff',
//     paddingLeft: 5,
//     paddingRight: 5,
//   },
//   icon: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   phoneText: {
//     fontFamily: style.fontFamilyMedium,
//     fontSize: style.fontSize.small,
//     color: style.textColor,
//   },
//   text: type => {
//     return {
//       color: type ? 'green' : '#000',
//       marginLeft: 10,
//       fontFamily: style.fontFamilyMedium,
//       fontSize: style.fontSize.xx - 2,
//     };
//   },
//   retryPassword: {
//     position: 'absolute',
//     marginLeft: 15,
//     flex: 1,
//     zIndex: 1,
//     top: -10,
//     backgroundColor: '#fff',
//     paddingLeft: 5,
//     paddingRight: 5,
//   },
//   TextInputLabelContainer: {
//     borderColor: style.textColor,
//     borderWidth: 0.5,
//     borderRadius: 6,
//     width: '90%',
//     flexDirection: 'row',
//   },
//   enterButtonContainer: {
//     marginTop: 20,
//   },
//   main: {
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   enterButton: {
//     width: '90%',
//     backgroundColor: style.blue,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 10,
//     height: style.buttonHeight,
//     alignSelf: 'center',
//   },
//   enterText: {
//     fontFamily: style.fontFamilyMedium,
//     fontSize: style.fontSize.xs,
//     color: style.textColor,
//   },

//   TextInput: {
//     width: '100%',
//     height: style.textInputHeight,
//     borderTopRightRadius: 15,
//     borderBottomRightRadius: 15,
//     paddingLeft: 15,
//     fontSize: style.fontSize.small,
//     fontFamily: style.fontFamilyMedium,
//     color: style.textColor,
//   },
// });
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import { normalize, style } from '../../theme/style';

import Toast from 'react-native-toast-message';
import { storage } from '../../store/api/token/getToken';
import { t } from 'i18next';
import OtherHeader from '../components/OtherHeader';
import Loading from '../components/Loading';
import Check from '../../images/CheckIcon';
import NewPasswordIcon from '../../images/NewPassword';
import MainText from '../components/MainText';
import { colors, fontSize } from '../../theme';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
import { URL } from '../constants';

const PasswordInput = React.memo(
  ({
    value,
    onChangeText,
    secureTextEntry,
    title,
    showPassword,
    onTogglePassword,
  }) => (
    <View style={{ marginTop: 20 }}>
      <View style={styles.absoluteTitle}>
        <View style={styles.title}>
          <MainText
            color={colors.black}
            style={{ backgroundColor: '#fff' }}
            size={fontSize[12]}
          >
            {t(title)}
          </MainText>
        </View>
      </View>
      <TextInput
        allowFontScaling={false}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        style={styles.textInput}
      />
      <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
        {showPassword ? (
          <EyeClose width={24} height={24} color={style.blue} />
        ) : (
          <Eye width={24} height={24} color={style.blue} />
        )}
      </TouchableOpacity>
    </View>
  ),
);
const ValidationItem = React.memo(
  ({ isValid, text }: { isValid: boolean; text: string }) => (
    <View style={styles.validationItem}>
      <Check width={20} height={20} color={isValid ? 'green' : '#000'} />
      <MainText
        mrLeft={5}
        color={isValid ? 'green' : '#000'}
        style={styles.validationText}
      >
        {text}
      </MainText>
    </View>
  ),
);

const RecoveryPassword = () => {
  const navigation = useNavigation();
  const [state, setState] = useState({
    prevPassword: '',
    password: '',
    confirmPassword: '',
    loading: false,
    showPrevPassword: false,
    showPassword: false,
    showConfirmPassword: false,
  });

  const [validation, setValidation] = useState({
    lower: false,
    upper: false,
    number: false,
    space: true,
    symbol: false,
    min: false,
    match: false,
  });

  // Memoize the disabled state calculation
  const disabled = useMemo(() => {
    const { lower, upper, number, space, symbol, min, match } = validation;
    return !(
      lower &&
      upper &&
      number &&
      space &&
      symbol &&
      min &&
      match &&
      state.prevPassword.length > 0
    );
  }, [validation, state.prevPassword]);

  // Single handler for all password changes
  const handleChange = useCallback((field, value) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Toggle password visibility
  const togglePassword = useCallback(field => {
    setState(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Memoized password validation
  const validatePassword = useCallback(() => {
    const { password, confirmPassword } = state;
    setValidation({
      lower: /[\p{Ll}]/u.test(password), // any lowercase letter
      upper: /[\p{Lu}]/u.test(password),
      number: /\d/.test(password),
      space: !/\s/.test(password),
      symbol: /[^\p{L}\p{Nd}\s]/u.test(password),
      min: password.length >= 8,
      match: password === confirmPassword,
    });
  }, [state.password, state.confirmPassword]);

  // Only validate when passwords change
  useEffect(() => {
    validatePassword();
  }, [state.password, state.confirmPassword, validatePassword]);

  const showToast = useCallback((type, title, description) => {
    Toast.show({
      autoHide: true,
      visibilityTime: 3000,
      position: 'bottom',
      type: type,
      props: {
        title: title,
        desc: t(description),
      },
    });
  }, []);
  const handleResponse = useCallback(
    json => {
      switch (json.code) {
        case 4:
          showToast(
            'error2',
            t('Xatolik'),
            t('Yangi parol joriy paroldan farq qilishi lozim'),
          );
          break;
        case 0:
          showToast(
            'error2',
            t('Xatolik'),
            t('Bunday foydalanuvchi topilmadi.'),
          );
          break;
        case 1:
          showToast(
            'error2',
            t('Xatolik'),
            t('Joriy parolni noto‘g‘ri kiritdingiz'),
          );
          break;
        case 2:
          showToast('omad', '', t('changepassword'));
          setTimeout(() => navigation.navigate('BottomTabNavigator'), 3000);
          break;
        case 3:
          showToast(
            'error2',
            t('Xatolik'),
            t('Parolni o‘zgartirishda xatolik sodir bo‘ldi.'),
          );
          break;
        default:
          showToast('error', t('Xatolik'), t('Noma’lum xatolik yuz berdi.'));
      }
    },
    [navigation, showToast],
  );
  const changePasswordHandle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const response = await fetch(`${URL}/user/edit/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getString('token')}`,
        },
        body: JSON.stringify({
          newPass: state.password,
          prevPass: state.prevPassword,
        }),
      });
      const json = await response.json();

      setState(prev => ({ ...prev, loading: false }));
      handleResponse(json);
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
      setState(prev => ({ ...prev, loading: false }));
      showToast(
        'error',
        t('Xatolik'),
        t('Server bilan bog‘lanishda muammo yuzaga keldi'),
      );
    }
  }, [state.password, state.prevPassword, handleResponse, showToast]);
  // Memoize the validation UI to prevent unnecessary re-renders
  const renderValidation = useMemo(
    () => (
      <View style={styles.validationContainer}>
        <ValidationItem isValid={validation.min} text={t('78')} />
        <ValidationItem isValid={validation.lower} text={t('81')} />
        <ValidationItem isValid={validation.upper} text={t('75')} />
        <ValidationItem isValid={validation.number} text={t('84')} />
        <ValidationItem isValid={validation.symbol} text={t('87')} />
        <ValidationItem isValid={validation.space} text={t('90')} />
        <ValidationItem
          isValid={validation.match}
          text={t('Yangi parollar mos kelmayapti')}
        />
      </View>
    ),
    [validation],
  );

  if (state.loading) return <Loading />;

  return (
    <View style={styles.container}>
      <OtherHeader
        title={t('678')}
        titleColor="#000"
        iconColor="#fff"
        backgroundColor={style.blue}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ios: 60, android: 0})}> */}
        <View style={styles.iconContainer}>
          <NewPasswordIcon width={normalize(150)} height={normalize(150)} />
        </View>
        <View style={styles.mainContent}>
          <View style={styles.instructionContainer}>
            <MainText
              color={colors.black}
              textAlign="center"
              size={fontSize[14]}
            >
              {t('66')}
            </MainText>
          </View>

          <PasswordInput
            value={state.prevPassword}
            onChangeText={text => handleChange('prevPassword', text)}
            secureTextEntry={!state.showPrevPassword}
            title="693"
            showPassword={state.showPrevPassword}
            onTogglePassword={() => togglePassword('showPrevPassword')}
          />

          <PasswordInput
            value={state.password}
            onChangeText={text => handleChange('password', text)}
            secureTextEntry={!state.showPassword}
            title="696"
            showPassword={state.showPassword}
            onTogglePassword={() => togglePassword('showPassword')}
          />

          <PasswordInput
            value={state.confirmPassword}
            onChangeText={text => handleChange('confirmPassword', text)}
            secureTextEntry={!state.showConfirmPassword}
            title="699"
            showPassword={state.showConfirmPassword}
            onTogglePassword={() => togglePassword('showConfirmPassword')}
          />

          {renderValidation}

          <TouchableOpacity
            disabled={disabled}
            onPress={changePasswordHandle}
            style={[styles.button, disabled && styles.buttonDisabled]}
          >
            <MainText
              color={colors.white}
              size={fontSize[16]}
              ft={style.fontFamilyMedium}
              style={styles.buttonText}
            >
              {t('93')}
            </MainText>
          </TouchableOpacity>
        </View>
        {/* </KeyboardAvoidingView> */}
      </ScrollView>
    </View>
  );
};

export default RecoveryPassword;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollViewContent: { paddingBottom: 50 },
  iconContainer: { alignItems: 'center', marginVertical: 20 },
  mainContent: { paddingHorizontal: 20 },
  absoluteTitle: {
    position: 'absolute',
    zIndex: 1,
    top: -10,
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 17,
  },
  textInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 15,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: style.textColor,
  },
  validationContainer: { marginVertical: 10 },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  validationText: {
    marginLeft: 5,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyRegular,
  },
  title: {
    zIndex: 2,
    // width: '100%',
    paddingHorizontal: 5,
    marginLeft: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: style.blue,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    textAlign: 'center',
  },
  instructionContainer: {
    paddingLeft: 0,
    paddingRight: 0,
    marginBottom: 15,
    alignItems: 'center',
  },
});
