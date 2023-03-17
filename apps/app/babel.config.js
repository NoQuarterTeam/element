module.exports = function (api) {
  api.cache(true)
  return {
    plugins: [
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      require.resolve("expo-router/babel"),
      "react-native-reanimated/plugin",
      "nativewind/babel",
    ],
    presets: [["module:metro-react-native-babel-preset", { useTransformReactJSXExperimental: true }], "babel-preset-expo"],
  }
}
