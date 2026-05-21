const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

try {
  const { withNativeWind } = require('nativewind/metro');
  module.exports = withNativeWind(config, { input: './global.css' });
} catch {
  // nativewind not installed — class names won't be styled but app will start
  module.exports = config;
}
