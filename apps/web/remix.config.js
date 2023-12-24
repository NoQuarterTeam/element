const { flatRoutes } = require("remix-flat-routes")

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/*"],
  future: {
    cssSideEffectImports: true,
  },
  serverModuleFormat: "cjs",
  serverBuildTarget: "cjs",
  tailwind: true,
  serverDependenciesToBundle: [/@element/, /remix-utils/, "axios", "query-string", "filter-obj", "split-on-first"],
  watchPaths: ["../../packages/api"],
  routes: (defineRoutes) => {
    return flatRoutes("pages", defineRoutes)
  },
}
