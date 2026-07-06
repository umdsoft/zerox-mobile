import {createAsyncThunk} from '@reduxjs/toolkit';
import {successStatus, URL} from '../../../screens/constants';
import axios from 'axios';
import {storage} from '../token/getToken';
import {Platform} from 'react-native';

const CreatePasswordSendApi = createAsyncThunk(
  'user/phone/createPassword',
  async (state, {rejectWithValue}) => {
    const {phone, password, code} = state;
    try {
      const {data, status} = await axios.post(
        URL + '/user/register',
        {
          phone: '+998' + phone,
          password: password,
          code: code,
          step: 3,
          type: 2,
        },
        {
          headers: {
          },
        },
      );
      if (status === successStatus) {
        return data;
      }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);
const LoginWithPhoneSendPasswordApi = createAsyncThunk(
  'user/phone/password',
  async (state, {rejectWithValue}) => {
    const {phone, password} = state;

    try {
      const {data, status} = await axios.post(
        URL + '/user/login',
        {
          phone: '+998' + phone,
          password: password,
          device: Platform.OS === 'ios' ? 'iOS' : 'Android',
        },
        {
          headers: {
          },
        },
      );

      if (status === successStatus) {
        return data;
      }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);
const SmsCheckCodeApi = createAsyncThunk(
  'user/sms/check/code',
  async (state, {rejectWithValue}) => {
    const {phone, code} = state;
    try {
      const {data, status} = await axios.post(
        URL + '/user/register',
        {
          phone: '+998' + phone,
          code: code,
          type: 2,
          step: 2,
        },
        {
          headers: {
          },
        },
      );
      if (status === successStatus) {
        return data;
      }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);
const UserDataPostApi = createAsyncThunk(
  'user/register',
  async (number, {rejectWithValue}) => {
    try {
      const lang = storage.getString('lang');
      const {data} = await axios.post(
        URL + '/user/phoneChangeReg',
        {
          phone: '+998' + number,
          lang: lang,
        },
        {
          headers: {
          },
        },
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        'Ushbu telefon raqami tizimda muqaddam ro’yxatga olingan. Iltimos, ro’yxatdan o’tish uchun boshqa telefon raqamidan foydalaning',
      );
    }
  },
);

// Ro'yxatdan o'tishda SMS kodni QAYTA yuborish — backend step:1 ni qayta chaqirsak,
// kod qayta generatsiya qilinib SMS yuboriladi (User.js register step==1: is_active==2
// && code!=null bo'lsa kodni yangilab SMS yuboradi). Ilgari xato bo'yicha phoneChangeReg
// (telefon almashtirish) endpointi ishlatilardi — bu ro'yxatdan o'tish oqimi emas.
const RegisterResendSmsApi = createAsyncThunk(
  'user/register/resend',
  async (phone, {rejectWithValue}) => {
    try {
      const lang = storage.getString('lang') ?? 'uz';
      const {data, status} = await axios.post(URL + '/user/register', {
        phone: '+998' + phone,
        lang,
        step: 1,
        type: 2,
      });
      if (status === successStatus) {
        return data;
      }
    } catch (error) {
      return rejectWithValue(
        error?.response?.data ?? {message: 'network-error'},
      );
    }
  },
);

const UpdatePasswordWithJshirApi = createAsyncThunk(
  'user/password/update',
  async (state, {rejectWithValue}) => {
    const {phone} = state;
    try {
      const {data, status} = await axios.post(
        URL + '/user/check-user',
        {
          phone: '+998' + phone,
          lang: storage.getString('lang') ?? 'uz',
          type: 2,
        },
        {
          headers: {
          },
        },
      );
      if (status === successStatus) {
        return data;
      }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export {
  CreatePasswordSendApi,
  LoginWithPhoneSendPasswordApi,
  SmsCheckCodeApi,
  UserDataPostApi,
  RegisterResendSmsApi,
  UpdatePasswordWithJshirApi,
};
