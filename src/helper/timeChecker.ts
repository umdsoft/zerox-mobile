import {t} from 'i18next';
import Toast from 'react-native-toast-message';
import {URL} from '../screens/constants';
import axios from 'axios';

const MAX_ALLOWED_DIFF_MS = 10 * 60 * 60 * 1000; // 24 hours in milliseconds
// 4 hours

export const checkPhoneTime = async (): Promise<boolean> => {
  try {
    const deviceDate = new Date();
    const {data, status} = await axios.get(URL + '/dashboard/get-time', {
      headers: {
        Connection: 'close',
      },
    });
    console.log('Server response:', data, 'Status:', status);
    console.log(data, 'data from server');
    const [datePart, timePart] = data.data.split(', ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    const dateObj = new Date(year, month - 1, day, hours, minutes, seconds);
    const serverDate = new Date(dateObj);
    console.log('Device Date:', deviceDate.toTimeString());
    console.log('Server Date:', serverDate.toTimeString());
    const diff = Math.abs(deviceDate.getTime() - serverDate.getTime());
    const isTimeValid = diff <= MAX_ALLOWED_DIFF_MS;
    if (!isTimeValid) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'top',
        type: 'error2',
        props: {
          desc: t('Serverga ulanishda xatolik yuz berdi'),
        },
      });
      return false;
    }
    return isTimeValid;
  } catch (error) {
    console.log('Error checking time:', JSON.stringify(error));
    Toast.show({
      autoHide: true,
      visibilityTime: 3000,
      position: 'top',
      type: 'error2',
      props: {
        desc: t('Serverga ulanishda xatolik yuz berdi'),
      },
    });

    return false; // allow usage if time check fails
  }
};

export const expire_passport_check = (expiry_date: string): boolean => {
  const today = new Date();
  const expireDate = new Date(expiry_date);
  const timeDiff = expireDate.getTime() - today.getTime();
  const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (dayDiff <= 1) {
    return true;
  }
  return false;
};
