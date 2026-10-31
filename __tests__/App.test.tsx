/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import App from '../App';
import {Store} from '../src/store/store/Store';

// App index.js'da Provider + NavigationContainer ichida render qilinadi — test ham shunday.
test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <NavigationContainer>
        <SafeAreaProvider>
          <Provider store={Store}>
            <App />
          </Provider>
        </SafeAreaProvider>
      </NavigationContainer>,
    );
  });
});
