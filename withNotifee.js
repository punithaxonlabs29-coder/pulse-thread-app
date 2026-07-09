const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withNotifee(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;
      const notifeeRepo = `maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`;
      
      if (!buildGradle.includes('notifee/react-native/android/libs')) {
        config.modResults.contents = buildGradle.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          `allprojects {\n    repositories {\n        ${notifeeRepo}`
        );
      }
    }
    return config;
  });
};
