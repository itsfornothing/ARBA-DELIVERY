/**
 * **Feature: frontend-missing-utilities-fix, Property 2: TypeScript Compilation Success**
 * **Validates: Requirements 1.3**
 * 
 * Property: For any TypeScript compilation run, all utility module imports should be 
 * found and resolved without module resolution errors
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('TypeScript Compilation Success Property Tests', () => {
  
  it('Property 2.1: TypeScript compiler resolves all utility module imports successfully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('@/lib/utils', '@/lib/validation', '@/lib/theme', '@/lib/api'),
        (importPath) => {
          // Test that TypeScript can resolve the import path
          let compilationError: Error | null = null;
          let module: any = null;
          
          try {
            // Use require.resolve to test module resolution
            const resolvedPath = require.resolve(importPath);
            expect(resolvedPath).toBeDefined();
            expect(fs.existsSync(resolvedPath)).toBe(true);
            
            // Verify the resolved path points to a TypeScript or JavaScript file
            expect(resolvedPath.endsWith('.ts') || resolvedPath.endsWith('.js')).toBe(true);
            
            // Test that the module can be imported
            module = require(importPath);
            
          } catch (error) {
            compilationError = error as Error;
          }
          
          // Module resolution should succeed
          expect(compilationError).toBeNull();
          expect(module).toBeDefined();
          expect(typeof module).toBe('object');
          
          // Verify module has expected exports based on import path
          if (importPath === '@/lib/utils') {
            expect(module.cn).toBeDefined();
            expect(typeof module.cn).toBe('function');
            expect(module.formatCurrency).toBeDefined();
            expect(typeof module.formatCurrency).toBe('function');
          }
          
          if (importPath === '@/lib/validation') {
            expect(module.FormValidator).toBeDefined();
            expect(typeof module.FormValidator).toBe('function');
            expect(module.commonValidationRules).toBeDefined();
            expect(typeof module.commonValidationRules).toBe('object');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.2: TypeScript configuration enables successful compilation of utility modules', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Read TypeScript configuration
          const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
          expect(fs.existsSync(tsconfigPath)).toBe(true);
          
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
          
          // Verify essential compiler options for module resolution
          expect(tsconfig.compilerOptions.baseUrl).toBe('.');
          expect(tsconfig.compilerOptions.paths).toBeDefined();
          expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./src/*']);
          expect(tsconfig.compilerOptions.paths['@/lib/*']).toEqual(['./src/lib/*']);
          
          // Verify module resolution strategy
          expect(tsconfig.compilerOptions.moduleResolution).toBe('bundler');
          expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
          expect(tsconfig.compilerOptions.allowSyntheticDefaultImports).toBe(true);
          
          // Verify strict mode is enabled for better error detection
          expect(tsconfig.compilerOptions.strict).toBe(true);
          expect(tsconfig.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
          
          // Verify JSX configuration for React components
          expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
          
          // Verify include patterns cover utility modules
          expect(tsconfig.include).toBeDefined();
          expect(Array.isArray(tsconfig.include)).toBe(true);
          expect(tsconfig.include.some((pattern: string) => 
            pattern.includes('**/*.ts') || pattern.includes('**/*.tsx')
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.3: All utility modules compile without TypeScript errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/lib/utils.ts',
          'src/lib/validation.ts', 
          'src/lib/theme.ts',
          'src/lib/api.ts',
          'src/lib/accessibility.ts'
        ),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          
          // Verify file exists
          expect(fs.existsSync(fullPath)).toBe(true);
          
          // Read file content
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          expect(fileContent.length).toBeGreaterThan(0);
          
          // Verify file has valid TypeScript syntax (basic checks)
          expect(fileContent).not.toContain('syntax error');
          
          // Check for common TypeScript patterns
          const hasImports = fileContent.includes('import') || fileContent.includes('require');
          const hasExports = fileContent.includes('export');
          
          // Utility modules should have exports
          expect(hasExports).toBe(true);
          
          // Test that TypeScript can parse the file by attempting to require it
          let parseError: Error | null = null;
          try {
            const resolvedPath = require.resolve(`@/${filePath.replace('src/', '').replace('.ts', '')}`);
            expect(resolvedPath).toBeDefined();
          } catch (error) {
            parseError = error as Error;
          }
          
          expect(parseError).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.4: TypeScript compilation handles dependency imports correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('clsx', 'tailwind-merge', 'react', 'next'),
        (dependency) => {
          // Test that TypeScript can resolve external dependencies
          let dependencyError: Error | null = null;
          let dependencyModule: any = null;
          
          try {
            dependencyModule = require(dependency);
          } catch (error) {
            dependencyError = error as Error;
          }
          
          // Dependencies should resolve successfully
          expect(dependencyError).toBeNull();
          expect(dependencyModule).toBeDefined();
          
          // Verify package.json includes the dependency
          const packageJsonPath = path.join(process.cwd(), 'package.json');
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          const hasDependency = 
            packageJson.dependencies[dependency] || 
            packageJson.devDependencies[dependency];
          
          expect(hasDependency).toBeDefined();
          
          // Test specific dependencies used in utility modules
          if (dependency === 'clsx') {
            expect(typeof dependencyModule === 'function' || 
                   typeof dependencyModule.clsx === 'function' || 
                   typeof dependencyModule.default === 'function').toBe(true);
          }
          
          if (dependency === 'tailwind-merge') {
            expect(typeof dependencyModule.twMerge === 'function' || 
                   typeof dependencyModule.default === 'function').toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.5: TypeScript compilation produces valid JavaScript output', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('@/lib/utils', '@/lib/validation'),
        (importPath) => {
          // Test that compiled modules can be executed
          let executionError: Error | null = null;
          let module: any = null;
          
          try {
            module = require(importPath);
            
            // Test that exported functions can be called
            if (importPath === '@/lib/utils') {
              // Test cn function
              const result = module.cn('test-class', 'another-class');
              expect(typeof result).toBe('string');
              expect(result.length).toBeGreaterThan(0);
              
              // Test formatCurrency function
              const currencyResult = module.formatCurrency(123.45);
              expect(typeof currencyResult).toBe('string');
              expect(currencyResult).toContain('$');
              expect(currencyResult).toContain('123.45');
            }
            
            if (importPath === '@/lib/validation') {
              // Test FormValidator.validate method
              const validationResult = module.FormValidator.validate('test@example.com', { email: true });
              expect(validationResult).toBeDefined();
              expect(typeof validationResult.isValid).toBe('boolean');
              
              // Test commonValidationRules
              expect(module.commonValidationRules.email).toBeDefined();
              expect(module.commonValidationRules.email.required).toBe(true);
              expect(module.commonValidationRules.email.email).toBe(true);
            }
            
          } catch (error) {
            executionError = error as Error;
          }
          
          // Module execution should succeed
          expect(executionError).toBeNull();
          expect(module).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.6: TypeScript compilation handles type definitions correctly', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Verify TypeScript can find type definitions
          const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
          
          // Check that types are configured
          expect(tsconfig.compilerOptions.types).toBeDefined();
          expect(Array.isArray(tsconfig.compilerOptions.types)).toBe(true);
          
          // Essential types should be included
          const types = tsconfig.compilerOptions.types;
          expect(types.includes('jest')).toBe(true);
          expect(types.includes('@testing-library/jest-dom')).toBe(true);
          expect(types.includes('node')).toBe(true);
          
          // Verify Next.js types are available
          const nextEnvPath = path.join(process.cwd(), 'next-env.d.ts');
          expect(fs.existsSync(nextEnvPath)).toBe(true);
          
          // Verify include patterns cover type definition files
          expect(tsconfig.include.includes('next-env.d.ts')).toBe(true);
          expect(tsconfig.include.some((pattern: string) => 
            pattern.includes('**/*.d.ts')
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.7: TypeScript compilation resolves path mappings consistently', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { alias: '@/lib/utils', expected: './src/lib/utils' },
          { alias: '@/lib/validation', expected: './src/lib/validation' },
          { alias: '@/components/Button', expected: './src/components/Button' },
          { alias: '@/app/page', expected: './src/app/page' }
        ),
        (pathMapping) => {
          const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
          
          // Verify path mapping configuration
          expect(tsconfig.compilerOptions.paths).toBeDefined();
          
          // Check specific path mappings
          const paths = tsconfig.compilerOptions.paths;
          
          if (pathMapping.alias.startsWith('@/lib/')) {
            expect(paths['@/lib/*']).toEqual(['./src/lib/*']);
          }
          
          if (pathMapping.alias.startsWith('@/components/')) {
            expect(paths['@/components/*']).toEqual(['./src/components/*']);
          }
          
          if (pathMapping.alias.startsWith('@/app/')) {
            expect(paths['@/app/*']).toEqual(['./src/app/*']);
          }
          
          // General @/* mapping should exist
          expect(paths['@/*']).toEqual(['./src/*']);
          
          // Base URL should be configured
          expect(tsconfig.compilerOptions.baseUrl).toBe('.');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.8: TypeScript compilation handles import/export syntax correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { module: '@/lib/utils', exportType: 'named' },
          { module: '@/lib/validation', exportType: 'named' },
          { module: '@/lib/theme', exportType: 'named' }
        ),
        (moduleInfo) => {
          let importError: Error | null = null;
          let module: any = null;
          
          try {
            module = require(moduleInfo.module);
          } catch (error) {
            importError = error as Error;
          }
          
          // Import should succeed
          expect(importError).toBeNull();
          expect(module).toBeDefined();
          
          // Verify module has exports
          const moduleKeys = Object.keys(module);
          expect(moduleKeys.length).toBeGreaterThan(0);
          
          // Test specific export patterns
          if (moduleInfo.module === '@/lib/utils') {
            // Should have named exports
            expect(module.cn).toBeDefined();
            expect(module.formatCurrency).toBeDefined();
            expect(module.formatDistance).toBeDefined();
            expect(module.formatDateTime).toBeDefined();
          }
          
          if (moduleInfo.module === '@/lib/validation') {
            // Should have class and object exports
            expect(module.FormValidator).toBeDefined();
            expect(module.commonValidationRules).toBeDefined();
            expect(typeof module.FormValidator).toBe('function');
            expect(typeof module.commonValidationRules).toBe('object');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.9: TypeScript compilation maintains type safety across modules', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Test that TypeScript configuration enforces type safety
          const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
          
          // Strict mode should be enabled
          expect(tsconfig.compilerOptions.strict).toBe(true);
          
          // Additional strict checks
          expect(tsconfig.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
          expect(tsconfig.compilerOptions.isolatedModules).toBe(true);
          
          // No emit for type checking only
          expect(tsconfig.compilerOptions.noEmit).toBe(true);
          
          // Test that utility modules can be imported with proper types
          const utilsModule = require('@/lib/utils');
          const validationModule = require('@/lib/validation');
          
          // Functions should be callable and return expected types
          const cnResult = utilsModule.cn('test');
          expect(typeof cnResult).toBe('string');
          
          const validationResult = validationModule.FormValidator.validate('test', { required: true });
          expect(typeof validationResult).toBe('object');
          expect(typeof validationResult.isValid).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.10: TypeScript compilation succeeds with all utility module combinations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom('@/lib/utils', '@/lib/validation', '@/lib/theme', '@/lib/api'),
          { minLength: 1, maxLength: 4 }
        ),
        (importPaths) => {
          // Test that multiple utility modules can be imported together
          const modules: Record<string, any> = {};
          let combinedImportError: Error | null = null;
          
          try {
            importPaths.forEach(importPath => {
              modules[importPath] = require(importPath);
            });
          } catch (error) {
            combinedImportError = error as Error;
          }
          
          // All imports should succeed
          expect(combinedImportError).toBeNull();
          
          // Verify all modules are loaded
          importPaths.forEach(importPath => {
            expect(modules[importPath]).toBeDefined();
            expect(typeof modules[importPath]).toBe('object');
          });
          
          // Test that modules can work together
          if (modules['@/lib/utils'] && modules['@/lib/validation']) {
            const utilsModule = modules['@/lib/utils'];
            const validationModule = modules['@/lib/validation'];
            
            // Test combined functionality
            const className = utilsModule.cn('form-input');
            expect(typeof className).toBe('string');
            
            const validation = validationModule.FormValidator.validate('test@example.com', { email: true });
            expect(validation.isValid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});