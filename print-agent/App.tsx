import React, { useState } from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings'>('home');

  if (currentScreen === 'settings') {
    return <SettingsScreen onBack={() => setCurrentScreen('home')} />;
  }

  return <HomeScreen onOpenSettings={() => setCurrentScreen('settings')} />;
}
