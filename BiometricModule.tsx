import {NativeModules} from 'react-native';

const {BiometricModule} = NativeModules;

export default {
  authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      BiometricModule.authenticate(
        (error: string) => reject(error),
        (success: string) => resolve(success),
      );
    });
  },
};
