import React from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return <AppNavigator />;
}

export default registerRootComponent(App);
