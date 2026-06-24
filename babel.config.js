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
  env: {
    // Production build'da console.log/info/debug olib tashlanadi (error/warn qoladi).
    // Bridge orqali sinxron log overhead'i + token/PII oqishini yo'qotadi.
    production: {
      plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
    },
  },
};
