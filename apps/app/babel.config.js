module.exports = (api) => {
  api.cache(true)
  return {
    presets: ["nativewind/babel", ["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins: ["react-native-reanimated/plugin"],
  }
}
