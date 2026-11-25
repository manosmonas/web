const fs = require('node:fs');
const path = require('node:path');

const hasFirebaseConfig = fs.existsSync(path.join(__dirname, 'google-services.json'));

module.exports = {
  name: 'Manos Monas Club',
  slug: 'manos-monas-club-android',
  version: '0.1.0',
  android: {
    package: 'pe.manosmonas.club.android',
    ...(hasFirebaseConfig ? { googleServicesFile: './google-services.json' } : {}),
  },
  plugins: ['@react-native-firebase/app', '@react-native-firebase/auth', '@react-native-google-signin/google-signin'],
};
