import { ConfigContext, ExpoConfig } from "expo/config"

const defineConfig = (_ctx: ConfigContext): ExpoConfig => ({
  name: "Element: Life Planner",
  description: "A better way to organize your life",
  slug: "element-app",
  scheme: "elementapp",
  owner: "noquarter",
  version: "1.0.4",
  jsEngine: "hermes",
  orientation: "portrait",
  icon: "./assets/icon.png",

  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  updates: {
    fallbackToCacheTimeout: 0,
    checkAutomatically: "ON_ERROR_RECOVERY",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    icon: "./assets/icon.png",
    bundleIdentifier: "co.noquarter.element",
    infoPlist: {
      CFBundleDisplayName: "Element",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
    package: "co.noquarter.element",
  },
  extra: {
    eas: {
      projectId: "93cfd208-76bb-4e7c-b368-5a09679e1a72",
    },
  },
  plugins: ["./expo-plugins/with-modify-gradle.js"],
})

export default defineConfig
