import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDevelopment = process.env.APP_VARIANT === "development";

  return {
    ...config,
    name: isDevelopment ? "SweatLogs Dev" : "SweatLogs",
    slug: "sweatlogs",
    scheme: isDevelopment ? "sweatlogs-dev" : "sweatlogs",
    android: {
      ...config.android,
      package: isDevelopment ? "com.sweatlogs.app.dev" : "com.sweatlogs.app",
    },
  };
};
