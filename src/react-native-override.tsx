// src/react-native-override.ts
export * from 'react-native';
import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  TextProps,
  TextInputProps,
} from 'react-native';

export const Text = (props: TextProps) => (
  <RNText allowFontScaling={false} {...props} />
);

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  (props, ref) => <RNTextInput ref={ref} allowFontScaling={false} {...props} />,
);
