# Troubleshooting Guide - TypeScript Maintenance System

This guide helps you diagnose and resolve common issues with the TypeScript Maintenance System. Issues are organized by category with step-by-step solutions.

## 🚨 Quick Diagnostic Commands

Before diving into specific issues, run these diagnostic commands:

```bash
# Check overall system health
npm run typescript:detect-errors:summary

# Validate configuration
npm run typescript:config:validate

# Check IDE setup
npm run validate:ide

# Test pre-commit hooks
git add . && git commit -m "Test commit" --dry-run
```

## 🔧 TypeScript Compilation Issues

### Issue: "Cannot find module" errors

**Symptoms:**
```
error TS2307: Cannot find module '@/components/Button' or its corresponding type declarations.
```

**Diagnosis:**
```bash
# Check path mappings
npm run typescript:config:paths

# Verify file exists
ls -la src/components/Button.tsx
```

**Solutions:**

1. **Check tsconfig.json paths:**
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"],
         "@/components/*": ["./src/components/*"]
       }
     }
   }
   ```

2. **Verify file extensions:**
   ```typescript
   // ✅ Correct
   import { Button } from '@/components/Button';
   
   // ❌ Don't include extension
   import { Button } from '@/components/Button.tsx';
   ```

3. **Restart TypeScript server:**
   - VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
   - Command line: `npm run type-check`

### Issue: "Type 'X' is not assignable to type 'Y'"

**Symptoms:**
```
error TS2322: Type 'string | undefined' is not assignable to type 'string'.
```

**Diagnosis:**
```bash
# Check specific file
npx tsc --noEmit --skipLibCheck src/path/to/file.ts
```

**Solutions:**

1. **Add proper type guards:**
   ```typescript
   // ❌ Problem
   function processUser(user: User | undefined) {
     return user.name; // Error: user might be undefined
   }
   
   // ✅ Solution
   function processUser(user: User | undefined) {
     if (!user) return 'Unknown';
     return user.name;
   }
   ```

2. **Use optional chaining:**
   ```typescript
   // ✅ Safe access
   const userName = user?.name ?? 'Unknown';
   ```

3. **Update type definitions:**
   ```typescript
   // Make properties optional if they can be undefined
   interface User {
     name?: string; // Instead of name: string
   }
   ```

### Issue: Slow TypeScript compilation

**Symptoms:**
- Long build times
- VS Code becomes unresponsive
- Type checking takes minutes

**Diagnosis:**
```bash
# Check performance metrics
npm run typescript:performance:validate

# Generate performance report
npm run typescript:performance:report
```

**Solutions:**

1. **Enable incremental compilation:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "incremental": true,
       "tsBuildInfoFile": ".typescript-cache/tsconfig.tsbuildinfo"
     }
   }
   ```

2. **Exclude unnecessary files:**
   ```json
   // tsconfig.json
   {
     "exclude": [
       "node_modules",
       ".next",
       "coverage",
       "**/*.test.ts",
       "**/*.spec.ts"
     ]
   }
   ```

3. **Use project references for large codebases:**
   ```json
   // tsconfig.json
   {
     "references": [
       { "path": "./src/components" },
       { "path": "./src/lib" }
     ]
   }
   ```

## 🎨 ESLint Issues

### Issue: ESLint rules not applying

**Symptoms:**
- Code doesn't follow style guidelines
- No linting errors shown in VS Code
- `npm run lint` doesn't catch issues

**Diagnosis:**
```bash
# Check ESLint configuration
npm run lint -- --print-config src/app/page.tsx

# Test ESLint directly
npx eslint src/app/page.tsx
```

**Solutions:**

1. **Verify ESLint configuration:**
   ```bash
   # Check if eslint.config.mjs exists and is valid
   cat eslint.config.mjs
   
   # Test configuration syntax
   node -c eslint.config.mjs
   ```

2. **Restart ESLint server in VS Code:**
   - `Ctrl+Shift+P` → "ESLint: Restart ESLint Server"

3. **Check file patterns:**
   ```javascript
   // eslint.config.mjs
   export default [
     {
       files: ["**/*.ts", "**/*.tsx"], // Ensure your files match
       // ... rules
     }
   ];
   ```

### Issue: ESLint auto-fix not working

**Symptoms:**
- Code doesn't format on save
- `eslint --fix` doesn't change files
- Pre-commit hooks don't fix issues

**Solutions:**

1. **Check VS Code settings:**
   ```json
   // .vscode/settings.json
   {
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "eslint.validate": ["typescript", "typescriptreact"]
   }
   ```

2. **Verify fixable rules:**
   ```bash
   # Check which rules are fixable
   npm run lint -- --fix-dry-run src/app/page.tsx
   ```

3. **Manual fix command:**
   ```bash
   # Fix all files
   npm run lint:fix
   
   # Fix specific file
   npx eslint --fix src/app/page.tsx
   ```

## 🪝 Pre-commit Hook Issues

### Issue: Pre-commit hooks not running

**Symptoms:**
- Can commit code with TypeScript errors
- No validation messages during commit
- Husky hooks seem inactive

**Diagnosis:**
```bash
# Check Husky installation
ls -la .husky/

# Test pre-commit hook manually
.husky/pre-commit
```

**Solutions:**

1. **Reinstall Husky:**
   ```bash
   rm -rf .husky
   npm run prepare
   ```

2. **Check Git hooks:**
   ```bash
   # Verify Git hooks are installed
   ls -la .git/hooks/
   
   # Should see pre-commit pointing to Husky
   cat .git/hooks/pre-commit
   ```

3. **Fix permissions:**
   ```bash
   chmod +x .husky/pre-commit
   chmod +x .husky/_/husky.sh
   ```

### Issue: Pre-commit validation failing

**Symptoms:**
```
✖ npm run typescript:pre-commit:
  error TS2322: Type 'string' is not assignable to type 'number'.
```

**Solutions:**

1. **Fix TypeScript errors first:**
   ```bash
   # See all errors
   npm run typescript:detect-errors
   
   # Fix errors manually or with suggestions
   npm run typescript:detect-errors:json
   ```

2. **Bypass for emergency commits (use sparingly):**
   ```bash
   git commit -m "Emergency fix" --no-verify
   ```

3. **Update pre-commit configuration:**
   ```json
   // package.json
   {
     "lint-staged": {
       "*.{ts,tsx}": [
         "npm run typescript:pre-commit",
         "eslint --fix",
         "prettier --write"
       ]
     }
   }
   ```

## 🖥️ VS Code Integration Issues

### Issue: TypeScript errors not showing in VS Code

**Symptoms:**
- No red squiggly lines for TypeScript errors
- IntelliSense not working
- Auto-imports not functioning

**Solutions:**

1. **Restart TypeScript server:**
   - `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

2. **Check TypeScript version:**
   ```bash
   # Check workspace TypeScript version
   npx tsc --version
   
   # Check VS Code is using workspace version
   # Ctrl+Shift+P → "TypeScript: Select TypeScript Version"
   ```

3. **Verify workspace settings:**
   ```json
   // .vscode/settings.json
   {
     "typescript.preferences.includePackageJsonAutoImports": "on",
     "typescript.suggest.autoImports": true,
     "typescript.validate.enable": true
   }
   ```

4. **Check for conflicting extensions:**
   - Disable other TypeScript extensions temporarily
   - Ensure you're using the official TypeScript extension

### Issue: Performance problems in VS Code

**Symptoms:**
- VS Code becomes slow or unresponsive
- High CPU usage
- Long delays when typing

**Solutions:**

1. **Exclude large directories:**
   ```json
   // .vscode/settings.json
   {
     "files.exclude": {
       "**/node_modules": true,
       "**/.next": true,
       "**/coverage": true
     },
     "search.exclude": {
       "**/node_modules": true,
       "**/.next": true
     }
   }
   ```

2. **Limit TypeScript memory:**
   ```json
   // .vscode/settings.json
   {
     "typescript.tsserver.maxTsServerMemory": 4096
   }
   ```

3. **Use TypeScript project references:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "composite": true
     },
     "references": [
       { "path": "./src/components/tsconfig.json" }
     ]
   }
   ```

## 🧪 Testing Issues

### Issue: Property-based tests failing

**Symptoms:**
```
Property failed after 1 tests
{ seed: 123456789, path: "0", endOnFailure: true }
Counterexample: ["invalid-input"]
```

**Solutions:**

1. **Analyze the counterexample:**
   ```typescript
   // Add logging to understand the failure
   fc.assert(fc.property(
     fc.string(),
     (input) => {
       console.log('Testing with input:', input);
       const result = myFunction(input);
       expect(result).toBeDefined();
     }
   ));
   ```

2. **Improve input generators:**
   ```typescript
   // ❌ Too broad
   fc.string()
   
   // ✅ More specific
   fc.string({ minLength: 1, maxLength: 100 })
     .filter(s => s.trim().length > 0)
   ```

3. **Add preconditions:**
   ```typescript
   fc.assert(fc.property(
     fc.string(),
     (input) => {
       fc.pre(input.length > 0); // Skip empty strings
       const result = myFunction(input);
       expect(result).toBeDefined();
     }
   ));
   ```

### Issue: Jest configuration problems

**Symptoms:**
- Tests not running
- Module resolution errors in tests
- TypeScript compilation errors in test files

**Solutions:**

1. **Check Jest configuration:**
   ```javascript
   // jest.config.js
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     moduleNameMapping: {
       '^@/(.*)$': '<rootDir>/src/$1'
     },
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
   };
   ```

2. **Verify test file patterns:**
   ```javascript
   // jest.config.js
   {
     testMatch: [
       '**/__tests__/**/*.(ts|tsx)',
       '**/*.(test|spec).(ts|tsx)'
     ]
   }
   ```

## 🔄 CI/CD Issues

### Issue: GitHub Actions failing

**Symptoms:**
- CI builds failing with TypeScript errors
- Different behavior between local and CI
- Timeout issues in CI

**Solutions:**

1. **Check Node.js version consistency:**
   ```yaml
   # .github/workflows/typescript-validation.yml
   - uses: actions/setup-node@v3
     with:
       node-version: '18' # Match your local version
   ```

2. **Cache dependencies:**
   ```yaml
   - name: Cache dependencies
     uses: actions/cache@v3
     with:
       path: ~/.npm
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

3. **Add debugging:**
   ```yaml
   - name: Debug TypeScript
     run: |
       npm run typescript:detect-errors:summary
       npm run typescript:config:validate
   ```

## 🔧 Performance Issues

### Issue: Slow build times

**Symptoms:**
- `npm run build` takes several minutes
- Development server slow to start
- Hot reload is sluggish

**Solutions:**

1. **Enable build caching:**
   ```bash
   # Clear existing cache
   rm -rf .next .typescript-cache

   # Rebuild with fresh cache
   npm run build
   ```

2. **Optimize TypeScript configuration:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "incremental": true,
       "skipLibCheck": true,
       "isolatedModules": true
     }
   }
   ```

3. **Use SWC instead of Babel:**
   ```javascript
   // next.config.js
   module.exports = {
     swcMinify: true,
     experimental: {
       swcTraceProfiling: true
     }
   };
   ```

## 📊 Monitoring Issues

### Issue: Monitoring not collecting metrics

**Symptoms:**
- No metrics in monitoring dashboard
- Empty performance reports
- Alerts not triggering

**Solutions:**

1. **Initialize monitoring:**
   ```bash
   npm run monitoring:setup
   ```

2. **Check monitoring configuration:**
   ```bash
   ls -la .typescript-monitoring/
   cat .typescript-monitoring/monitoring-config.json
   ```

3. **Manually collect metrics:**
   ```bash
   npm run monitoring:collect
   npm run monitoring:trends
   ```

## 🆘 Emergency Procedures

### Complete System Reset

If everything is broken, try this complete reset:

```bash
# 1. Clean all caches and builds
rm -rf node_modules .next .typescript-cache coverage
rm -rf .husky

# 2. Reinstall dependencies
npm install

# 3. Reinitialize Git hooks
npm run prepare

# 4. Validate setup
npm run typescript:config:validate
npm run validate:ide

# 5. Test the system
npm run typescript:validate
npm test
```

### Bypass All Validation (Emergency Only)

```bash
# Commit without validation (use sparingly!)
git commit -m "Emergency commit" --no-verify

# Skip TypeScript checking in build
npm run build:no-typecheck
```

## 📞 Getting Additional Help

### Information to Gather

When asking for help, include:

1. **System information:**
   ```bash
   node --version
   npm --version
   npx tsc --version
   ```

2. **Error details:**
   ```bash
   npm run typescript:detect-errors:summary > error-report.txt
   ```

3. **Configuration:**
   ```bash
   cat tsconfig.json
   cat eslint.config.mjs
   cat package.json
   ```

### Diagnostic Report

Generate a comprehensive diagnostic report:

```bash
# Create diagnostic report
{
  echo "=== System Info ==="
  node --version
  npm --version
  echo ""
  
  echo "=== TypeScript Errors ==="
  npm run typescript:detect-errors:summary
  echo ""
  
  echo "=== Configuration Status ==="
  npm run typescript:config:validate
  echo ""
  
  echo "=== IDE Setup ==="
  npm run validate:ide
} > diagnostic-report.txt
```

### Contact Information

- **Team Chat**: Post in #frontend-dev channel
- **Documentation**: Check other guides in `/docs/`
- **Issues**: Create detailed GitHub issue with diagnostic report

---

*Troubleshooting guide last updated: December 2024*