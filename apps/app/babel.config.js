module.exports = function (api) {
  api.cache(true)
  return {
    plugins: [
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      "nativewind/babel",
      require.resolve("expo-router/babel"),
      "react-native-reanimated/plugin",
    ],
    presets: [["module:metro-react-native-babel-preset", { useTransformReactJSXExperimental: true }], "babel-preset-expo"],
  }
}
