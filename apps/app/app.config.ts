import type { ConfigContext, ExpoConfig } from "expo/config"

const VERSION = "1.5.2"
const BUILD = 39

const IS_DEV = process.env.APP_VARIANT === "development"

const splash: ExpoConfig["splash"] = {
  image: "./assets/splash.png",
  resizeMode: "contain",
  backgroundColor: "#fff",
  dark: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#000",
  },
}

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
  splash,
  experiments: {
    typedRoutes: true,
  },
  updates: {
    fallbackToCacheTimeout: 0,
    checkAutomatically: "ON_LOAD",
    url: "https://u.expo.dev/93cfd208-76bb-4e7c-b368-5a09679e1a72",
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
      CFBundleDisplayName: IS_DEV ? "Element (dev)" : "Element",
    },
    splash,
    buildNumber: BUILD.toString(),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
    splash,
    softwareKeyboardLayoutMode: "resize",
    package: IS_DEV ? "co.noquarter.element.dev" : "co.noquarter.element",
    versionCode: BUILD,
  },
  extra: {
    eas: {
      projectId: "93cfd208-76bb-4e7c-b368-5a09679e1a72",
    },
  },
  plugins: [
    "expo-router",
    ["@sentry/react-native/expo", { project: "element-app", organization: "noquarter" }],
    ["expo-image-picker", { photosPermission: "The app accesses your photos to let you upload a profile picture." }],
    "expo-font",
    // "./expo-plugins/with-modify-gradle.js",
    ["expo-build-properties", { android: { kotlinVersion: "1.9.24" } }],
  ],
})

export default defineConfig
