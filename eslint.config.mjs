import eslintPluginJs from "@eslint/js";
import eslintPluginStylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import {flatConfigs as importConfigs} from "eslint-plugin-import-x";

const config = [
  importConfigs.recommended,
  eslintPluginJs.configs.all,
  eslintPluginStylistic.configs.all,
  {
    "files": ["**/*.js"],
    "languageOptions": {
      "ecmaVersion": "latest",
      "globals": {
        ...globals.browser,
        ...globals.node
      },
      "sourceType": "commonjs"
    },
    "rules": {
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/lines-around-comment": "off",
      "@stylistic/padded-blocks": ["error", "never"],
      "@stylistic/quote-props": ["error", "as-needed"],
      "camelcase": "off",
      "capitalized-comments": "off",
      "complexity": ["error", 30],
      "consistent-this": "off",
      "curly": ["error", "multi-line"],
      "func-style": "off",
      "id-length": ["error", {"exceptions": ["_", "i", "j", "s"], "min": 2}],
      "init-declarations": "off",
      "max-depth": ["error", 7],
      "max-lines": "off",
      "max-lines-per-function": ["error", 200],
      "max-statements": ["error", 50],
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-negated-condition": "off",
      "no-undefined": "off",
      "one-var": "off",
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
    "rules": {
      "@stylistic/array-element-newline": ["error", "consistent"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/object-property-newline": "off",
      "@stylistic/padded-blocks": ["error", "never"],
      "func-style": "off",
      "max-lines-per-function": ["error", 100],
      "no-magic-numbers": "off",
      "one-var": "off",
      "prefer-destructuring": "off"
    }
  }
];

export default config;
