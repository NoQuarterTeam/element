import { ConfigContext, ExpoConfig } from "expo/config"

const VERSION = "1.0.7"
const BUILD = 20

const IS_DEV = process.env.APP_VARIANT === "development"

const defineConfig = (_ctx: ConfigContext): ExpoConfig => ({
  name: "Element: Life Planner",
  description: "A better way to organize your life",
  slug: "element-app",
  scheme: "elementapp",
  owner: "noquarter",
  version: VERSION,
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
  runtimeVersion: {
    policy: "nativeVersion",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    config: {
      usesNonExemptEncryption: false,
    },
    icon: "./assets/icon.png",
    bundleIdentifier: IS_DEV ? "co.noquarter.element.dev" : "co.noquarter.element",
    infoPlist: {
      CFBundleDisplayName: "Element",
    },
    buildNumber: BUILD.toString(),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
    softwareKeyboardLayoutMode: "resize",
    package: IS_DEV ? "co.noquarter.element.dev" : "co.noquarter.element",
    versionCode: BUILD,
  },
  extra: {
    eas: {
      projectId: "93cfd208-76bb-4e7c-b368-5a09679e1a72",
    },
  },
  plugins: ["./expo-plugins/with-modify-gradle.js"],
})

export default defineConfig
