# TypeScript Maintenance System - Setup Guide

This guide provides comprehensive setup instructions for the TypeScript Maintenance System in the Mohamedo frontend project.

## 📋 Prerequisites

Before setting up the TypeScript Maintenance System, ensure you have:

- **Node.js** (version 18.0.0 or higher)
- **npm** (version 8.0.0 or higher) or **yarn** (version 1.22.0 or higher)
- **Git** (version 2.30.0 or higher)
- **VS Code** (recommended IDE, version 1.80.0 or higher)

### Verify Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

## 🚀 Installation Steps

### 1. Clone and Navigate to Project

```bash
git clone <repository-url>
cd Mohamedo/frontend
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Or using yarn
yarn install
```

This will install:
- TypeScript and related tools
- ESLint with TypeScript support
- Prettier for code formatting
- Husky for Git hooks
- Jest for testing
- Fast-check for property-based testing

### 3. Initialize Git Hooks

```bash
# Initialize Husky pre-commit hooks
npm run prepare
```

This sets up:
- Pre-commit TypeScript validation
- ESLint auto-fix on commit
- Prettier formatting checks
- Import organization

### 4. Validate Installation

```bash
# Run comprehensive validation
npm run typescript:validate

# Check TypeScript configuration
npm run typescript:config:validate

# Verify IDE setup
npm run validate:ide
```

### 5. Configure VS Code (Recommended)

If using VS Code, the workspace is pre-configured with:
- TypeScript language server settings
- Recommended extensions
- Debug configurations
- Custom tasks and snippets

**Install Recommended Extensions:**
1. Open VS Code in the project directory
2. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
3. Type "Extensions: Show Recommended Extensions"
4. Install all recommended extensions

## ⚙️ Configuration Files

The system includes several pre-configured files:

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

### ESLint Configuration (`eslint.config.mjs`)
- TypeScript-specific rules
- Naming convention enforcement
- Import/export consistency
- Code quality standards

### Prettier Configuration (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Husky Configuration (`.husky/pre-commit`)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

## 🔧 Environment Setup

### 1. Environment Variables

Create a `.env.local` file (if not exists):
```bash
# Development environment
NODE_ENV=development

# API configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# TypeScript monitoring (optional)
TYPESCRIPT_MONITORING_ENABLED=true
```

### 2. VS Code Workspace Settings

The `.vscode/settings.json` file includes:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

### 3. Package.json Scripts

Key scripts for the maintenance system:
```json
{
  "scripts": {
    "typescript:validate": "node scripts/typescript-error-detector.js",
    "typescript:pre-commit": "node scripts/pre-commit-typescript-check.js",
    "typescript:config:validate": "node scripts/typescript-config-manager.js validate",
    "typescript:performance:monitor": "node scripts/typescript-performance-optimizer.js validate"
  }
}
```

## 🧪 Testing the Setup

### 1. Basic Validation

```bash
# Test TypeScript compilation
npm run type-check

# Test ESLint rules
npm run lint

# Test Prettier formatting
npm run format:check

# Run all tests
npm test
```

### 2. Pre-commit Hook Testing

```bash
# Make a small change to a TypeScript file
echo "// Test comment" >> src/app/page.tsx

# Stage the change
git add src/app/page.tsx

# Attempt to commit (should trigger validation)
git commit -m "Test pre-commit hooks"
```

### 3. Performance Validation

```bash
# Test build performance
npm run typescript:performance:validate

# Generate performance report
npm run typescript:performance:report
```

## 🔍 Verification Checklist

After setup, verify these items work correctly:

- [ ] TypeScript compilation succeeds without errors
- [ ] ESLint validation passes with configured rules
- [ ] Prettier formatting is applied consistently
- [ ] Pre-commit hooks prevent commits with TypeScript errors
- [ ] VS Code shows real-time TypeScript errors
- [ ] Auto-imports work correctly
- [ ] Property-based tests can be run
- [ ] Performance monitoring collects metrics

## 🚨 Common Setup Issues

### Issue: Pre-commit hooks not running
**Solution:**
```bash
# Reinstall Husky
rm -rf .husky
npm run prepare
```

### Issue: TypeScript errors not showing in VS Code
**Solution:**
1. Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Check VS Code extensions are installed
3. Verify workspace settings are not overridden

### Issue: ESLint rules not applying
**Solution:**
```bash
# Check ESLint configuration
npm run lint -- --print-config src/app/page.tsx

# Restart VS Code ESLint server
# Ctrl+Shift+P → "ESLint: Restart ESLint Server"
```

### Issue: Performance monitoring not working
**Solution:**
```bash
# Setup monitoring system
npm run monitoring:setup

# Verify monitoring configuration
ls -la .typescript-monitoring/
```

## 🔄 Next Steps

After successful setup:

1. Read the [Developer Onboarding Guide](./developer-onboarding.md)
2. Review [TypeScript Best Practices](./typescript-best-practices.md)
3. Set up [CI/CD Integration](./cicd-integration.md)
4. Configure [Monitoring and Alerts](./monitoring.md)

## 📞 Getting Help

If you encounter issues during setup:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Run diagnostic commands:
   ```bash
   npm run typescript:detect-errors:summary
   npm run validate:ide
   ```
3. Contact the development team with:
   - Your operating system and versions
   - Complete error messages
   - Steps you've already tried

---

*Setup guide last updated: December 2024*