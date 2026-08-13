import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDevelopment = process.env.APP_VARIANT === "development";

  return {
    ...config,
    name: isDevelopment ? "SweatLogs Dev" : "SweatLogs",
    slug: "sweatlogs",
    scheme: isDevelopment ? "sweatlogs-dev" : "sweatlogs",
    plugins: [
      ...(config.plugins ?? []),
      "./plugins/with-android-debug-app-id.js",
      "expo-sharing",
      [
        "expo-audio",
        {
          microphonePermission: false,
          recordAudioAndroid: false,
          enableBackgroundPlayback: false,
        },
      ],
      [
        "expo-notifications",
        {
          sounds: ["./assets/audio/rest_timer_alarm.wav"],
        },
      ],
    ],
    android: {
      ...config.android,
      permissions: [
        ...(config.android?.permissions ?? []),
        "android.permission.SCHEDULE_EXACT_ALARM",
      ],
      package: isDevelopment ? "com.sweatlogs.app.dev" : "com.sweatlogs.app",
    },
  };
};
