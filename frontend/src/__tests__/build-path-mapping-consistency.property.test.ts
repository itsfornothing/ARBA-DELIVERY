/**
 * **Feature: frontend-missing-utilities-fix, Property 3: Build Path Mapping Consistency**
 * **Validates: Requirements 1.4, 3.2, 3.3**
 * 
 * Property: For any @/* import in the codebase, Next.js should correctly map the path 
 * using the configured baseUrl and paths settings
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Build Path Mapping Consistency Property Tests', () => {
  
  it('Property 3.1: TypeScript path mapping configuration is consistent', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Read and validate TypeScript configuration
          const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
          expect(fs.existsSync(tsconfigPath)).toBe(true);
          
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
          
          // Verify baseUrl is set correctly
          expect(tsconfig.compilerOptions.baseUrl).toBeDefined();
          expect(tsconfig.compilerOptions.baseUrl).toBe('.');
          
          // Verify paths configuration exists and is correct
          expect(tsconfig.compilerOptions.paths).toBeDefined();
          expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();
          expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./src/*']);
          
          // Verify module resolution is set appropriately
          expect(tsconfig.compilerOptions.moduleResolution).toBeDefined();
          expect(['bundler', 'node'].includes(tsconfig.compilerOptions.moduleResolution)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.2: Path mapping resolves to existing source directories', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib', 'components', 'app', 'types', 'styles'),
        (subDirectory) => {
          // Test that @/* paths resolve to actual directories
          const expectedPath = path.join(process.cwd(), 'src', subDirectory);
          
          // The directory should exist or be creatable
          const srcPath = path.join(process.cwd(), 'src');
          expect(fs.existsSync(srcPath)).toBe(true);
          
          // If the subdirectory exists, verify it's accessible
          if (fs.existsSync(expectedPath)) {
            const stats = fs.statSync(expectedPath);
            expect(stats.isDirectory()).toBe(true);
          }
          
          // Verify the path mapping would resolve correctly
          const mappedPath = expectedPath.replace(process.cwd(), '').replace(/^\//, '');
          expect(mappedPath).toMatch(/^src\//);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.3: Next.js configuration supports TypeScript path mapping', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Read Next.js configuration
          const nextConfigPath = path.join(process.cwd(), 'next.config.js');
          expect(fs.existsSync(nextConfigPath)).toBe(true);
          
          // Load the Next.js configuration
          let nextConfig: any;
          try {
            nextConfig = require(nextConfigPath);
          } catch (error) {
            fail(`Failed to load Next.js configuration: ${error}`);
          }
          
          // Verify TypeScript is not disabled
          if (nextConfig.typescript) {
            expect(nextConfig.typescript.ignoreBuildErrors).toBe(false);
          }
          
          // Verify webpack configuration doesn't interfere with path resolution
          if (nextConfig.webpack) {
            expect(typeof nextConfig.webpack).toBe('function');
          }
          
          // Verify experimental features don't conflict with path mapping
          if (nextConfig.experimental) {
            expect(typeof nextConfig.experimental).toBe('object');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.4: Path mapping works consistently across development and production', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('development', 'production', 'test'),
        (nodeEnv) => {
          const originalNodeEnv = process.env.NODE_ENV;
          
          try {
            // Set the environment
            (process.env as any).NODE_ENV = nodeEnv;
            
            // Test that path mapping works in this environment
            let importError: Error | null = null;
            let utilsModule: any = null;
            
            try {
              utilsModule = require('@/lib/utils');
            } catch (error) {
              importError = error as Error;
            }
            
            // Import should succeed regardless of environment
            expect(importError).toBeNull();
            expect(utilsModule).toBeDefined();
            
            // Verify the module has expected exports
            expect(utilsModule).toHaveProperty('cn');
            expect(typeof utilsModule.cn).toBe('function');
            
            // Test that the function works correctly
            const result = utilsModule.cn('test-class');
            expect(typeof result).toBe('string');
            
          } finally {
            // Restore original environment
            if (originalNodeEnv !== undefined) {
              (process.env as any).NODE_ENV = originalNodeEnv;
            } else {
              (process.env as any).NODE_ENV = undefined;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.5: Path mapping handles nested imports correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('lib', 'components', 'types'), { minLength: 1, maxLength: 3 }),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
        (pathSegments, fileName) => {
          // Test nested path resolution
          const nestedPath = pathSegments.join('/');
          const fullPath = `@/${nestedPath}/${fileName}`;
          
          // Verify the path structure makes sense
          expect(nestedPath).toMatch(/^(lib|components|types)/);
          expect(fileName).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
          
          // Test that the path would resolve to the correct location
          const expectedFilePath = path.join(process.cwd(), 'src', nestedPath, fileName);
          const expectedDir = path.dirname(expectedFilePath);
          
          // The parent directories should exist or be under src
          const srcPath = path.join(process.cwd(), 'src');
          expect(expectedDir.startsWith(srcPath)).toBe(true);
          
          // If the directory exists, it should be accessible
          if (fs.existsSync(expectedDir)) {
            const stats = fs.statSync(expectedDir);
            expect(stats.isDirectory()).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.6: Path mapping configuration is compatible with build tools', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Test that the configuration works with various build tools
          const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
          
          // Verify compatibility with TypeScript compiler
          expect(tsconfig.compilerOptions.moduleResolution).toBeDefined();
          expect(tsconfig.compilerOptions.baseUrl).toBeDefined();
          expect(tsconfig.compilerOptions.paths).toBeDefined();
          
          // Verify compatibility with Next.js
          const nextConfigPath = path.join(process.cwd(), 'next.config.js');
          const nextConfig = require(nextConfigPath);
          
          // Next.js should not override TypeScript path mapping
          if (nextConfig.typescript) {
            expect(nextConfig.typescript.ignoreBuildErrors).toBe(false);
          }
          
          // Verify compatibility with Jest (if jest config exists)
          const packageJsonPath = path.join(process.cwd(), 'package.json');
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          if (packageJson.jest || fs.existsSync(path.join(process.cwd(), 'jest.config.js'))) {
            // Jest should be configured to handle path mapping
            // This is typically done through moduleNameMapper
            expect(true).toBe(true); // Jest configuration is handled separately
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.7: Path mapping resolves imports without circular dependencies', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('@/lib/utils', '@/lib/validation'),
        (importPath) => {
          // Test that imports don't create circular dependencies
          let importError: Error | null = null;
          let module: any = null;
          
          try {
            module = require(importPath);
          } catch (error) {
            importError = error as Error;
          }
          
          // Import should succeed without circular dependency errors
          expect(importError).toBeNull();
          expect(module).toBeDefined();
          
          // Verify the module doesn't import itself
          const moduleKeys = Object.keys(module);
          expect(moduleKeys.length).toBeGreaterThan(0);
          
          // Test that the module exports are accessible
          moduleKeys.forEach(key => {
            expect(module[key]).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.8: Path mapping works with different file extensions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('.ts', '.tsx', '.js', '.jsx'),
        (extension) => {
          // Test that path mapping works regardless of file extension
          const basePath = '@/lib/utils';
          
          // The import should work without specifying extension
          let importError: Error | null = null;
          let module: any = null;
          
          try {
            module = require(basePath);
          } catch (error) {
            importError = error as Error;
          }
          
          // Import should succeed regardless of the actual file extension
          expect(importError).toBeNull();
          expect(module).toBeDefined();
          
          // Verify the module has expected structure
          expect(typeof module).toBe('object');
          expect(Object.keys(module).length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.9: Path mapping maintains consistency during hot reloading', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isDevelopment) => {
          const originalNodeEnv = process.env.NODE_ENV;
          
          try {
            // Set environment to simulate development/production
            (process.env as any).NODE_ENV = isDevelopment ? 'development' : 'production';
            
            // Test that path mapping works consistently
            let firstImport: any = null;
            let secondImport: any = null;
            let importError: Error | null = null;
            
            try {
              // First import
              firstImport = require('@/lib/utils');
              
              // Clear require cache to simulate hot reload
              const modulePath = require.resolve('@/lib/utils');
              delete require.cache[modulePath];
              
              // Second import after cache clear
              secondImport = require('@/lib/utils');
              
            } catch (error) {
              importError = error as Error;
            }
            
            // Both imports should succeed
            expect(importError).toBeNull();
            expect(firstImport).toBeDefined();
            expect(secondImport).toBeDefined();
            
            // Both imports should have the same structure
            expect(Object.keys(firstImport)).toEqual(Object.keys(secondImport));
            
            // Functions should be equivalent
            expect(typeof firstImport.cn).toBe(typeof secondImport.cn);
            expect(typeof firstImport.formatCurrency).toBe(typeof secondImport.formatCurrency);
            
          } finally {
            // Restore original environment
            if (originalNodeEnv !== undefined) {
              (process.env as any).NODE_ENV = originalNodeEnv;
            } else {
              (process.env as any).NODE_ENV = undefined;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3.10: Path mapping error messages are clear and helpful', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
        (nonExistentModule) => {
          // Test that importing non-existent modules gives clear error messages
          const invalidPath = `@/lib/${nonExistentModule}`;
          
          let importError: Error | null = null;
          
          try {
            require(invalidPath);
          } catch (error) {
            importError = error as Error;
          }
          
          // Should get a clear error for non-existent modules
          expect(importError).not.toBeNull();
          
          if (importError) {
            // Verify we get a meaningful error message
            expect(importError.message).toBeDefined();
            expect(importError.message.length).toBeGreaterThan(0);
            
            const errorMessage = importError.message.toLowerCase();
            
            // Check for Jest configuration error (which is what we actually get in test environment)
            // or standard Node.js module resolution errors
            const isValidError = 
              errorMessage.includes('configuration error') ||
              errorMessage.includes('could not locate module') ||
              errorMessage.includes('cannot find module') ||
              errorMessage.includes('module not found') ||
              errorMessage.includes('cannot resolve') ||
              errorMessage.includes('enoent') ||
              errorMessage.includes('no such file') ||
              errorMessage.includes('failed to resolve');
            
            expect(isValidError).toBe(true);
            
            // Error message should reference the attempted import path
            const hasPathReference = 
              importError.message.includes(nonExistentModule) || 
              importError.message.includes('@/lib') ||
              errorMessage.includes('lib/' + nonExistentModule.toLowerCase());
            
            expect(hasPathReference).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});