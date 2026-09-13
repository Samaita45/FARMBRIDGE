const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker imports wa-sqlite.wasm. Metro must treat that as
// an asset, not as a JS module, or the bundle fails on web (and in Expo Go
// when the same graph is resolved).
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== 'wasm');
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

const previousEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const inner = previousEnhance ? previousEnhance(middleware, server) : middleware;
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      return inner(req, res, next);
    };
  },
};

// Metro's package-exports path loads tslib/modules/index.js, which does
// `import tslib from '../tslib.js'` and then destructures helpers. After the
// CJS transform that becomes `tslib.default`, which is undefined and crashes
// Expo Router SSR ("Cannot destructure property '__extends'").
function withTslibAlias(metroConfig) {
  const tslibFile = require.resolve('tslib/tslib.es6.js');
  const previous = metroConfig.resolver.resolveRequest;
  metroConfig.resolver.resolveRequest = (context, moduleName, platform) => {
    if (
      moduleName === 'tslib' ||
      moduleName === 'tslib/modules/index.js' ||
      moduleName.endsWith('/tslib/modules/index.js')
    ) {
      return { filePath: tslibFile, type: 'sourceFile' };
    }
    if (previous) {
      return previous(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
  return metroConfig;
}

try {
  const { withNativeWind } = require('nativewind/metro');
  module.exports = withTslibAlias(withNativeWind(config, { input: './global.css' }));
} catch {
  module.exports = withTslibAlias(config);
}
