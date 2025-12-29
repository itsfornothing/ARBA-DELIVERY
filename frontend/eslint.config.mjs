import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // TypeScript-specific rules for quality standards (Requirement 5.1, 5.2, 5.3, 5.4, 5.5)
      
      // Prevent use of `any` type without explicit approval (Requirement 5.3)
      "@typescript-eslint/no-explicit-any": "error",
      
      // Enforce proper type annotations (Requirement 5.4)
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/explicit-function-return-type": ["error", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true
      }],
      
      // Consistent naming conventions (Requirement 5.1)
      "@typescript-eslint/naming-convention": [
        "error",
        // Interfaces should be PascalCase
        {
          selector: "interface",
          format: ["PascalCase"]
        },
        // Type aliases should be PascalCase
        {
          selector: "typeAlias",
          format: ["PascalCase"]
        },
        // Enums should be PascalCase
        {
          selector: "enum",
          format: ["PascalCase"]
        },
        // Enum members should be UPPER_CASE
        {
          selector: "enumMember",
          format: ["UPPER_CASE"]
        },
        // Variables should be camelCase or UPPER_CASE for constants
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow"
        },
        // Functions should be camelCase or PascalCase (for React components)
        {
          selector: "function",
          format: ["camelCase", "PascalCase"]
        },
        // Class names should be PascalCase
        {
          selector: "class",
          format: ["PascalCase"]
        },
        // Method names should be camelCase
        {
          selector: "method",
          format: ["camelCase"]
        },
        // Property names should be camelCase
        {
          selector: "property",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow"
        },
        // Parameter names should be camelCase
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow"
        }
      ],
      
      // Consistent import/export patterns (Requirement 5.5)
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { 
          prefer: "type-imports",
          fixStyle: "separate-type-imports"
        }
      ],
      
      // Type definition consistency
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      
      // Code quality and best practices
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/prefer-function-type": "error",
      
      // Prevent common mistakes
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": "allow-with-description",
        "ts-nocheck": "allow-with-description",
        "ts-check": false,
        minimumDescriptionLength: 10
      }],
      
      // Standard JavaScript rules
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      
      // Import organization
      "sort-imports": ["error", {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
        allowSeparatedGroups: true
      }]
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
    "*.config.js",
    "*.config.mjs",
    "*.config.ts"
  ]),
]);

export default eslintConfig;
