import {combineReducers} from '@reduxjs/toolkit';
import RegisterWithPeoplePhoneNumberReducer from './RegisterWithPeoplePhoneNumberReducer';
import RegisterWithPeopleCheckSmsCodeReducer from './RegisterWithPeopleCheckSmsCodeReducer';
import LoginWithPhoneReducer from './LoginWithPhoneReducer';
import CreatePasswordReducer from './CreatePasswordReducer';
import HomeReducer from './HomeReducer';
import UserSearchReducer from './UserSearchReducer';
const appReducer = combineReducers({
  RegisterWithPeoplePhoneNumberReducer,
  RegisterWithPeopleCheckSmsCodeReducer,
  LoginWithPhoneReducer,
  CreatePasswordReducer,
  HomeReducer,
  UserSearchReducer,
});

// SESSIYA IZOLYATSIYASI: 'RESET_STORE' dispatch qilinganda BARCHA slice initial
// holatiga qaytadi (undefined state). Logout/login'da chaqiriladi — aks holda
// Redux singleton bo'lgani uchun oldingi foydalanuvchi ma'lumotlari (HomeReducer.user
// va h.k.) xotirada qolib, keyingi foydalanuvchiga "aralashib" ketardi.
export const rootReducer = (state: any, action: any) =>
  appReducer(action.type === 'RESET_STORE' ? undefined : state, action);
