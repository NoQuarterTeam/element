// Learn more: https://docs.expo.dev/guides/monorepos/
const { getSentryExpoConfig } = require("@sentry/react-native/metro")
const { withNativeWind } = require("nativewind/metro")
const path = require("node:path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

// Create the default Metro config
const config = getSentryExpoConfig(projectRoot)

// Add the additional `cjs` extension to the resolver
config.resolver.sourceExts.push("cjs")

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot]
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules"), path.resolve(workspaceRoot, "node_modules")]
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true

module.exports = withNativeWind(config, { input: "./src/global.css" })
