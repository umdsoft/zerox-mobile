import { t } from 'i18next';
import { logDebug } from '@src/log';
import Toast from 'react-native-toast-message';
import { URL } from '../screens/constants';

const MAX_ALLOWED_DIFF_MS = 10 * 60 * 60 * 1000; // 24 hours in milliseconds
// 4 hours

/**
 * Converts milliseconds to hours, minutes, and seconds
 * @param milliseconds - Time in milliseconds
 * @returns Object with hours, minutes, and seconds
 */
export const millisecondsToHMS = (
  milliseconds: number,
): { hours: number; minutes: number; seconds: number } => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return {
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
};

/**
 * Formats time difference between now and a target date
 * @param dateString - Target date string
 * @returns Formatted time string (e.g., "2h 30m" or "15m 45s")
 */
export const timeDifferenceFromNow = (dateString: string): string => {
  const now = new Date();
  const targetDate = new Date(dateString);
  const difference = targetDate.getTime() - now.getTime();

  if (difference < 0) {
    return '00:00:00';
  }

  const { hours, minutes, seconds } = millisecondsToHMS(difference);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Calculates remaining time until a deadline
 * @param deadline - Deadline date string
 * @returns Formatted time string showing remaining time
 */
export const getTimeLeft = (deadline: string): string => {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const timeLeft = deadlineTime - now;

  if (timeLeft <= 0) {
    logDebug('Deadline has passed');
    return 'Expired';
  }

  const { hours, minutes, seconds } = millisecondsToHMS(timeLeft);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}:${String(seconds).padStart(2, '0')}`;
};

export const checkPhoneTime = async (): Promise<boolean> => {
  try {
    const deviceDate = new Date();
    const response = await fetch(URL + '/dashboard/get-time', {
      headers: {
      },
      method: 'GET',
    });
    const data = await response.json();
    const [datePart, timePart] = data.data.split(', ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    const dateObj = new Date(year, month - 1, day, hours, minutes, seconds);
    const serverDate = new Date(dateObj);
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
