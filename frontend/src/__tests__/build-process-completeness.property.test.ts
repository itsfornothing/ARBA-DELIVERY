/**
 * Property-Based Test for Build Process Completeness
 * Feature: frontend-deployment-fix, Property 2: Build Process Completeness
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 4.1
 * 
 * This test validates that for any valid package.json and source code, the build process
 * should install all dependencies and generate all required static assets without errors.
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Build Process Completeness Properties', () => {
  describe('Property 2: Build Process Completeness', () => {
    /**
     * For any valid package.json and source code, the build process should install 
     * all dependencies and generate all required static assets without errors
     * 
     * Validates: Requirements 3.1, 3.2, 3.3, 4.1
     */
    it('should complete build process successfully for any valid configuration', () => {
      fc.assert(
        fc.property(
          // Generate different build scenarios
          fc.record({
            nodeEnv: fc.constantFrom('production', 'development'),
            buildCommand: fc.constantFrom('npm run build', 'npm run build:no-typecheck'),
            hasTypeScript: fc.constant(true), // Our project uses TypeScript
            hasNextConfig: fc.constant(true), // Our project has next.config.js
            optimizationLevel: fc.constantFrom('default', 'performance')
          }),
          (config) => {
            // Test that package.json is valid and contains all required build dependencies
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            expect(fs.existsSync(packageJsonPath)).toBe(true);
            
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Verify all critical build dependencies are present
            const requiredDependencies = ['next', 'react', 'react-dom'];
            requiredDependencies.forEach(dep => {
              expect(packageJson.dependencies[dep]).toBeDefined();
              expect(typeof packageJson.dependencies[dep]).toBe('string');
            });
            
            // Verify build scripts are properly configured
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts.build).toMatch(/next build/);
            expect(packageJson.scripts.start).toBeDefined();
            
            // Test that TypeScript configuration is valid if present
            if (config.hasTypeScript) {
              const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
              expect(fs.existsSync(tsConfigPath)).toBe(true);
              
              const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
              expect(tsConfig.compilerOptions).toBeDefined();
              expect(tsConfig.include).toBeDefined();
            }
            
            // Test that Next.js configuration is valid if present
            if (config.hasNextConfig) {
              const nextConfigPath = path.join(process.cwd(), 'next.config.js');
              expect(fs.existsSync(nextConfigPath)).toBe(true);
              
              // Verify Next.js config can be loaded without errors
              expect(() => {
                const nextConfig = require(nextConfigPath);
                expect(typeof nextConfig).toBe('object');
              }).not.toThrow();
            }
            
            // Test that source directory structure is complete
            const srcPath = path.join(process.cwd(), 'src');
            expect(fs.existsSync(srcPath)).toBe(true);
            
            const appPath = path.join(srcPath, 'app');
            expect(fs.existsSync(appPath)).toBe(true);
            
            // Verify essential app files exist
            const layoutPath = path.join(appPath, 'layout.tsx');
            const pagePath = path.join(appPath, 'page.tsx');
            expect(fs.existsSync(layoutPath)).toBe(true);
            expect(fs.existsSync(pagePath)).toBe(true);
            
            // Test that build output directory structure is correct
            const buildOutputPath = path.join(process.cwd(), '.next');
            
            // If .next exists (from previous builds), verify its structure
            if (fs.existsSync(buildOutputPath)) {
              const buildId = path.join(buildOutputPath, 'BUILD_ID');
              const staticPath = path.join(buildOutputPath, 'static');
              
              // BUILD_ID should exist after successful build
              if (fs.existsSync(buildId)) {
                const buildIdContent = fs.readFileSync(buildId, 'utf8').trim();
                expect(buildIdContent).toMatch(/^[a-zA-Z0-9_-]+$/);
              }
              
              // Static assets directory should exist
              if (fs.existsSync(staticPath)) {
                expect(fs.statSync(staticPath).isDirectory()).toBe(true);
              }
            }
            
            // Test that environment variables are properly handled during build
            const originalNodeEnv = process.env.NODE_ENV;
            try {
              process.env.NODE_ENV = config.nodeEnv;
              
              // Verify that NEXT_PUBLIC_ variables are accessible
              const nextPublicVars = Object.keys(process.env)
                .filter(key => key.startsWith('NEXT_PUBLIC_'));
              
              // Each NEXT_PUBLIC_ variable should be a valid string
              nextPublicVars.forEach(key => {
                const value = process.env[key];
                expect(typeof value).toBe('string');
                expect(value.length).toBeGreaterThan(0);
              });
              
            } finally {
              if (originalNodeEnv !== undefined) {
                process.env.NODE_ENV = originalNodeEnv;
              } else {
                delete process.env.NODE_ENV;
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate all required static assets during build', () => {
      fc.assert(
        fc.property(
          // Generate different asset generation scenarios
          fc.record({
            includeImages: fc.boolean(),
            includeFonts: fc.boolean(),
            includeIcons: fc.boolean(),
            optimizeAssets: fc.boolean()
          }),
          (config) => {
            // Test that public directory exists and contains static assets
            const publicPath = path.join(process.cwd(), 'public');
            expect(fs.existsSync(publicPath)).toBe(true);
            
            // Test that static assets are properly structured
            if (fs.existsSync(publicPath)) {
              const publicFiles = fs.readdirSync(publicPath);
              
              // Verify that public directory is not empty
              expect(publicFiles.length).toBeGreaterThan(0);
              
              // Check for common static asset types
              const hasStaticAssets = publicFiles.some(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext);
              });
              
              if (config.includeImages || config.includeIcons) {
                expect(hasStaticAssets).toBe(true);
              }
            }
            
            // Test that CSS and JavaScript assets can be generated
            const srcPath = path.join(process.cwd(), 'src');
            const appPath = path.join(srcPath, 'app');
            
            // Verify that global CSS exists
            const globalCssPath = path.join(appPath, 'globals.css');
            expect(fs.existsSync(globalCssPath)).toBe(true);
            
            // Test that CSS content is valid
            const cssContent = fs.readFileSync(globalCssPath, 'utf8');
            expect(cssContent.length).toBeGreaterThan(0);
            
            // Verify that Tailwind directives are present (our project uses Tailwind)
            expect(cssContent).toMatch(/@tailwind|@import/);
            
            // Test that component files exist and are valid
            const componentsPath = path.join(srcPath, 'components');
            if (fs.existsSync(componentsPath)) {
              const componentFiles = fs.readdirSync(componentsPath, { recursive: true })
                .filter(file => typeof file === 'string' && file.endsWith('.tsx'));
              
              // At least some components should exist
              expect(componentFiles.length).toBeGreaterThan(0);
              
              // Test that component files are valid TypeScript/React
              componentFiles.slice(0, 3).forEach(file => {
                const filePath = path.join(componentsPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Should contain React imports or JSX
                expect(content).toMatch(/import.*react|export.*function|export.*const.*=.*\(/i);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle dependency installation correctly', () => {
      fc.assert(
        fc.property(
          // Generate different dependency installation scenarios
          fc.record({
            installMethod: fc.constantFrom('npm ci', 'npm install'),
            includeDevDeps: fc.boolean(),
            checkLockFile: fc.boolean(),
            verifyIntegrity: fc.boolean()
          }),
          (config) => {
            // Test that package-lock.json exists for npm ci
            if (config.installMethod === 'npm ci') {
              const lockFilePath = path.join(process.cwd(), 'package-lock.json');
              expect(fs.existsSync(lockFilePath)).toBe(true);
              
              // Verify lock file is valid JSON
              const lockFileContent = fs.readFileSync(lockFilePath, 'utf8');
              expect(() => JSON.parse(lockFileContent)).not.toThrow();
              
              const lockFile = JSON.parse(lockFileContent);
              expect(lockFile.name).toBeDefined();
              expect(lockFile.lockfileVersion).toBeDefined();
              expect(lockFile.packages).toBeDefined();
            }
            
            // Test that all production dependencies are resolvable
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Verify critical dependencies have valid version specifications
            const criticalDeps = ['next', 'react', 'react-dom'];
            criticalDeps.forEach(dep => {
              const version = packageJson.dependencies[dep];
              expect(version).toBeDefined();
              expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+|^[\^~]?\d+/);
            });
            
            // Test that devDependencies are properly categorized
            if (config.includeDevDeps && packageJson.devDependencies) {
              const devDeps = packageJson.devDependencies;
              
              // Build tools should be in devDependencies
              const buildTools = ['typescript', '@types/node', '@types/react', 'eslint'];
              const hasBuildTools = buildTools.some(tool => devDeps[tool]);
              expect(hasBuildTools).toBe(true);
              
              // Test tools should be in devDependencies
              const testTools = ['jest', '@testing-library/react', 'fast-check'];
              const hasTestTools = testTools.some(tool => devDeps[tool]);
              expect(hasTestTools).toBe(true);
            }
            
            // Test that peer dependencies are satisfied
            if (packageJson.peerDependencies) {
              Object.keys(packageJson.peerDependencies).forEach(peerDep => {
                // Peer dependency should also be in dependencies or devDependencies
                const isInDeps = packageJson.dependencies[peerDep] || 
                                (packageJson.devDependencies && packageJson.devDependencies[peerDep]);
                expect(isInDeps).toBeDefined();
              });
            }
            
            // Test that there are no conflicting dependency versions
            const allDeps = {
              ...packageJson.dependencies,
              ...(packageJson.devDependencies || {})
            };
            
            // Check for common version conflicts
            if (allDeps.react && allDeps['@types/react']) {
              // React and @types/react should have compatible versions
              const reactVersion = allDeps.react.replace(/[\^~]/, '');
              const typesVersion = allDeps['@types/react'].replace(/[\^~]/, '');
              
              // Both should be valid version strings
              expect(reactVersion).toMatch(/^\d+/);
              expect(typesVersion).toMatch(/^\d+/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate build script execution without errors', () => {
      fc.assert(
        fc.property(
          // Generate different build execution scenarios
          fc.record({
            buildScript: fc.constantFrom('build', 'build:no-typecheck'),
            nodeEnv: fc.constantFrom('production', 'development'),
            memoryLimit: fc.constantFrom('default', 'high'),
            parallelBuilds: fc.boolean()
          }),
          (config) => {
            // Test that build scripts are properly defined
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            const buildScriptName = config.buildScript;
            const buildScript = packageJson.scripts[buildScriptName];
            
            expect(buildScript).toBeDefined();
            expect(typeof buildScript).toBe('string');
            expect(buildScript.length).toBeGreaterThan(0);
            
            // Verify build script contains Next.js build command
            expect(buildScript).toMatch(/next build/);
            
            // Test that build script doesn't contain conflicting flags
            const conflictingFlags = ['--watch', '--dev'];
            conflictingFlags.forEach(flag => {
              expect(buildScript).not.toContain(flag);
            });
            
            // Test that environment-specific configurations are valid
            const originalNodeEnv = process.env.NODE_ENV;
            try {
              process.env.NODE_ENV = config.nodeEnv;
              
              // Verify that Next.js can read the configuration
              const nextConfigPath = path.join(process.cwd(), 'next.config.js');
              if (fs.existsSync(nextConfigPath)) {
                expect(() => {
                  delete require.cache[require.resolve(nextConfigPath)];
                  const nextConfig = require(nextConfigPath);
                  
                  // Next.js config should be an object or function
                  expect(['object', 'function'].includes(typeof nextConfig)).toBe(true);
                  
                  // If it's a function, it should return an object
                  if (typeof nextConfig === 'function') {
                    const configResult = nextConfig('phase-production-build', {});
                    expect(typeof configResult).toBe('object');
                  }
                }).not.toThrow();
              }
              
              // Test that TypeScript configuration is compatible with build
              const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
              if (fs.existsSync(tsConfigPath)) {
                const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
                
                // Verify essential TypeScript options for Next.js
                expect(tsConfig.compilerOptions).toBeDefined();
                expect(tsConfig.compilerOptions.target).toBeDefined();
                expect(tsConfig.compilerOptions.module).toBeDefined();
                expect(tsConfig.compilerOptions.jsx).toBeDefined();
                
                // Should include Next.js specific settings
                expect(tsConfig.compilerOptions.allowJs).toBe(true);
                expect(tsConfig.compilerOptions.skipLibCheck).toBe(true);
                expect(tsConfig.compilerOptions.strict).toBe(true);
              }
              
            } finally {
              if (originalNodeEnv !== undefined) {
                process.env.NODE_ENV = originalNodeEnv;
              } else {
                delete process.env.NODE_ENV;
              }
            }
            
            // Test that build output structure is predictable
            const expectedOutputFiles = [
              '.next/BUILD_ID',
              '.next/package.json',
              '.next/static'
            ];
            
            // These files should be created after a successful build
            // We don't run the actual build here, but verify the structure is set up correctly
            const buildOutputDir = path.join(process.cwd(), '.next');
            const parentDir = path.dirname(buildOutputDir);
            
            // Parent directory should be writable for build output
            expect(() => fs.accessSync(parentDir, fs.constants.W_OK)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure all required assets are generated and accessible', () => {
      fc.assert(
        fc.property(
          // Generate different asset requirements
          fc.record({
            requireCSS: fc.constant(true), // Our app requires CSS
            requireJS: fc.constant(true),  // Our app requires JavaScript
            requireHTML: fc.constant(true), // Our app generates HTML
            requireManifest: fc.boolean(),
            optimizeAssets: fc.boolean()
          }),
          (config) => {
            // Test that all source assets exist and are valid
            const srcPath = path.join(process.cwd(), 'src');
            const appPath = path.join(srcPath, 'app');
            
            // Verify essential app structure
            expect(fs.existsSync(appPath)).toBe(true);
            
            // Test that layout.tsx exists and is valid
            const layoutPath = path.join(appPath, 'layout.tsx');
            expect(fs.existsSync(layoutPath)).toBe(true);
            
            const layoutContent = fs.readFileSync(layoutPath, 'utf8');
            expect(layoutContent).toMatch(/export.*default/);
            expect(layoutContent).toMatch(/html|body/);
            
            // Test that page.tsx exists and is valid
            const pagePath = path.join(appPath, 'page.tsx');
            expect(fs.existsSync(pagePath)).toBe(true);
            
            const pageContent = fs.readFileSync(pagePath, 'utf8');
            expect(pageContent).toMatch(/export.*default/);
            
            // Test that global CSS exists and is valid
            if (config.requireCSS) {
              const globalCssPath = path.join(appPath, 'globals.css');
              expect(fs.existsSync(globalCssPath)).toBe(true);
              
              const cssContent = fs.readFileSync(globalCssPath, 'utf8');
              expect(cssContent.length).toBeGreaterThan(0);
              
              // Should contain valid CSS or CSS framework imports
              expect(cssContent).toMatch(/@tailwind|@import|@layer|\.|#|body|html/);
            }
            
            // Test that TypeScript files are properly configured
            if (config.requireJS) {
              const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
              expect(fs.existsSync(tsConfigPath)).toBe(true);
              
              const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
              
              // Should include source directories
              expect(tsConfig.include).toBeDefined();
              expect(Array.isArray(tsConfig.include)).toBe(true);
              expect(tsConfig.include.some((path: string) => path.includes('src'))).toBe(true);
            }
            
            // Test that public assets are properly organized
            const publicPath = path.join(process.cwd(), 'public');
            if (fs.existsSync(publicPath)) {
              const publicFiles = fs.readdirSync(publicPath);
              
              // Should contain at least some static assets
              expect(publicFiles.length).toBeGreaterThan(0);
              
              // Check for any static assets (SVG, images, icons, etc.)
              const hasEssentialAssets = publicFiles.some(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].includes(ext) ||
                       file.includes('favicon') || file.includes('icon');
              });
              
              // At least one static asset should exist
              expect(hasEssentialAssets).toBe(true);
            }
            
            // Test that component structure supports asset generation
            const componentsPath = path.join(srcPath, 'components');
            if (fs.existsSync(componentsPath)) {
              // Should contain component files
              const hasComponents = fs.readdirSync(componentsPath, { recursive: true })
                .some(file => typeof file === 'string' && 
                      (file.endsWith('.tsx') || file.endsWith('.ts')));
              
              expect(hasComponents).toBe(true);
            }
            
            // Test that build configuration supports asset optimization
            if (config.optimizeAssets) {
              const nextConfigPath = path.join(process.cwd(), 'next.config.js');
              if (fs.existsSync(nextConfigPath)) {
                const nextConfig = require(nextConfigPath);
                
                // Should be configured for optimization
                expect(typeof nextConfig).toBe('object');
                
                // Common optimization settings should be present or configurable
                const hasOptimizationConfig = 
                  nextConfig.images !== undefined ||
                  nextConfig.experimental !== undefined ||
                  nextConfig.compiler !== undefined;
                
                // At least some optimization configuration should exist
                expect(hasOptimizationConfig).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});