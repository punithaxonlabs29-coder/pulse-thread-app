const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFontScaleConfig(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application[0];
    const activity = application.activity.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );

    if (activity) {
      const currentConfigChanges = activity.$['android:configChanges'] || '';
      if (!currentConfigChanges.includes('fontScale')) {
        activity.$['android:configChanges'] = currentConfigChanges
          ? `${currentConfigChanges}|fontScale`
          : 'fontScale';
      }
    }

    return config;
  });
};
