const { withAppBuildGradle } = require('expo/config-plugins');

/** Ensures Android debug APKs install beside production instead of updating it. */
module.exports = function withAndroidDebugAppId(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error('SweatLogs debug application ID plugin requires a Groovy app build.gradle.');
    }

    const buildGradle = modConfig.modResults.contents;
    if (buildGradle.includes('applicationIdSuffix ".dev"')) {
      return modConfig;
    }

    const debugBuildMarker = '        debug {\n            signingConfig signingConfigs.debug';
    if (!buildGradle.includes(debugBuildMarker)) {
      throw new Error('Could not locate the Android debug build type in app/build.gradle.');
    }

    modConfig.modResults.contents = buildGradle.replace(
      debugBuildMarker,
      '        debug {\n            applicationIdSuffix ".dev"\n            resValue "string", "app_name", "SweatLogs Dev"\n            signingConfig signingConfigs.debug',
    );
    return modConfig;
  });
};
