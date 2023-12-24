/**
 * @type {import('@types/eslint').Linter.BaseConfig}
 */
module.exports = {
  root: true,
  extends: ["@element/eslint-config"],
  ignorePatterns: ["*.config.js", "*.config.ts", "node_modules"],
}
