import nextConfig from "eslint-config-next";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

const eslintConfig = [
  {
    ignores: ["node_modules/**", "public/**", "dist/**", "build/**", "**/*.min.js", "src/**/*.js"],
  },
  ...nextConfig,
  {
    plugins: {
      "@stylistic": stylistic,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@stylistic/indent": ["error", 2, { SwitchCase: 1 }],
      "@stylistic/no-tabs": "error",
      "@stylistic/eol-last": "warn",
      "@stylistic/semi": ["error", "always"],
      "@stylistic/quotes": "off",
      "@stylistic/comma-dangle": "off",
      "@stylistic/brace-style": ["warn", "1tbs", { allowSingleLine: true }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
