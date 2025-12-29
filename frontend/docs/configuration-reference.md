# Configuration Reference - TypeScript Maintenance System

This comprehensive reference covers all configuration options for the TypeScript Maintenance System. Use this guide to customize the system for your specific project needs.

## 📋 Configuration Files Overview

The TypeScript Maintenance System uses several configuration files:

- `tsconfig.json` - TypeScript compiler configuration
- `eslint.config.mjs` - ESLint rules and settings
- `.prettierrc` - Code formatting rules
- `package.json` - Scripts and dependencies
- `.vscode/settings.json` - IDE integration settings
- `.typescript-monitoring/monitoring-config.json` - Performance monitoring

## 🔧 TypeScript Configuration (`tsconfig.json`)

### Basic Configuration

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "types": ["jest", "@testing-library/jest-dom", "node"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Compiler Options Reference

#### Type Checking Options

| Option | Default | Description |
|--------|---------|-------------|
| `strict` | `true` | Enable all strict type checking options |
| `noImplicitAny` | `true` | Error on expressions with implied `any` type |
| `strictNullChecks` | `true` | Enable strict null checks |
| `strictFunctionTypes` | `true` | Enable strict checking of function types |
| `noImplicitReturns` | `false` | Error when not all code paths return a value |
| `noImplicitThis` | `true` | Error on `this` expressions with implied `any` |

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### Module Resolution Options

| Option | Default | Description |
|--------|---------|-------------|
| `moduleResolution` | `"bundler"` | Module resolution strategy |
| `baseUrl` | `"."` | Base directory for resolving modules |
| `paths` | `{}` | Path mapping for module resolution |
| `resolveJsonModule` | `true` | Allow importing JSON files |

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/lib/utils/*"]
    },
    "resolveJsonModule": true
  }
}
```

#### Performance Options

| Option | Default | Description |
|--------|---------|-------------|
| `incremental` | `true` | Enable incremental compilation |
| `tsBuildInfoFile` | Auto | Location for build info cache |
| `skipLibCheck` | `true` | Skip type checking of declaration files |

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".typescript-cache/tsconfig.tsbuildinfo",
    "skipLibCheck": true,
    "isolatedModules": true
  }
}
```

### Project-Specific Configurations

#### For React Projects
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "esnext"],
    "types": ["react", "react-dom", "jest", "@testing-library/jest-dom"]
  }
}
```

#### For Node.js Projects
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "types": ["node", "jest"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

#### For Library Projects
```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  }
}
```

## 🎨 ESLint Configuration (`eslint.config.mjs`)

### Basic Configuration Structure

```javascript
import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const eslintConfig = defineConfig([
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      // Your rules here
    }
  }
]);

export default eslintConfig;
```

### TypeScript-Specific Rules

#### Type Safety Rules

```javascript
{
  rules: {
    // Prevent use of any
    "@typescript-eslint/no-explicit-any": "error",
    
    // Require explicit return types
    "@typescript-eslint/explicit-function-return-type": ["error", {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true
    }],
    
    // Prevent unused variables
    "@typescript-eslint/no-unused-vars": ["error", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }],
    
    // Require consistent type imports
    "@typescript-eslint/consistent-type-imports": ["error", {
      prefer: "type-imports",
      fixStyle: "separate-type-imports"
    }]
  }
}
```

#### Naming Convention Rules

```javascript
{
  rules: {
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
      // Variables can be camelCase or UPPER_CASE
      {
        selector: "variable",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
        leadingUnderscore: "allow"
      },
      // Functions should be camelCase or PascalCase
      {
        selector: "function",
        format: ["camelCase", "PascalCase"]
      }
    ]
  }
}
```

#### Code Quality Rules

```javascript
{
  rules: {
    // Prefer for-of loops
    "@typescript-eslint/prefer-for-of": "error",
    
    // Prefer function types over interfaces
    "@typescript-eslint/prefer-function-type": "error",
    
    // Prevent duplicate enum values
    "@typescript-eslint/no-duplicate-enum-values": "error",
    
    // Prevent useless empty exports
    "@typescript-eslint/no-useless-empty-export": "error",
    
    // Control ts-ignore comments
    "@typescript-eslint/ban-ts-comment": ["error", {
      "ts-expect-error": "allow-with-description",
      "ts-ignore": "allow-with-description",
      minimumDescriptionLength: 10
    }]
  }
}
```

### Rule Severity Levels

| Level | Description | Effect |
|-------|-------------|--------|
| `"off"` or `0` | Disable rule | No checking |
| `"warn"` or `1` | Warning | Shows warning, doesn't fail |
| `"error"` or `2` | Error | Shows error, fails validation |

### Environment-Specific Configurations

#### Development Environment
```javascript
{
  rules: {
    "no-console": "warn", // Allow console in development
    "@typescript-eslint/no-unused-vars": "warn" // Warn instead of error
  }
}
```

#### Production Environment
```javascript
{
  rules: {
    "no-console": "error", // Strict no console in production
    "@typescript-eslint/no-unused-vars": "error" // Error on unused vars
  }
}
```

## 🎯 Prettier Configuration (`.prettierrc`)

### Basic Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Configuration Options Reference

| Option | Default | Description |
|--------|---------|-------------|
| `semi` | `true` | Add semicolons at end of statements |
| `trailingComma` | `"es5"` | Add trailing commas where valid |
| `singleQuote` | `false` | Use single quotes instead of double |
| `printWidth` | `80` | Line length before wrapping |
| `tabWidth` | `2` | Number of spaces per indentation |
| `useTabs` | `false` | Use tabs instead of spaces |
| `bracketSpacing` | `true` | Spaces between brackets in objects |
| `arrowParens` | `"always"` | Parentheses around arrow function params |

### File-Specific Overrides

```json
{
  "semi": true,
  "singleQuote": true,
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "singleQuote": false
      }
    },
    {
      "files": "*.md",
      "options": {
        "printWidth": 100,
        "proseWrap": "always"
      }
    }
  ]
}
```

## 📦 Package.json Scripts Configuration

### Essential Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "prepare": "husky"
  }
}
```

### TypeScript Maintenance Scripts

```json
{
  "scripts": {
    "typescript:validate": "node scripts/typescript-error-detector.js",
    "typescript:pre-commit": "node scripts/pre-commit-typescript-check.js",
    "typescript:config:validate": "node scripts/typescript-config-manager.js validate",
    "typescript:config:optimize": "node scripts/typescript-config-manager.js optimize",
    "typescript:performance:validate": "node scripts/typescript-performance-optimizer.js validate",
    "typescript:performance:report": "node scripts/typescript-performance-optimizer.js report",
    "monitoring:setup": "node scripts/typescript-monitoring-setup.js",
    "monitoring:collect": "node .typescript-monitoring/collect-metrics.js",
    "monitoring:trends": "node .typescript-monitoring/analyze-trends.js"
  }
}
```

### Lint-Staged Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "node scripts/pre-commit-typescript-check.js",
      "eslint --fix",
      "prettier --write",
      "bash -c 'tsc --noEmit'"
    ],
    "*.{js,jsx,json,css,md}": [
      "prettier --write"
    ]
  }
}
```

## 🖥️ VS Code Configuration (`.vscode/settings.json`)

### Basic IDE Settings

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.validate.enable": true,
  "typescript.format.enable": true,
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.format.enable": true
}
```

### Performance Settings

```json
{
  "typescript.tsserver.maxTsServerMemory": 4096,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/coverage": true,
    "**/.typescript-cache": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/coverage": true
  }
}
```

### File Associations

```json
{
  "files.associations": {
    "*.tsx": "typescriptreact",
    "*.ts": "typescript",
    "*.mjs": "javascript"
  },
  "emmet.includeLanguages": {
    "typescriptreact": "html"
  }
}
```

## 📊 Monitoring Configuration

### Monitoring Config (`.typescript-monitoring/monitoring-config.json`)

```json
{
  "enabled": true,
  "collectMetrics": true,
  "metricsInterval": 300000,
  "alertThresholds": {
    "buildTime": 180000,
    "errorCount": 10,
    "warningCount": 50
  },
  "retentionDays": 30,
  "performanceTracking": {
    "enabled": true,
    "trackBuildTimes": true,
    "trackErrorCounts": true,
    "trackMemoryUsage": true
  },
  "alerts": {
    "enabled": true,
    "channels": ["console", "file"],
    "thresholds": {
      "consecutiveFailures": 3,
      "errorIncrease": 20
    }
  }
}
```

### Performance Thresholds

| Metric | Warning | Error | Description |
|--------|---------|-------|-------------|
| Build Time | 120s | 180s | TypeScript compilation time |
| Error Count | 5 | 10 | Number of TypeScript errors |
| Warning Count | 20 | 50 | Number of ESLint warnings |
| Memory Usage | 2GB | 4GB | TypeScript server memory |

## 🧪 Jest Configuration (`jest.config.js`)

### Basic Jest Setup

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.(ts|tsx)'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Property-Based Testing Configuration

```javascript
module.exports = {
  // ... other config
  testTimeout: 30000, // Longer timeout for property tests
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  },
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__tests__/property-test-setup.ts'
  ]
};
```

## 🔄 Environment-Specific Configurations

### Development Environment

```bash
# .env.development
NODE_ENV=development
TYPESCRIPT_MONITORING_ENABLED=true
ESLINT_MAX_WARNINGS=100
BUILD_PERFORMANCE_TRACKING=true
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
TYPESCRIPT_MONITORING_ENABLED=false
ESLINT_MAX_WARNINGS=0
BUILD_PERFORMANCE_TRACKING=false
```

### CI/CD Environment

```bash
# .env.ci
NODE_ENV=test
CI=true
TYPESCRIPT_STRICT_MODE=true
ESLINT_MAX_WARNINGS=0
FAIL_ON_BUILD_WARNINGS=true
```

## 🎛️ Advanced Configuration Options

### Custom ESLint Rules

```javascript
// custom-rules/no-console-in-production.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow console statements in production'
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (process.env.NODE_ENV === 'production' &&
            node.callee.object?.name === 'console') {
          context.report({
            node,
            message: 'Console statements not allowed in production'
          });
        }
      }
    };
  }
};
```

### TypeScript Project References

```json
// tsconfig.json
{
  "references": [
    { "path": "./src/components" },
    { "path": "./src/lib" },
    { "path": "./src/hooks" }
  ]
}

// src/components/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "../../dist/components"
  },
  "include": ["**/*"],
  "references": [
    { "path": "../lib" }
  ]
}
```

## 🔍 Configuration Validation

### Validation Scripts

```bash
# Validate all configurations
npm run typescript:config:validate

# Check specific configurations
npx tsc --showConfig
npx eslint --print-config src/app/page.tsx
npx prettier --check .
```

### Configuration Testing

```bash
# Test TypeScript configuration
npx tsc --noEmit --listFiles

# Test ESLint configuration
npx eslint --ext .ts,.tsx src/

# Test Prettier configuration
npx prettier --check src/
```

## 📚 Configuration Best Practices

### 1. Start Conservative
- Begin with less strict rules
- Gradually increase strictness
- Monitor team adoption

### 2. Document Changes
- Keep configuration changes in version control
- Document reasoning for rule changes
- Communicate changes to team

### 3. Regular Reviews
- Review configurations quarterly
- Update based on team feedback
- Keep up with tool updates

### 4. Environment Consistency
- Use same configurations across environments
- Test configuration changes in CI/CD
- Validate before deploying

---

*Configuration reference last updated: December 2024*