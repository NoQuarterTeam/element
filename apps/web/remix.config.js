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
  serverDependenciesToBundle: ["@element/api", "axios", "@element/database", "query-string", "filter-obj", "split-on-first"],
  routes: (defineRoutes) => {
    return flatRoutes("pages", defineRoutes)
  },
}
