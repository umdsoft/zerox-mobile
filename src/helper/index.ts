import {t} from 'i18next';

export const textInputPlace = text => {
  const arr = [];
  text
    .toString()
    .split('')
    .forEach((item, i) => {
      if (item !== ' ') {
        arr.push(item);
      }
    });

  return arr.join('').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const toastMessage = type => {
  switch (type) {
    // case 1:
    //   return 'Qabul qilindi.';
    default:
      return t('243');
  }
};

export const checkningPeople = item => {
  switch (item.dtypes) {
    case 1:
      return item.dcompany;
    case 2:
      return ReturnName.returnDebitorName(item);
  }
};

export const settingDate = text => {
  const today = new Date(text);

  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};
export const checkDate = text => {
  const leta = text?.split('.')?.join('-');

  const today = new Date(leta);

  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};
