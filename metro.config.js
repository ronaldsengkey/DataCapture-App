// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// NativeWind v2 does not expose `nativewind/metro`.
// NativeWind setup for Expo is handled via `babel` (`nativewind/babel`),
// so Metro config can stay as the Expo default.
module.exports = config;


