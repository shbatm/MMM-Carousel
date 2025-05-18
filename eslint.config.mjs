import {defineConfig} from "eslint/config";
import globals from "globals";
import {flatConfigs as importX} from "eslint-plugin-import-x";
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
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
      "capitalized-comments": "off",
      "complexity": ["error", 30],
      "consistent-this": "off",
      "curly": ["error", "multi-line"],
      "id-length": ["error", {"exceptions": ["_", "i", "j", "s"], "min": 2}],
      "init-declarations": "off",
      "max-depth": ["error", 7],
      "max-lines": "off",
      "max-lines-per-function": ["error", 200],
      "max-statements": ["error", 50],
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-undefined": "off",
      "one-var": ["error", "never"],
      "prefer-named-capture-group": "off",
      "sort-keys": "off",
      "strict": "off"
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
      "max-lines-per-function": ["error", 100],
      "import-x/no-unresolved": ["error", {"ignore": ["eslint/config"]}],
      "no-magic-numbers": "off",
      "one-var": ["error", "never"],
      "sort-keys": "off"
    }
  }
]);
