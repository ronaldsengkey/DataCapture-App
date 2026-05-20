module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';
  return {
    presets: ['babel-preset-expo'],
    // Disable NativeWind Babel plugin for now.
    // The Expo/Metro bundling pipeline is currently failing with:
    // "Use process(css).then(cb) to work with async plugins" (postcss/nativewind).
    // Removing this plugin should unblock production/CI bundling.
    plugins: [],

  };
};
