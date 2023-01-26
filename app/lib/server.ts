import { createRequestHandler } from "@remix-run/express"
import compression from "compression"
import express from "express"
import morgan from "morgan"
import path from "path"

import { createMetronomeGetLoadContext, registerMetronome } from "@metronome-sh/express"

const MODE = process.env.NODE_ENV
const BUILD_DIR = path.join(process.cwd(), "build")
const port = process.env.PORT || 3000

const buildWithMetronome = registerMetronome(require(BUILD_DIR))

const metronomeGetLoadContext = createMetronomeGetLoadContext(buildWithMetronome, {
  config: require("../metronome.config.js"),
})

express()
  .use((req, res, next) => {
    // helpful headers:
    res.set("x-fly-region", process.env.FLY_REGION ?? "unknown")
    res.set("Strict-Transport-Security", `max-age=${60 * 60 * 24 * 365 * 100}`)

    // /clean-urls/ -> /clean-urls
    if (req.path.endsWith("/") && req.path.length > 1) {
      const query = req.url.slice(req.path.length)
      const safepath = req.path.slice(0, -1).replace(/\/+/g, "/")
      res.redirect(301, safepath + query)
      return
    }
    next()
  })
  .use(compression())
  // http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
  .disable("x-powered-by")
  // Remix fingerprints its assets so we can cache forever.
  .use("/build", express.static("public/build", { immutable: true, maxAge: "1y" }))
  // Everything else (like favicon.ico) is cached for an hour. You may want to be
  // more aggressive with this caching.
  .use(express.static("public", { maxAge: "1h" }))
  .use(morgan("tiny"))
  .all(
    "*",
    MODE === "production"
      ? createRequestHandler({
          build: require(BUILD_DIR),
          mode: MODE,
          getLoadContext: metronomeGetLoadContext,
        })
      : (...args) => {
          purgeRequireCache()
          return createRequestHandler({
            build: require(BUILD_DIR),
            mode: MODE,
            getLoadContext: metronomeGetLoadContext,
          })(...args)
        },
  )
  .listen(port, () => {
    // require the built app so we're ready when the first request comes in
    require(BUILD_DIR)
    console.log(`✅ Ready: http://localhost:${port}`)
  })

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[key]
    }
  }
}
