import css from "@eslint/css";
import {defineConfig} from "eslint/config";
import globals from "globals";
import {flatConfigs as importX} from "eslint-plugin-import-x";
import js from "@eslint/js";
import markdown from "@eslint/markdown";
import stylistic from "@stylistic/eslint-plugin";


export default defineConfig([
  {"files": ["**/*.css"], "plugins": {css}, "language": "css/css", "extends": ["css/recommended"], "rules": {"css/no-important": "off", "css/use-baseline": ["error", {"available": "newly"}]}},
  {
    "files": ["**/*.js"],
    "languageOptions": {
      "ecmaVersion": "latest",
      "globals": {
        ...globals.browser,
        ...globals.node
      }
    },
    "plugins": {js, stylistic},
    "extends": [importX.recommended, "js/all", "stylistic/all"],
    "rules": {
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/lines-around-comment": "off",
      "@stylistic/padded-blocks": ["error", "never"],
      "@stylistic/quote-props": ["error", "as-needed"],
      "camelcase": ["error", {"allow": ["bottom_", "fullscreen_", "lower_", "middle_center", "top_", "upper_third"]}],
      "consistent-this": "off",
      "curly": ["error", "multi-line"],
      "max-lines": "off",
      "max-lines-per-function": ["error", 70],
      "max-statements": ["error", 50],
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "one-var": ["error", "never"],
      "sort-keys": "off"
    }
  },
  {
    "files": ["**/*.mjs"],
    "languageOptions": {
      "ecmaVersion": "latest",
      "globals": {
        ...globals.node
      },
      "sourceType": "module"
    },
    "plugins": {js, stylistic},
    "extends": [importX.recommended, "js/all", "stylistic/all"],
    "rules": {
      "@stylistic/array-element-newline": ["error", "consistent"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/object-property-newline": ["error", {"allowAllPropertiesOnSameLine": true}],
      "@stylistic/padded-blocks": ["error", "never"],
      "import-x/no-unresolved": ["error", {"ignore": ["eslint/config"]}],
      "max-lines-per-function": ["error", 100],
      "no-magic-numbers": "off",
      "one-var": ["error", "never"],
      "sort-keys": "off"
    }
  },
  {"files": ["**/*.md"], "plugins": {markdown}, "language": "markdown/gfm", "extends": ["markdown/recommended"]}
]);
