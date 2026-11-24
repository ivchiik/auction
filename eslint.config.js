// Flat config built on Expo's shared rules, with project conventions layered on top.
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");
const reactNative = require("eslint-plugin-react-native");
const unusedImports = require("eslint-plugin-unused-imports");
const globals = require("globals");

module.exports = defineConfig([
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      ".work/**",
      "dist/**",
      "web-build/**",
      "ios/**",
      "android/**",
      "coverage/**",
      "design/**",
      "docs/**",
    ],
  },
  expoConfig,
  prettierConfig,
  {
    plugins: {
      "react-native": reactNative,
      "unused-imports": unusedImports,
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "react-native/no-inline-styles": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.js"],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // Build-time scripts report their progress on stdout.
      "no-console": "off",
    },
  },
]);
