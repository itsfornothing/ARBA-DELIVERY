/**
 * Property-Based Test for Error Message Clarity
 * Feature: frontend-deployment-fix, Property 5: Error Message Clarity
 * 
 * Validates: Requirements 3.4, 5.4
 * 
 * This test validates that for any build or configuration failure, the system 
 * provides clear, specific error messages that identify the exact cause and 
 * location of the problem.
 */

import * as fc from 'fast-check';
import { 
  BuildErrorDetector, 
  BuildErrorReporter, 
  BuildError,
  detectBuildError,
  validateBuildEnvironment 
} from '@/lib/buildErrorDetection';
import { 
  EnvironmentValidationError, 
  validateEnvironment, 
  getEnvironmentConfig 
} from '@/lib/envValidation';

describe('Error Message Clarity Properties', () => {
  describe('Property 5: Error Message Clarity', () => {
    /**
     * For any build or configuration failure, the system should provide clear, 
     * specific error messages that identify the exact cause and location of the problem
     * 
     * Validates: Requirements 3.4, 5.4
     */
    it('should provide clear and specific error messages for any build failure', () => {
      fc.assert(
        fc.property(
          // Generate different types of build errors
          fc.record({
            errorType: fc.constantFrom(
              'PATH_ERROR',
              'DEPENDENCY_ERROR', 
              'ENVIRONMENT_ERROR',
              'ASSET_ERROR',
              'UNKNOWN_ERROR'
            ),
            errorMessage: fc.oneof(
              // Path-related errors
              fc.constantFrom(
                'ENOENT: no such file or directory, open \'/opt/render/project/src/frontend/package.json\'',
                'npm error path /opt/render/project/src/frontend/package.json',
                'Cannot find module \'./src/frontend/package.json\'',
                'Error: Cannot resolve module src/frontend',
                'Module not found: Can\'t resolve \'frontend/src\''
              ),
              // Dependency errors
              fc.constantFrom(
                'npm ERR! peer dep missing: react@^18.0.0',
                'Module not found: Can\'t resolve \'next\'',
                'npm ERR! missing script: build',
                'npm ERR! code ELIFECYCLE',
                'Cannot resolve dependency \'@types/react\''
              ),
              // Environment errors
              fc.constantFrom(
                'Missing required environment variable: NEXT_PUBLIC_API_URL',
                'Environment variable NODE_ENV not defined',
                'Invalid environment configuration',
                'NEXT_PUBLIC_WS_URL is not a valid URL'
              ),
              // Generic errors
              fc.constantFrom(
                'Build failed with exit code 1',
                'Unexpected token in JSON',
                'Permission denied',
                'Out of memory'
              )
            ),
            includeStack: fc.boolean(),
            hasContext: fc.boolean()
          }),
          (config) => {
            // Create error based on configuration
            const error = new Error(config.errorMessage);
            if (config.includeStack) {
              error.stack = `Error: ${config.errorMessage}\n    at build (/app/build.js:123:45)`;
            }

            // Analyze the error
            const buildError = BuildErrorDetector.analyzeError(error);

            // Test that error message is clear and informative
            expect(buildError.message).toBeDefined();
            expect(buildError.message.length).toBeGreaterThan(10);
            expect(buildError.message).not.toBe(config.errorMessage); // Should be enhanced
            
            // Test that error type is correctly identified
            expect(buildError.type).toBeDefined();
            expect(['PATH_ERROR', 'DEPENDENCY_ERROR', 'ENVIRONMENT_ERROR', 'ASSET_ERROR', 'UNKNOWN_ERROR'])
              .toContain(buildError.type);

            // Test that details provide specific information
            expect(buildError.details).toBeDefined();
            expect(buildError.details.length).toBeGreaterThan(20);
            expect(buildError.details).toContain(config.errorMessage); // Should include original error

            // Test that suggestions are actionable and specific
            expect(buildError.suggestions).toBeDefined();
            expect(buildError.suggestions.length).toBeGreaterThan(0);
            
            buildError.suggestions.forEach(suggestion => {
              expect(suggestion).toBeDefined();
              expect(suggestion.length).toBeGreaterThan(10);
              expect(suggestion).toMatch(/^[A-Z]/); // Should start with capital letter
              expect(suggestion).not.toMatch(/TODO|FIXME|XXX/i); // Should not contain placeholders
            });

            // Test that error messages contain specific keywords based on type
            switch (buildError.type) {
              case 'PATH_ERROR':
                expect(buildError.message.toLowerCase()).toMatch(/path|directory|file/);
                expect(buildError.suggestions.some(s => 
                  s.toLowerCase().includes('directory') || 
                  s.toLowerCase().includes('path') ||
                  s.toLowerCase().includes('render.yaml')
                )).toBe(true);
                break;
                
              case 'DEPENDENCY_ERROR':
                expect(buildError.message.toLowerCase()).toMatch(/dependency|dependencies|npm|install/);
                expect(buildError.suggestions.some(s => 
                  s.toLowerCase().includes('npm') || 
                  s.toLowerCase().includes('install') ||
                  s.toLowerCase().includes('package')
                )).toBe(true);
                break;
                
              case 'ENVIRONMENT_ERROR':
                expect(buildError.message.toLowerCase()).toMatch(/environment|variable|config/);
                expect(buildError.suggestions.some(s => 
                  s.toLowerCase().includes('environment') || 
                  s.toLowerCase().includes('variable') ||
                  s.toLowerCase().includes('render.yaml')
                )).toBe(true);
                break;
            }

            // Test that context provides additional helpful information
            if (buildError.context) {
              expect(typeof buildError.context).toBe('object');
              expect(Object.keys(buildError.context).length).toBeGreaterThan(0);
            }

            // Test that detailed error message is well-formatted
            const detailedMessage = BuildErrorDetector.createDetailedErrorMessage(buildError);
            expect(detailedMessage).toBeDefined();
            expect(detailedMessage.length).toBeGreaterThan(50);
            expect(detailedMessage).toContain('🚨'); // Should have visual indicators
            expect(detailedMessage).toContain(buildError.message);
            expect(detailedMessage).toContain(buildError.details);
            
            // Test that suggestions are properly formatted in detailed message
            buildError.suggestions.forEach(suggestion => {
              expect(detailedMessage).toContain(suggestion);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide clear error messages for environment validation failures', () => {
      fc.assert(
        fc.property(
          // Generate different environment validation scenarios
          fc.record({
            missingVars: fc.array(
              fc.constantFrom(
                'NEXT_PUBLIC_API_URL',
                'NEXT_PUBLIC_WS_URL', 
                'NEXT_PUBLIC_MEDIA_URL'
              ),
              { minLength: 1, maxLength: 3 }
            ),
            invalidUrls: fc.boolean(),
            emptyValues: fc.boolean()
          }),
          (config) => {
            // Save original environment
            const originalEnv = { ...process.env };
            
            try {
              // Clear environment variables to simulate missing vars
              config.missingVars.forEach(varName => {
                delete process.env[varName];
              });

              // Set invalid URLs if specified
              if (config.invalidUrls) {
                process.env.NEXT_PUBLIC_API_URL = 'not-a-url';
                process.env.NEXT_PUBLIC_WS_URL = 'invalid://';
              }

              // Set empty values if specified
              if (config.emptyValues) {
                process.env.NEXT_PUBLIC_API_URL = '';
                process.env.NEXT_PUBLIC_WS_URL = '   ';
              }

              let caughtError: EnvironmentValidationError | null = null;
              
              try {
                validateEnvironment();
              } catch (error) {
                caughtError = error as EnvironmentValidationError;
              }

              // Test that error was caught for invalid configurations
              if (config.missingVars.length > 0 || config.invalidUrls || config.emptyValues) {
                expect(caughtError).toBeInstanceOf(EnvironmentValidationError);
                
                if (caughtError) {
                  // Test that error message is clear and specific
                  expect(caughtError.message).toBeDefined();
                  expect(caughtError.message.length).toBeGreaterThan(10);
                  
                  // Test that missing variables are specifically mentioned
                  if (config.missingVars.length > 0 && !config.invalidUrls) {
                    config.missingVars.forEach(varName => {
                      expect(caughtError!.message).toContain(varName);
                    });
                    expect(caughtError.missingVars).toEqual(expect.arrayContaining(config.missingVars));
                  }
                  
                  // Test that URL validation errors are clear
                  if (config.invalidUrls) {
                    expect(caughtError.message.toLowerCase()).toMatch(/url|format|invalid/);
                  }
                  
                  // Test that error name is descriptive
                  expect(caughtError.name).toBe('EnvironmentValidationError');
                }
              }

            } finally {
              // Restore original environment
              Object.keys(process.env).forEach(key => {
                if (key.startsWith('NEXT_PUBLIC_') || key === 'NODE_ENV') {
                  delete process.env[key];
                }
              });
              Object.assign(process.env, originalEnv);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide helpful error messages for build environment validation', () => {
      fc.assert(
        fc.property(
          // Generate different build environment scenarios
          fc.record({
            nodeVersion: fc.constantFrom('v16.14.0', 'v17.9.1', 'v18.17.0', 'v20.0.0'),
            missingNodeEnv: fc.boolean(),
            hasInvalidConfig: fc.boolean()
          }),
          (config) => {
            // Save original environment
            const originalNodeVersion = process.version;
            const originalNodeEnv = process.env.NODE_ENV;
            
            try {
              // Mock Node.js version
              Object.defineProperty(process, 'version', {
                value: config.nodeVersion,
                configurable: true
              });

              // Remove NODE_ENV if specified
              if (config.missingNodeEnv) {
                (process.env as any).NODE_ENV = undefined;
              }

              // Validate build environment
              const issues = BuildErrorReporter.validateBuildEnvironment();

              // Test that issues are properly identified and described
              expect(Array.isArray(issues)).toBe(true);

              issues.forEach(issue => {
                // Test that each issue has clear identification
                expect(issue.type).toBeDefined();
                expect(['PATH_ERROR', 'DEPENDENCY_ERROR', 'ENVIRONMENT_ERROR', 'ASSET_ERROR', 'UNKNOWN_ERROR'])
                  .toContain(issue.type);

                // Test that error message is descriptive
                expect(issue.message).toBeDefined();
                expect(issue.message.length).toBeGreaterThan(10);
                expect(issue.message).toMatch(/^[A-Z]/); // Should start with capital

                // Test that details provide context
                expect(issue.details).toBeDefined();
                expect(issue.details.length).toBeGreaterThan(15);

                // Test that suggestions are actionable
                expect(issue.suggestions).toBeDefined();
                expect(issue.suggestions.length).toBeGreaterThan(0);
                
                issue.suggestions.forEach(suggestion => {
                  expect(suggestion).toBeDefined();
                  expect(suggestion.length).toBeGreaterThan(5);
                  expect(suggestion).toMatch(/^[A-Z]/); // Should start with capital
                });

                // Test context provides additional information
                if (issue.context) {
                  expect(typeof issue.context).toBe('object');
                }
              });

              // Test Node.js version validation
              const majorVersion = parseInt(config.nodeVersion.replace('v', '').split('.')[0]);
              const hasVersionIssue = issues.some(issue => 
                issue.message.toLowerCase().includes('node') && 
                issue.message.toLowerCase().includes('version')
              );
              
              if (majorVersion < 18) {
                expect(hasVersionIssue).toBe(true);
                const versionIssue = issues.find(issue => 
                  issue.message.toLowerCase().includes('node') && 
                  issue.message.toLowerCase().includes('version')
                );
                if (versionIssue) {
                  expect(versionIssue.message).toContain(config.nodeVersion);
                  expect(versionIssue.context?.currentVersion).toBe(config.nodeVersion);
                  expect(versionIssue.context?.recommendedVersion).toBeDefined();
                }
              }

              // Test missing environment variable detection
              const requiredVars = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_WS_URL', 'NEXT_PUBLIC_MEDIA_URL'];
              if (config.missingNodeEnv) {
                const envIssue = issues.find(issue => 
                  issue.message.toLowerCase().includes('environment') &&
                  issue.message.toLowerCase().includes('variable') &&
                  issue.message.includes('NODE_ENV')
                );
                if (envIssue) {
                  expect(envIssue.message).toContain('NODE_ENV');
                  expect(envIssue.context?.missingVariables).toContain('NODE_ENV');
                }
              }

            } finally {
              // Restore original environment
              Object.defineProperty(process, 'version', {
                value: originalNodeVersion,
                configurable: true
              });
              
              if (originalNodeEnv !== undefined) {
                (process.env as any).NODE_ENV = originalNodeEnv;
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure error messages are consistently formatted and readable', () => {
      fc.assert(
        fc.property(
          // Generate various error scenarios
          fc.array(
            fc.record({
              errorMessage: fc.string({ minLength: 20, maxLength: 150 }).filter(s => {
                const trimmed = s.trim();
                return trimmed.length > 15 && /[a-zA-Z]/.test(trimmed);
              }),
              errorType: fc.constantFrom('Error', 'TypeError', 'ReferenceError', 'SyntaxError'),
              hasStack: fc.boolean()
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (errorConfigs) => {
            errorConfigs.forEach(config => {
              // Create error
              const error = new (global as any)[config.errorType](config.errorMessage);
              if (config.hasStack) {
                error.stack = `${config.errorType}: ${config.errorMessage}\n    at test:1:1`;
              }

              // Analyze error
              const buildError = BuildErrorDetector.analyzeError(error);
              const detailedMessage = BuildErrorDetector.createDetailedErrorMessage(buildError);

              // Test message formatting consistency
              expect(detailedMessage).toMatch(/^🚨 Build Error Detected:/); // Consistent header
              expect(detailedMessage).toContain('📋 Error:'); // Consistent sections
              expect(detailedMessage).toContain('🔍 Details:');
              expect(detailedMessage).toContain('💡 Suggested Solutions:');

              // Test that suggestions are numbered
              const suggestionLines = detailedMessage.split('\n').filter(line => 
                line.trim().match(/^\d+\./)
              );
              expect(suggestionLines.length).toBe(buildError.suggestions.length);

              // Test that each suggestion is properly formatted
              suggestionLines.forEach((line, index) => {
                expect(line.trim()).toMatch(new RegExp(`^${index + 1}\\.`));
                expect(line.trim().length).toBeGreaterThan(5);
              });

              // Test readability metrics
              const words = detailedMessage.split(/\s+/).filter(word => word.length > 0).length;
              const sentences = detailedMessage.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
              const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
              
              // Error messages should be concise but informative
              expect(avgWordsPerSentence).toBeLessThan(30); // Not too verbose
              expect(avgWordsPerSentence).toBeGreaterThan(2); // Not too terse

              // Test that technical jargon is explained or avoided
              const technicalTerms = ['ENOENT', 'ELIFECYCLE', 'npm ERR!'];
              technicalTerms.forEach(term => {
                if (detailedMessage.includes(term)) {
                  // If technical term is present, there should be explanation
                  expect(detailedMessage.toLowerCase()).toMatch(
                    /error|issue|problem|fail|cannot|unable/
                  );
                }
              });

              // Test that error message provides actionable next steps
              const actionWords = ['verify', 'check', 'ensure', 'update', 'install', 'run', 'set'];
              const hasActionableContent = actionWords.some(word => 
                detailedMessage.toLowerCase().includes(word)
              );
              expect(hasActionableContent).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});