const { flatRoutes } = require("remix-flat-routes")

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/*"],
  future: {
    unstable_postcss: true,
    unstable_dev: true,
    unstable_tailwind: true,
  },
  serverDependenciesToBundle: [
    "@element/api",
    "@element/shared",
    "axios",
    "@element/database",
    "@element/database/types",
    "query-string",
    "filter-obj",
    "split-on-first",
  ],
  watchPaths: ["../../packages/api"],
  routes: (defineRoutes) => {
    return flatRoutes("pages", defineRoutes)
  },
}
