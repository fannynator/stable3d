import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kotucheniy.app',
  appName: 'Кот Учёный',
  webDir: 'dist',
  backgroundColor: '#F0EBFF',
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,
  },
};

export default config;
