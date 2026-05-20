<<<<<<< HEAD
// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: ['nativewind/babel'],
    };
  };
=======
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: ['nativewind/babel'],
    };
};
>>>>>>> b435071 (Fix: animated splash, camera permission crash, auto-detection with unique IDs, removed unwanted camera UI)
