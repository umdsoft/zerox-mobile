import React from 'react';
import DrawerMenu from '../screens/home/redesign/DrawerMenu'; // redizayn burger menyu
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import {
  SelectLanguageScreen,
  AboutMe,
  AboutUs,
  Agree,
  ChangeEmail,
  ChangePassword,
  ChangePasswordRetry,
  ChangePhoneNumber,
  CharityDebt,
  CheckSmsPassword,
  CreatePassword,
  CreateSecretWord,
  CreditorDebitor,
  Debitor,
  DebtDateLength,
  DebtDateLengthAsk,
  DebtTakeFull,
  DebtTakePart,
  DebtTakeSelect,
  DownloadStatistic,
  FingerScanner,
  FullDebtBack,
  FullDebtSelect,
  GiveDebtUser,
  HistoryDebt,
  Indentifikatsiya,
  LoginWithPhone,
  NewPasswordEnter,
  Notification,
  PartDebtBack,
  PayScreen,
  QrCode,
  RecoveryPassword,
  Register,
  RegisterWithPeople,
  SearchDebitor,
  SearchJuridicUser,
  SearchUserScreen,
  SelectJuridical,
  SendMoney,
  SetLocalPassword,
  ShareDevices,
  Support,
  UseTerm,
  UserInformationOfDebt,
  UserMoneyResult,
  UserScreen,
  MuddatOzQolgan,
  Contract,
  Language,
  Security,
  UserDetails,
  ChangePhoneNumberSmsCheck,
  Dalol,
  Main,
  Pay,
  QrScan,
  SendMoneyHistory,
  ShowUserDetails,
  StatisticCreditor,
  StatisticDebitor,
  UserInfo,
  ChangeLocalPassword,
  ScanFaceMyId,
  ShowContract,
} from './Index';

import { style } from '../theme/style';

import { TransitionPresets } from '@react-navigation/stack';

import { storage } from '../store/api/token/getToken';
import EnterJsh from '../screens/auth/RecoveryPassword/EnterJsh';
import MyIdScreen from '../screens/auth/RecoveryPassword/MyIdScreen';
import UpdatePassword from '../screens/auth/RecoveryPassword/UpdatePassword';
import Types from '../screens/home/drawer/drawerScreens/Types';
import SmsHistory from '../screens/home/drawer/drawerScreens/SmsHistory';
import ResetPassCode from '../screens/other/ResetPassCode';
import UpdateLocalPassCode from '../screens/auth/UpdateLocalPassCode';
import NewsScreen from '../screens/other/NewsScreen';

import UpdatePasswordWithJshir from '../screens/auth/UpdatePasswordWithJshir';
import ChangePassportData from '../screens/ChangePassportData';
import RecoverySmsReset from '../screens/auth/RecoverySmsReset';
import QarzShartnomasi from '../screens/home/modules/QarzShartnomasi';
import QarzDaftari from '../screens/home/modules/QarzDaftari';
import ShaxsiyMoliya from '../screens/home/modules/ShaxsiyMoliya';
import QarzDaftariKiritish from '../screens/home/modules/QarzDaftariKiritish';
import QarzDaftariQarzlar from '../screens/home/modules/QarzDaftariQarzlar';
import QarzDaftariMijozlar from '../screens/home/modules/QarzDaftariMijozlar';
import QarzDaftariMijoz from '../screens/home/modules/QarzDaftariMijoz';
import QarzDaftariQarz from '../screens/home/modules/QarzDaftariQarz';
import QarzDaftariYangi from '../screens/home/modules/QarzDaftariYangi';
import QarzDaftariFaoliyat from '../screens/home/modules/QarzDaftariFaoliyat';
import QarzDaftariYopish from '../screens/home/modules/QarzDaftariYopish';
import QarzDaftariVozKechish from '../screens/home/modules/QarzDaftariVozKechish';
import QarzDaftariKvitansiya from '../screens/home/modules/QarzDaftariKvitansiya';
import QarzDaftariAmaliyotlar from '../screens/home/modules/QarzDaftariAmaliyotlar';

const Stack = createNativeStackNavigator();

const DrawerStack = createDrawerNavigator();
const allowSomeScreen = ['BottomTabNavigator'];

export const linking = {
  prefixes: ['zeroxuz://', 'https://zerox.uz'],
  config: {
    screens: {
      Click: 'Click',
      BottomTabNavigator: 'BottomTabNavigator',
      UserMoneyResult: 'UserMoneyResult',
    },
  },
};

const DrawerNavigator = () => {
  return (
    <DrawerStack.Navigator
      initialRouteName="StackNavigator"
      screenOptions={{
        // Menyu OCHIQ bo'lganda uni barmoq bilan chapga surib yopish mumkin
        // bo'lishi kerak. `swipeEnabled: false` da bu imkoniyat ham o'chib
        // qolardi — foydalanuvchi menyudan chiqolmay qolardi. `swipeEdgeWidth`
        // kichik bo'lgani uchun yopiq holatda tasodifan ochilib ketmaydi:
        // ochish uchun aynan chekkadan surish kerak.
        swipeEnabled: true,
        headerShown: false,
        drawerType: 'front',
        swipeEdgeWidth: 30,
        drawerAllowFontScaling: true,
        drawerStyle: {
          width: 308,
          zIndex: 1000,
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
        },
      }}
      drawerContent={props => <DrawerMenu {...props} />}
    >
      <DrawerStack.Screen
        name="StackNavigator"
        component={StackNavigator}
        options={({ route }) => {
          const routeName =
            getFocusedRouteNameFromRoute(route) ?? 'BottomTabNavigator';
          if (allowSomeScreen.includes(routeName)) {
            return {
              swipeEnabled: true,
            };
          }
        }}
      />
    </DrawerStack.Navigator>
  );
};

const AllNavigators = [
  { name: 'SelectLanguageScreen', component: SelectLanguageScreen },
  { name: 'ChangePassportData', component: ChangePassportData },
  { name: 'UpdatePasswordWithJshir', component: UpdatePasswordWithJshir },
  { name: 'SelectJuridical', component: SelectJuridical },
  { name: 'LoginWithPhone', component: LoginWithPhone },
  { name: 'RecoveryPassword', component: RecoveryPassword },
  { name: 'NewPasswordEnter', component: NewPasswordEnter },
  { name: 'RegisterWithJuridic', component: Register },
  { name: 'CheckSmsPassword', component: CheckSmsPassword },
  { name: 'Agree', component: Agree },
  { name: 'SetLocalPassword', component: SetLocalPassword },
  { name: 'CreateSecretWord', component: CreateSecretWord },
  { name: 'BottomTabNavigator', component: Main },
  { name: 'AboutUs', component: AboutUs },
  { name: 'QrCode', component: QrCode },
  { name: 'ShareDevices', component: ShareDevices },
  { name: 'AboutMe', component: AboutMe },
  { name: 'Support', component: Support },
  { name: 'SearchDebitor', component: SearchDebitor },
  { name: 'CreditorDebitor', component: CreditorDebitor },
  { name: 'DownloadStatistic', component: DownloadStatistic },
  { name: 'UserScreen', component: UserScreen },
  { name: 'RegisterWithPeople', component: RegisterWithPeople },
  { name: 'CreatePassword', component: CreatePassword },
  //7
  { name: 'ChangeEmail', component: ChangeEmail },
  //change email qoldi

  { name: 'ChangePhoneNumber', component: ChangePhoneNumber },
  //
  { name: 'Notification', component: Notification },
  //
  // {name: 'DebtLengthen', component: DebtLengthen},
  { name: 'Debitor', component: Debitor },
  { name: 'UserMoneyResult', component: UserMoneyResult },
  //
  { name: 'PayScreen', component: PayScreen },
  //
  { name: 'SearchUserScreen', component: SearchUserScreen },
  //
  { name: 'HistoryDebt', component: HistoryDebt },
  //
  { name: 'GiveDebtUser', component: GiveDebtUser },
  // bi qoldi
  { name: 'UserInformationOfDebt', component: UserInformationOfDebt },
  //bi qoldi
  { name: 'SearchJuridicUser', component: SearchJuridicUser },
  //
  { name: 'SendMoney', component: SendMoney },

  { name: 'ShowContract', component: ShowContract },

  { name: 'DebtDateLength', component: DebtDateLength },
  { name: 'DebtDateLengthAsk', component: DebtDateLengthAsk },
  { name: 'FullDebtSelect', component: FullDebtSelect },
  { name: 'FullDebtBack', component: FullDebtBack },
  { name: 'PartDebtBack', component: PartDebtBack },
  { name: 'ChangePassword', component: ChangePassword },
  { name: 'CharityDebt', component: CharityDebt },
  { name: 'DebtTakeSelect', component: DebtTakeSelect },
  { name: 'DebtTakeFull', component: DebtTakeFull },
  { name: 'DebtTakePart', component: DebtTakePart },
  { name: 'Indentifikatsiya', component: Indentifikatsiya },
  { name: 'FingerScanner', component: FingerScanner },
  { name: 'ChangePasswordRetry', component: ChangePasswordRetry },
  { name: 'ScanFaceMyId', component: ScanFaceMyId },
  { name: 'UseTerm', component: UseTerm },
  { name: 'MuddatOzQolgan', component: MuddatOzQolgan },
  { name: 'Pay', component: Pay },
  { name: 'Dalol', component: Dalol },
  { name: 'ShowUserDetails', component: ShowUserDetails },
  { name: 'QrScan', component: QrScan },
  { name: 'UserDetails', component: UserDetails },
  { name: 'Language', component: Language },
  { name: 'Contract', component: Contract },
  { name: 'Security', component: Security },
  { name: 'UserInfo', component: UserInfo },
  { name: 'StatisticDebitor', component: StatisticDebitor },
  { name: 'StatisticCreditor', component: StatisticCreditor },
  { name: 'SendMoneyHistory', component: SendMoneyHistory },
  { name: 'ChangePhoneNumberSmsCheck', component: ChangePhoneNumberSmsCheck },
  { name: 'ChangeLocalPassword', component: ChangeLocalPassword },
  { name: 'EnterJsh', component: EnterJsh },
  { name: 'MyIdScreen', component: MyIdScreen },
  { name: 'UpdatePassword', component: UpdatePassword },
  { name: 'Types', component: Types },
  { name: 'SmsHistory', component: SmsHistory },
  { name: 'NewsScreen', component: NewsScreen },
  {
    name: 'ResetPassCode',
    component: ResetPassCode,
  },
  { name: 'UpdateLocalPassCode', component: UpdateLocalPassCode },
  { name: 'RecoverySmsReset', component: RecoverySmsReset },
  // QarzShartnomasi / QarzDaftari endi BottomTabNavigator ichida TAB — bu yerda
  // (stack'da) qayta ro'yxatga olinmaydi (aks holda ikki nusxa bo'lardi).
  { name: 'ShaxsiyMoliya', component: ShaxsiyMoliya },
  { name: 'QarzDaftariKiritish', component: QarzDaftariKiritish },
  { name: 'QarzDaftariQarzlar', component: QarzDaftariQarzlar },
  { name: 'QarzDaftariMijozlar', component: QarzDaftariMijozlar },
  { name: 'QarzDaftariMijoz', component: QarzDaftariMijoz },
  { name: 'QarzDaftariQarz', component: QarzDaftariQarz },
  { name: 'QarzDaftariYangi', component: QarzDaftariYangi },
  { name: 'QarzDaftariFaoliyat', component: QarzDaftariFaoliyat },
  { name: 'QarzDaftariYopish', component: QarzDaftariYopish },
  { name: 'QarzDaftariVozKechish', component: QarzDaftariVozKechish },
  { name: 'QarzDaftariKvitansiya', component: QarzDaftariKvitansiya },
  { name: 'QarzDaftariAmaliyotlar', component: QarzDaftariAmaliyotlar },
];
const StackNavigator = () => {
  const is = storage.getString('k2');
  console.log(is, 'is');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        ...TransitionPresets.SlideFromRightIOS,
      }}
      initialRouteName={
        is === undefined ? 'SelectLanguageScreen' : 'SetLocalPassword'
      }
    >
      {AllNavigators.map((val, index) => {
        return (
          <Stack.Screen name={val.name} component={val.component} key={index} />
        );
      })}
    </Stack.Navigator>
  );
};

const Navigation = () => {
  return <DrawerNavigator />;
};
export default Navigation;
