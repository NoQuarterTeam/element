const { flatRoutes } = require("remix-flat-routes")

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/*"],
  future: {
    unstable_postcss: true,
    unstable_tailwind: true,
  },
  serverDependenciesToBundle: ["query-string", "filter-obj", "split-on-first"],
  routes: (defineRoutes) => {
    return flatRoutes("pages", defineRoutes)
  },
}
