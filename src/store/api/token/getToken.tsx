import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'storage' });

const setStorageItem = (key: string, value: string | number | boolean) => {
  storage.set(key, value);
};
const getStorageItem = (key: string) => {
  return storage.getString(key)!;
};

const getStorageItemBoolean = (key: string) => {
  return storage.getBoolean(key);
};

const getStorageItemNumber = (key: string) => {
  return storage.getNumber(key);
};

const removeStorageItem = (key: string) => {
  storage.delete(key);
};
const clearStorageAll = () => {
  storage.clearAll();
};

export {
  storage,
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearStorageAll,
  getStorageItemBoolean,
  getStorageItemNumber,
};
