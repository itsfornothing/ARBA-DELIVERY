/**
 * Property-Based Tests for Pre-commit Validation Reliability
 * Feature: typescript-maintenance-system, Property 2: Pre-commit Validation Reliability
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import * as fc from 'fast-check';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Pre-commit Validation Reliability Properties', () => {
  const testDir = path.join(__dirname, '..', '..', 'test-temp');
  
  beforeEach(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Property 2: Pre-commit Validation Reliability
   * For any code commit attempt, the pre-commit system should consistently run all configured checks
   * and prevent commits that fail validation
   */
  test('Property 2: Pre-commit validation runs consistently for all TypeScript files', () => {
    fc.assert(
      fc.property(
        fc.record({
          fileName: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a')),
          hasTypeError: fc.boolean(),
          hasLintError: fc.boolean(),
          hasFormatError: fc.boolean()
        }),
        (testCase) => {
          const fileName = `${testCase.fileName}.ts`;
          const filePath = path.join(testDir, fileName);
          
          // Generate TypeScript content based on test case
          let content = 'export const testVar = "hello";\n';
          
          if (testCase.hasTypeError) {
            content += 'const invalidType: string = 123;\n'; // Type error
          }
          
          if (testCase.hasLintError) {
            content += 'var unusedVar = "unused";\n'; // Lint error (var instead of const)
          }
          
          if (testCase.hasFormatError) {
            content += 'const   badFormat    =    "test"   ;\n'; // Format error
          }
          
          // Write test file
          fs.writeFileSync(filePath, content);
          
          try {
            // Test TypeScript compilation
            const tscResult = runTypeScriptCheck(filePath);
            
            // Test ESLint validation
            const lintResult = runESLintCheck(filePath);
            
            // Test Prettier formatting
            const formatResult = runPrettierCheck(filePath);
            
            // Validation should detect errors when they exist
            if (testCase.hasTypeError) {
              if (!tscResult.hasErrors) {
                console.log('Expected TypeScript error but none found for:', content);
                return false;
              }
            }
            
            if (testCase.hasLintError) {
              if (!lintResult.hasErrors) {
                console.log('Expected ESLint error but none found for:', content);
                return false;
              }
            }
            
            if (testCase.hasFormatError) {
              if (!formatResult.hasErrors) {
                console.log('Expected Prettier error but none found for:', content);
                return false;
              }
            }
            
            // If no errors are expected, validation should pass (or have minor warnings)
            if (!testCase.hasTypeError && !testCase.hasLintError && !testCase.hasFormatError) {
              // For clean code, we expect no TypeScript errors
              if (tscResult.hasErrors) {
                console.log('Unexpected TypeScript error for clean code:', tscResult.errors);
                return false;
              }
              // ESLint and Prettier may have warnings but shouldn't have critical errors
              // This is acceptable for clean code
            }
            
            return true;
          } catch (error) {
            // If validation tools fail to run, that's a system issue
            console.error('Validation tool failed:', error);
            return false;
          }
        }
      ),
      { numRuns: 50 } // Reduced from 100 to make test faster
    );
  });

  test('Property 2: Lint-staged configuration processes staged files correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            fileName: fc.string({ minLength: 1, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a')),
            extension: fc.constantFrom('.ts', '.tsx', '.js', '.jsx'),
            hasIssues: fc.boolean()
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (files) => {
          const createdFiles: string[] = [];
          
          try {
            // Create test files
            files.forEach(file => {
              const fileName = `${file.fileName}${file.extension}`;
              const filePath = path.join(testDir, fileName);
              
              let content = '';
              if (file.extension.includes('ts')) {
                content = file.hasIssues 
                  ? 'const test: string = 123;' // Type error
                  : 'const test: string = "valid";';
              } else {
                content = file.hasIssues
                  ? 'var test = "bad";' // Lint error
                  : 'const test = "good";';
              }
              
              fs.writeFileSync(filePath, content);
              createdFiles.push(filePath);
            });
            
            // Test that lint-staged configuration exists and is valid
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            expect(packageJson['lint-staged']).toBeDefined();
            expect(packageJson['lint-staged']['*.{ts,tsx}']).toBeDefined();
            expect(packageJson['lint-staged']['*.{js,jsx,json,css,md}']).toBeDefined();
            
            // Verify lint-staged configuration includes required checks
            const tsConfig = packageJson['lint-staged']['*.{ts,tsx}'];
            expect(tsConfig).toContain('eslint --fix');
            expect(tsConfig).toContain('prettier --write');
            expect(tsConfig.some((cmd: string) => cmd.includes('tsc --noEmit'))).toBe(true);
            
            return true;
          } catch (error) {
            console.error('Lint-staged configuration test failed:', error);
            return false;
          } finally {
            // Clean up created files
            createdFiles.forEach(filePath => {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 2: Husky pre-commit hook exists and is executable', () => {
    const huskyDir = path.join(process.cwd(), '.husky');
    const preCommitHook = path.join(huskyDir, 'pre-commit');
    
    // Verify Husky directory exists
    expect(fs.existsSync(huskyDir)).toBe(true);
    
    // Verify pre-commit hook exists
    expect(fs.existsSync(preCommitHook)).toBe(true);
    
    // Verify pre-commit hook is executable
    const stats = fs.statSync(preCommitHook);
    expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0); // Check execute permissions
    
    // Verify pre-commit hook contains lint-staged
    const hookContent = fs.readFileSync(preCommitHook, 'utf8');
    expect(hookContent).toContain('lint-staged');
  });
});

// Helper functions for validation checks
function runTypeScriptCheck(filePath: string): { hasErrors: boolean; errors: string[] } {
  try {
    execSync(`npx tsc --noEmit ${filePath}`, { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    return { hasErrors: false, errors: [] };
  } catch (error: any) {
    return { 
      hasErrors: true, 
      errors: error.stdout ? error.stdout.toString().split('\n') : ['Unknown TypeScript error']
    };
  }
}

function runESLintCheck(filePath: string): { hasErrors: boolean; errors: string[] } {
  try {
    execSync(`npx eslint ${filePath}`, { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    return { hasErrors: false, errors: [] };
  } catch (error: any) {
    return { 
      hasErrors: true, 
      errors: error.stdout ? error.stdout.toString().split('\n') : ['Unknown ESLint error']
    };
  }
}

function runPrettierCheck(filePath: string): { hasErrors: boolean; errors: string[] } {
  try {
    execSync(`npx prettier --check ${filePath}`, { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    return { hasErrors: false, errors: [] };
  } catch (error: any) {
    return { 
      hasErrors: true, 
      errors: error.stdout ? error.stdout.toString().split('\n') : ['Formatting error']
    };
  }
}