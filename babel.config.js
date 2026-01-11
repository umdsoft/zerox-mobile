module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@src': './src',
          '@components': './src/screens/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@helper': './src/helper',
          '@theme': './src/theme',
          '@hooks': './src/hooks',
          '@images': './src/images',
          '@types': './src/types',
          '@constants': './src/constants',
        },
      },
    ],
  ],
};
