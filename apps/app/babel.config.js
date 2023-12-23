module.exports = function (api) {
  api.cache(true)
  return {
    presets: [["module:metro-react-native-babel-preset", { useTransformReactJSXExperimental: true }], "babel-preset-expo"],
    plugins: [
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      "expo-router/babel",
      "nativewind/babel",
      "react-native-reanimated/plugin",
    ],
  }
}
