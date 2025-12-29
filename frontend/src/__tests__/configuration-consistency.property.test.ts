/**
 * Property-Based Tests for TypeScript Configuration Consistency
 * 
 * Feature: typescript-maintenance-system, Property 6: Configuration Consistency
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 * 
 * These tests verify that TypeScript configuration changes maintain consistency
 * and compatibility across all environments and scenarios.
 */

import * as fc from 'fast-check';
import * as path from 'path';

// Mock modules before importing
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Import after mocking
import * as fs from 'fs';
import { execSync } from 'child_process';
import { TypeScriptConfigManager } from '../lib/typescriptConfigManager';

// Get mocked functions
const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('Property 6: Configuration Consistency', () => {
  let configManager: TypeScriptConfigManager;
  const testProjectRoot = '/test/project';
  const testConfigPath = path.join(testProjectRoot, 'tsconfig.json');

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new TypeScriptConfigManager(testProjectRoot);
  });

  /**
   * Property: For any valid TypeScript configuration change, the system should
   * validate compatibility and maintain consistent behavior across all environments
   */
  describe('Configuration Change Validation', () => {
    it('should validate any configuration change maintains compatibility', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various TypeScript configuration objects
          fc.record({
            compilerOptions: fc.record({
              target: fc.oneof(
                fc.constant('ES5'),
                fc.constant('ES2015'),
                fc.constant('ES2017'),
                fc.constant('ES2020'),
                fc.constant('ESNext')
              ),
              module: fc.oneof(
                fc.constant('commonjs'),
                fc.constant('esnext'),
                fc.constant('es2015'),
                fc.constant('es2020')
              ),
              moduleResolution: fc.oneof(
                fc.constant('node'),
                fc.constant('bundler')
              ),
              strict: fc.boolean(),
              incremental: fc.boolean(),
              skipLibCheck: fc.boolean(),
              noEmit: fc.boolean(),
              esModuleInterop: fc.boolean(),
              allowSyntheticDefaultImports: fc.boolean(),
              forceConsistentCasingInFileNames: fc.boolean(),
              noUnusedLocals: fc.boolean(),
              noUnusedParameters: fc.boolean(),
              exactOptionalPropertyTypes: fc.boolean()
            }, { requiredKeys: ['target', 'module'] }),
            include: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
            exclude: fc.array(fc.string(), { minLength: 0, maxLength: 3 })
          }),
          async (config) => {
            // Setup mocks for valid configuration
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(config));
            mockExecSync.mockReturnValue(''); // Successful compilation

            // Test configuration validation
            const result = await configManager.validateTSConfig();

            // Property: Configuration validation should always return a result
            expect(result).toBeDefined();
            expect(result.configPath).toBe(testConfigPath);
            expect(typeof result.isValid).toBe('boolean');
            expect(Array.isArray(result.errors)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
            expect(Array.isArray(result.suggestions)).toBe(true);

            // Property: Valid JSON configurations should not produce JSON parse errors
            const hasJsonError = result.errors.some(error => 
              error.includes('Invalid JSON')
            );
            expect(hasJsonError).toBe(false);

            // Property: If strict mode is enabled, no warnings about strict mode should appear
            if (config.compilerOptions.strict) {
              const hasStrictWarning = result.warnings.some(warning =>
                warning.includes('Strict mode is disabled')
              );
              expect(hasStrictWarning).toBe(false);
            }

            // Property: If incremental is enabled, no suggestions about incremental should appear
            if (config.compilerOptions.incremental) {
              const hasIncrementalSuggestion = result.suggestions.some(suggestion =>
                suggestion.includes('incremental')
              );
              expect(hasIncrementalSuggestion).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain path mapping consistency for any valid path configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate path mapping configurations
          fc.record({
            compilerOptions: fc.record({
              baseUrl: fc.oneof(fc.constant('.'), fc.constant('./src'), fc.constant('./')),
              paths: fc.dictionary(
                // Path aliases (keys)
                fc.oneof(
                  fc.constant('@/*'),
                  fc.constant('@/components/*'),
                  fc.constant('@/lib/*'),
                  fc.constant('@/types/*'),
                  fc.constant('~/*')
                ),
                // Path mappings (values)
                fc.array(
                  fc.oneof(
                    fc.constant('./src/*'),
                    fc.constant('./src/components/*'),
                    fc.constant('./src/lib/*'),
                    fc.constant('./src/types/*'),
                    fc.constant('./*')
                  ),
                  { minLength: 1, maxLength: 2 }
                )
              )
            })
          }),
          async (config) => {
            // Setup mocks
            mockFs.existsSync.mockImplementation((filePath: string) => {
              // Mock that common directories exist
              return filePath.includes('/src') || 
                     filePath.includes('/components') || 
                     filePath.includes('/lib') ||
                     filePath.includes('/types') ||
                     filePath === testConfigPath;
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

            // Test path mapping validation
            const result = await configManager.validatePathMappings();

            // Property: Path mapping validation should always return a result
            expect(result).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');
            expect(Array.isArray(result.invalidMappings)).toBe(true);
            expect(Array.isArray(result.unresolvedPaths)).toBe(true);
            expect(Array.isArray(result.suggestions)).toBe(true);

            // Property: Valid path arrays should not produce invalid mapping errors
            const paths = config.compilerOptions.paths || {};
            for (const [alias, mappings] of Object.entries(paths)) {
              if (Array.isArray(mappings)) {
                const hasInvalidMappingError = result.invalidMappings.some(error =>
                  error.includes(alias) && error.includes('must be an array')
                );
                expect(hasInvalidMappingError).toBe(false);
              }
            }

            // Property: If all paths exist (mocked), there should be no unresolved paths
            // (This tests the consistency of our path resolution logic)
            if (result.isValid) {
              expect(result.unresolvedPaths.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide consistent dependency compatibility results', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate package.json-like dependency configurations
          fc.record({
            dependencies: fc.dictionary(
              fc.oneof(
                fc.constant('react'),
                fc.constant('react-dom'),
                fc.constant('next'),
                fc.constant('typescript')
              ),
              fc.oneof(
                fc.constant('^18.0.0'),
                fc.constant('^19.0.0'),
                fc.constant('^5.0.0'),
                fc.constant('^4.9.0')
              )
            ),
            devDependencies: fc.dictionary(
              fc.oneof(
                fc.constant('@types/react'),
                fc.constant('@types/react-dom'),
                fc.constant('@types/node'),
                fc.constant('@types/jest'),
                fc.constant('@typescript-eslint/parser'),
                fc.constant('eslint')
              ),
              fc.oneof(
                fc.constant('^18.0.0'),
                fc.constant('^20.0.0'),
                fc.constant('^29.0.0'),
                fc.constant('^8.0.0')
              )
            )
          }),
          async (packageJson) => {
            // Setup mocks
            mockFs.existsSync.mockImplementation((filePath: string) => {
              return filePath.includes('package.json');
            });
            mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

            // Test dependency compatibility
            const result = await configManager.checkDependencyCompatibility();

            // Property: Dependency check should always return a result
            expect(result).toBeDefined();
            expect(typeof result.isCompatible).toBe('boolean');
            expect(Array.isArray(result.incompatibleDependencies)).toBe(true);
            expect(Array.isArray(result.recommendations)).toBe(true);

            // Property: If TypeScript is present with version 5+, it should be compatible
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            const tsVersion = allDeps.typescript;
            if (tsVersion && tsVersion.includes('5.')) {
              const hasTsIncompatibility = result.incompatibleDependencies.some(dep =>
                dep.name === 'typescript' && dep.issue.includes('outdated')
              );
              expect(hasTsIncompatibility).toBe(false);
            }

            // Property: Each incompatible dependency should have required fields
            result.incompatibleDependencies.forEach(dep => {
              expect(dep.name).toBeDefined();
              expect(dep.currentVersion).toBeDefined();
              expect(dep.requiredVersion).toBeDefined();
              expect(dep.issue).toBeDefined();
            });

            // Property: Recommendations should be strings
            result.recommendations.forEach(rec => {
              expect(typeof rec).toBe('string');
              expect(rec.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide consistent optimization recommendations', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate compiler options for optimization analysis
          fc.record({
            compilerOptions: fc.record({
              strict: fc.boolean(),
              incremental: fc.boolean(),
              skipLibCheck: fc.boolean(),
              noUnusedLocals: fc.boolean(),
              noUnusedParameters: fc.boolean(),
              exactOptionalPropertyTypes: fc.boolean(),
              moduleResolution: fc.oneof(
                fc.constant('node'),
                fc.constant('bundler'),
                fc.constant(undefined)
              )
            })
          }),
          async (config) => {
            // Setup mocks
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

            // Test optimization recommendations
            const result = await configManager.getOptimizationRecommendations();

            // Property: Optimization analysis should always return a result
            expect(result).toBeDefined();
            expect(Array.isArray(result.optimizations)).toBe(true);
            expect(Array.isArray(result.performanceImprovements)).toBe(true);
            expect(Array.isArray(result.strictnessImprovements)).toBe(true);

            // Property: If a setting is already at recommended value, 
            // it should not appear in optimizations
            const compilerOptions = config.compilerOptions;
            
            if (compilerOptions.strict === true) {
              const hasStrictOptimization = result.optimizations.some(opt =>
                opt.setting === 'strict'
              );
              expect(hasStrictOptimization).toBe(false);
            }

            if (compilerOptions.incremental === true) {
              const hasIncrementalOptimization = result.optimizations.some(opt =>
                opt.setting === 'incremental'
              );
              expect(hasIncrementalOptimization).toBe(false);
            }

            if (compilerOptions.moduleResolution === 'bundler') {
              const hasModuleResolutionOptimization = result.optimizations.some(opt =>
                opt.setting === 'moduleResolution'
              );
              expect(hasModuleResolutionOptimization).toBe(false);
            }

            // Property: Each optimization should have required fields
            result.optimizations.forEach(optimization => {
              expect(optimization.setting).toBeDefined();
              expect(optimization.currentValue).toBeDefined();
              expect(optimization.recommendedValue).toBeDefined();
              expect(optimization.reason).toBeDefined();
              expect(['low', 'medium', 'high']).toContain(optimization.impact);
            });

            // Property: All improvement arrays should contain strings
            result.performanceImprovements.forEach(improvement => {
              expect(typeof improvement).toBe('string');
              expect(improvement.length).toBeGreaterThan(0);
            });

            result.strictnessImprovements.forEach(improvement => {
              expect(typeof improvement).toBe('string');
              expect(improvement.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Configuration changes should maintain environment consistency
   */
  describe('Environment Consistency', () => {
    it('should generate consistent reports across multiple runs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            compilerOptions: fc.record({
              strict: fc.boolean(),
              incremental: fc.boolean(),
              target: fc.constant('ES2017'),
              module: fc.constant('esnext')
            }),
            include: fc.array(fc.constant('**/*.ts'), { minLength: 1, maxLength: 1 }),
            exclude: fc.array(fc.constant('node_modules'), { minLength: 1, maxLength: 1 })
          }),
          async (config) => {
            // Setup consistent mocks
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(config));
            mockExecSync.mockReturnValue('');

            // Generate report multiple times
            const report1 = await configManager.generateConfigurationReport();
            const report2 = await configManager.generateConfigurationReport();

            // Property: Multiple runs with same input should produce consistent results
            expect(report1.validation.isValid).toBe(report2.validation.isValid);
            expect(report1.validation.errors.length).toBe(report2.validation.errors.length);
            expect(report1.validation.warnings.length).toBe(report2.validation.warnings.length);
            
            expect(report1.pathMappings.isValid).toBe(report2.pathMappings.isValid);
            expect(report1.dependencies.isCompatible).toBe(report2.dependencies.isCompatible);
            
            expect(report1.optimizations.optimizations.length).toBe(report2.optimizations.optimizations.length);

            // Property: Reports should have consistent structure
            expect(report1.timestamp).toBeDefined();
            expect(report2.timestamp).toBeDefined();
            expect(report1.validation).toBeDefined();
            expect(report1.pathMappings).toBeDefined();
            expect(report1.dependencies).toBeDefined();
            expect(report1.optimizations).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Error handling should be consistent and informative
   */
  describe('Error Handling Consistency', () => {
    it('should handle configuration errors consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('invalid-json'),
            fc.constant('missing-file'),
            fc.constant('permission-error')
          ),
          async (errorType) => {
            // Setup error conditions
            switch (errorType) {
              case 'invalid-json':
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readFileSync.mockReturnValue('{ invalid json }');
                break;
              case 'missing-file':
                mockFs.existsSync.mockReturnValue(false);
                break;
              case 'permission-error':
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readFileSync.mockImplementation(() => {
                  throw new Error('Permission denied');
                });
                break;
            }

            // Test error handling
            const result = await configManager.validateTSConfig();

            // Property: Error conditions should always produce a result
            expect(result).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');
            expect(Array.isArray(result.errors)).toBe(true);

            // Property: Error conditions should mark configuration as invalid
            expect(result.isValid).toBe(false);

            // Property: Error conditions should produce informative error messages
            expect(result.errors.length).toBeGreaterThan(0);
            
            switch (errorType) {
              case 'invalid-json':
                expect(result.errors.some(error => error.includes('Invalid JSON'))).toBe(true);
                break;
              case 'missing-file':
                expect(result.errors.some(error => error.includes('not found'))).toBe(true);
                break;
              case 'permission-error':
                expect(result.errors.some(error => error.includes('Permission denied'))).toBe(true);
                break;
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});