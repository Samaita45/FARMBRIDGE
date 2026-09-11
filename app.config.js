/**
 * Dynamic config layered over app.json.
 *
 * Expo reads app.json, normalises it, and hands the result in as `config` — so
 * this takes the documented `({ config })` form rather than requiring app.json
 * itself. It used to do the latter, and `expo-doctor` was right to flag it: two
 * files claiming to be the source of truth is exactly how a setting gets
 * changed in one and silently ignored from the other.
 *
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

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...(config.ios?.config ?? {}),
      // Omitted entirely when absent rather than set to an empty string. With no
      // key, react-native-maps leaves useGoogleMaps false and iOS draws with
      // Apple Maps, which needs no key at all — so an unbilled project still
      // gets real maps on iPhone. Writing an empty GMSApiKey would only muddy
      // that with a setting that claims to be configured and is not.
      ...(iosMapsKey ? { googleMapsApiKey: iosMapsKey } : {}),
    },
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      // Kept here rather than in app.json because the reason changed when
      // transport arrived: the same permission now also places a pickup and
      // finds nearby transporters, and a stale reason is a review question.
      NSLocationWhenInUseUsageDescription:
        'FarmBridge uses your location to name where you are, show local weather, and find transporters near you.',
    },
  },
  android: {
    ...config.android,
    config: {
      ...(config.android?.config ?? {}),
      // Android has no Apple Maps to fall back to: without a key the map is a
      // blank grid. Left absent rather than empty so that failure is a missing
      // setting someone can find, not a present-but-useless one.
      ...(androidMapsKey ? { googleMaps: { apiKey: androidMapsKey } } : {}),
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    /*
      The plugin decides whether to link the Google Maps SDK from whether these
      are truthy. Passing it nothing at all when there is no key keeps iOS on
      MapKit, which is exactly what a project without billing wants.
    */
    ...(androidMapsKey || iosMapsKey
      ? [
          [
            'react-native-maps',
            {
              ...(androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}),
              ...(iosMapsKey ? { iosGoogleMapsApiKey: iosMapsKey } : {}),
            },
          ],
        ]
      : []),
  ],
});
