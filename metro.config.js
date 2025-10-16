const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const {
  resolver: { sourceExts, assetExts },
} = getDefaultConfig(__dirname);
const config = {
  transformer: {
    minifierPath: 'metro-minify-terser',
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    jsonExts: assetExts.filter(ext => ext !== 'json'),
    sourceExts: [...sourceExts, 'svg', 'json'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
