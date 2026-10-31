module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    // Faqat haqiqiy fayl kengaytmasi (`/x.pdf`); '\\.' — aks holda `react-native-html-to-pdf` ham fileMock'ga tushardi.
    '[^/]+\\.(pdf|ttf|otf|mp3|mp4|lottie)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Faqat __tests__/*.test.* ; fixtures va ildizdagi tasodifiy fayllar test emas.
  testMatch: ['<rootDir>/__tests__/**/*.test.[jt]s?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-redux|@reduxjs|immer|reselect|redux|redux-thunk|react-native-.*|@shopify|@notifee|@legendapp|@hookform|i18next|react-i18next|victory-.*|d3-.*|socket.io-.*|engine.io-.*)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/fixtures/'],
};
