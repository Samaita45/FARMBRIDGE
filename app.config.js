const appJson = require('./app.json');

/**
 * Maps SDK keys are build-time only. They are injected into native config and
 * never become EXPO_PUBLIC_* values, so they do not ship in the JS bundle.
 *
 * Prefer the platform-specific keys. GOOGLE_MAPS_API_KEY remains a fallback for
 * local checkouts that have not split them yet — but it is announced rather
 * than silent, because a key serving both platforms cannot carry either
 * platform's restriction. Android restriction is by package name and signing
 * SHA-1; iOS is by bundle identifier; a key that must satisfy both can be
 * restricted to neither, and an unrestricted Maps key on a public listing is
 * extracted from the APK within days.
 */
function resolveMapsKey(platform, specific) {
  if (specific) return specific;

  const shared = process.env.GOOGLE_MAPS_API_KEY || '';
  if (shared) {
    console.warn(
      `[app.config] ${platform} is using the shared GOOGLE_MAPS_API_KEY. ` +
        `Set GOOGLE_MAPS_${platform.toUpperCase()}_API_KEY to a key restricted to ` +
        `${platform === 'android' ? 'package co.zw.farmbridge + signing SHA-1' : 'bundle co.zw.farmbridge'} ` +
        `before building for release.`
    );
  }
  return shared;
}

const androidMapsKey = resolveMapsKey('android', process.env.GOOGLE_MAPS_ANDROID_API_KEY);
const iosMapsKey = resolveMapsKey('ios', process.env.GOOGLE_MAPS_IOS_API_KEY);

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      config: {
        ...(appJson.expo.ios.config ?? {}),
        googleMapsApiKey: iosMapsKey,
      },
      infoPlist: {
        ...(appJson.expo.ios.infoPlist ?? {}),
        NSLocationWhenInUseUsageDescription:
          'FarmBridge uses your location to name where you are, show local weather, and find transporters near you.',
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...(appJson.expo.android.config ?? {}),
        googleMaps: {
          apiKey: androidMapsKey,
        },
      },
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: androidMapsKey,
          iosGoogleMapsApiKey: iosMapsKey,
        },
      ],
    ],
  },
};
