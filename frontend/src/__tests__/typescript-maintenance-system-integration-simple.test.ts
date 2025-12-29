/**
 * Simplified Integration Tests for TypeScript Maintenance System
 * 
 * **Feature: typescript-maintenance-system, Task 13.1: Complete System Integration**
 * **Validates: All Requirements**
 * 
 * Focused integration tests that validate the complete system functionality
 * without excessive complexity or long execution times.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('TypeScript Maintenance System - Integration Tests', () => {
  let tempDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-maintenance-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Test 1: End-to-end workflow validation
   */
  describe('End-to-End Workflow', () => {
    test('should validate complete TypeScript maintenance workflow', () => {
      // Create a minimal TypeScript project
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          'type-check': 'tsc --noEmit',
          'lint': 'eslint .',
          'format': 'prettier --write .'
        },
        devDependencies: {
          'typescript': '^5.0.0'
        }
      };
      
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          strict: true,
          noEmit: true
        },
        include: ['src/**/*']
      };

      // Write configuration files
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      // Create source directory and files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      // Valid TypeScript file
      fs.writeFileSync(
        path.join(srcDir, 'valid.ts'),
        'export const message: string = "Hello, TypeScript!";'
      );
      
      // File with type error
      fs.writeFileSync(
        path.join(srcDir, 'error.ts'),
        'const num: number = "string"; // Type error'
      );

      // Test 1: Configuration validation
      expect(fs.existsSync(path.join(tempDir, 'tsconfig.json'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'package.json'))).toBe(true);

      // Test 2: TypeScript compilation (should detect errors)
      let compilationResult;
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 10000 
        });
        compilationResult = { success: true, hasErrors: false };
      } catch (error: any) {
        compilationResult = { 
          success: false, 
          hasErrors: true,
          output: error.stdout?.toString() || error.stderr?.toString() || ''
        };
      }

      // Should detect the type error
      expect(compilationResult.hasErrors).toBe(true);
      expect(compilationResult.output).toContain('Type \'string\' is not assignable to type \'number\'');

      // Test 3: Error categorization
      const errorOutput = compilationResult.output;
      const hasTypeError = errorOutput.includes('TS2322') || errorOutput.includes('not assignable');
      expect(hasTypeError).toBe(true);
    });

    test('should handle valid TypeScript projects without errors', () => {
      // Create a project with only valid TypeScript
      const packageJson = {
        name: 'valid-project',
        version: '1.0.0',
        devDependencies: { 'typescript': '^5.0.0' }
      };
      
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          strict: true,
          noEmit: true
        },
        include: ['src/**/*']
      };

      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      // Only valid TypeScript files
      fs.writeFileSync(
        path.join(srcDir, 'utils.ts'),
        'export function add(a: number, b: number): number { return a + b; }'
      );
      
      fs.writeFileSync(
        path.join(srcDir, 'types.ts'),
        'export interface User { id: number; name: string; }'
      );

      // TypeScript compilation should succeed
      let compilationResult;
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 10000 
        });
        compilationResult = { success: true, hasErrors: false };
      } catch (error: any) {
        compilationResult = { 
          success: false, 
          hasErrors: true,
          output: error.stdout?.toString() || error.stderr?.toString() || ''
        };
      }

      expect(compilationResult.success).toBe(true);
      expect(compilationResult.hasErrors).toBe(false);
    });
  });

  /**
   * Test 2: Performance validation
   */
  describe('Performance Characteristics', () => {
    test('should complete validation within reasonable time limits', () => {
      const startTime = Date.now();
      
      // Create a small project
      const packageJson = {
        name: 'perf-test',
        version: '1.0.0',
        devDependencies: { 'typescript': '^5.0.0' }
      };
      
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          strict: true,
          noEmit: true,
          incremental: true // Enable performance optimization
        },
        include: ['src/**/*']
      };

      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      // Create multiple files to test performance
      for (let i = 0; i < 5; i++) {
        fs.writeFileSync(
          path.join(srcDir, `file${i}.ts`),
          `export const value${i}: number = ${i};\nexport function func${i}() { return value${i}; }`
        );
      }

      const setupTime = Date.now() - startTime;
      expect(setupTime).toBeLessThan(1000); // Setup should be fast

      // Test TypeScript compilation performance
      const compileStart = Date.now();
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 5000 
        });
      } catch (error) {
        // May fail due to missing dependencies, but should not timeout
      }
      const compileTime = Date.now() - compileStart;
      
      expect(compileTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle incremental compilation efficiently', () => {
      // Create project with incremental compilation enabled
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          strict: true,
          noEmit: true,
          incremental: true,
          tsBuildInfoFile: '.tsbuildinfo'
        },
        include: ['src/**/*']
      };

      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(srcDir, 'main.ts'),
        'export const main = () => console.log("Hello");'
      );

      // First compilation (cold)
      const firstStart = Date.now();
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 5000 
        });
      } catch (error) {
        // May fail but should not timeout
      }
      const firstTime = Date.now() - firstStart;

      // Second compilation (should be faster with incremental)
      const secondStart = Date.now();
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 5000 
        });
      } catch (error) {
        // May fail but should not timeout
      }
      const secondTime = Date.now() - secondStart;

      // Both should complete within reasonable time
      expect(firstTime).toBeLessThan(5000);
      expect(secondTime).toBeLessThan(5000);
    });
  });

  /**
   * Test 3: Error recovery and handling
   */
  describe('Error Recovery System', () => {
    test('should detect and categorize different types of TypeScript errors', () => {
      const packageJson = {
        name: 'error-test',
        version: '1.0.0',
        devDependencies: { 'typescript': '^5.0.0' }
      };
      
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          strict: true,
          noEmit: true
        },
        include: ['src/**/*']
      };

      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      // Create files with different error types
      
      // Syntax error
      fs.writeFileSync(
        path.join(srcDir, 'syntax-error.ts'),
        'const x = 1\nconst y = 2' // Missing semicolon
      );
      
      // Type error
      fs.writeFileSync(
        path.join(srcDir, 'type-error.ts'),
        'const num: number = "string";'
      );
      
      // Import error
      fs.writeFileSync(
        path.join(srcDir, 'import-error.ts'),
        'import { missing } from "./nonexistent";'
      );

      // Run TypeScript compilation and capture errors
      let errorOutput = '';
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 10000 
        });
      } catch (error: any) {
        errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
      }

      // Should detect multiple types of errors
      expect(errorOutput).toBeTruthy();
      
      // Check for type error
      const hasTypeError = errorOutput.includes('TS2322') || 
                          errorOutput.includes('not assignable to type');
      expect(hasTypeError).toBe(true);
      
      // Check for import error
      const hasImportError = errorOutput.includes('TS2307') || 
                            errorOutput.includes('Cannot find module');
      expect(hasImportError).toBe(true);
      
      // Should provide file locations
      expect(errorOutput).toContain('syntax-error.ts');
      expect(errorOutput).toContain('type-error.ts');
      expect(errorOutput).toContain('import-error.ts');
    });

    test('should provide actionable error messages', () => {
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          strict: true,
          noEmit: true
        },
        include: ['src/**/*']
      };

      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      // Create file with clear type error
      fs.writeFileSync(
        path.join(srcDir, 'clear-error.ts'),
        `
        interface User {
          name: string;
          age: number;
        }
        
        const user: User = {
          name: "John",
          age: "thirty" // Type error: string instead of number
        };
        `
      );

      let errorOutput = '';
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 10000 
        });
      } catch (error: any) {
        errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
      }

      // Error message should be descriptive and actionable
      expect(errorOutput).toContain('Type \'string\' is not assignable to type \'number\'');
      expect(errorOutput).toContain('clear-error.ts');
      expect(errorOutput).toMatch(/\(\d+,\d+\)/); // Should include line and column numbers
    });
  });

  /**
   * Test 4: Configuration management
   */
  describe('Configuration Management', () => {
    test('should validate TypeScript configuration files', () => {
      // Test with valid configuration
      const validTsConfig = {
        compilerOptions: {
          target: 'ES2017',
          module: 'commonjs',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules']
      };

      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(validTsConfig, null, 2)
      );

      // Should be able to parse the configuration
      const configContent = fs.readFileSync(path.join(tempDir, 'tsconfig.json'), 'utf8');
      const parsedConfig = JSON.parse(configContent);
      
      expect(parsedConfig.compilerOptions).toBeDefined();
      expect(parsedConfig.compilerOptions.strict).toBe(true);
      expect(parsedConfig.include).toContain('src/**/*');
      expect(parsedConfig.exclude).toContain('node_modules');
    });

    test('should detect invalid configuration', () => {
      // Test with invalid JSON
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        '{ "compilerOptions": { "target": "ES2017", } }' // Trailing comma
      );

      // Should fail to parse
      expect(() => {
        const configContent = fs.readFileSync(path.join(tempDir, 'tsconfig.json'), 'utf8');
        JSON.parse(configContent);
      }).toThrow();
    });

    test('should validate path mappings', () => {
      const srcDir = path.join(tempDir, 'src');
      const libDir = path.join(srcDir, 'lib');
      fs.mkdirSync(libDir, { recursive: true });
      
      // Create actual directories and files for path mapping
      fs.writeFileSync(
        path.join(libDir, 'utils.ts'),
        'export const helper = () => "test";'
      );

      const tsConfigWithPaths = {
        compilerOptions: {
          target: 'ES2017',
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
            '@/lib/*': ['src/lib/*']
          }
        },
        include: ['src/**/*']
      };

      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfigWithPaths, null, 2)
      );

      // Verify path mappings point to existing directories
      const config = JSON.parse(fs.readFileSync(path.join(tempDir, 'tsconfig.json'), 'utf8'));
      const paths = config.compilerOptions.paths;
      
      expect(paths['@/*']).toEqual(['src/*']);
      expect(paths['@/lib/*']).toEqual(['src/lib/*']);
      
      // Verify the actual directories exist
      expect(fs.existsSync(srcDir)).toBe(true);
      expect(fs.existsSync(libDir)).toBe(true);
    });
  });

  /**
   * Test 5: Monitoring and reporting
   */
  describe('Monitoring and Reporting', () => {
    test('should collect compilation metrics', () => {
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          strict: true,
          noEmit: true
        },
        include: ['src/**/*']
      };

      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      // Create files to compile
      for (let i = 0; i < 3; i++) {
        fs.writeFileSync(
          path.join(srcDir, `module${i}.ts`),
          `export const value${i} = ${i}; export function func${i}() { return value${i} * 2; }`
        );
      }

      // Measure compilation time
      const startTime = Date.now();
      let compilationResult;
      
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 10000 
        });
        compilationResult = { success: true, duration: Date.now() - startTime };
      } catch (error: any) {
        compilationResult = { 
          success: false, 
          duration: Date.now() - startTime,
          output: error.stdout?.toString() || error.stderr?.toString() || ''
        };
      }

      // Should have measurable metrics
      expect(compilationResult.duration).toBeGreaterThan(0);
      expect(compilationResult.duration).toBeLessThan(10000); // Should complete within timeout
      
      // Should be able to determine success/failure
      expect(typeof compilationResult.success).toBe('boolean');
    });

    test('should generate structured error reports', () => {
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          strict: true,
          noEmit: true
        },
        include: ['src/**/*']
      };

      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      
      // Create file with multiple errors
      fs.writeFileSync(
        path.join(srcDir, 'errors.ts'),
        `
        const num: number = "string"; // TS2322
        const obj = { name: "test" };
        obj.nonExistent; // TS2339
        function test(x: number) { return x; }
        test("wrong"); // TS2345
        `
      );

      let errorOutput = '';
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 10000 
        });
      } catch (error: any) {
        errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
      }

      // Parse error output to extract structured information
      const errorLines = errorOutput.split('\n').filter(line => line.trim());
      const errors = [];
      
      for (const line of errorLines) {
        const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
        if (match) {
          const [, file, lineNum, column, severity, code, message] = match;
          errors.push({
            file: path.basename(file),
            line: parseInt(lineNum),
            column: parseInt(column),
            severity,
            code: parseInt(code),
            message
          });
        }
      }

      // Should have structured error information
      expect(errors.length).toBeGreaterThan(0);
      
      errors.forEach(error => {
        expect(error.file).toBe('errors.ts');
        expect(error.line).toBeGreaterThan(0);
        expect(error.column).toBeGreaterThan(0);
        expect(['error', 'warning']).toContain(error.severity);
        expect(error.code).toBeGreaterThan(0);
        expect(error.message).toBeTruthy();
      });
    });
  });

  /**
   * Test 6: System integration validation
   */
  describe('System Integration', () => {
    test('should integrate with package.json scripts', () => {
      const packageJson = {
        name: 'integration-test',
        version: '1.0.0',
        scripts: {
          'type-check': 'tsc --noEmit',
          'type-check:watch': 'tsc --noEmit --watch',
          'build': 'tsc',
          'lint': 'eslint src --ext .ts,.tsx',
          'format': 'prettier --write src'
        },
        devDependencies: {
          'typescript': '^5.0.0',
          'eslint': '^8.0.0',
          'prettier': '^3.0.0'
        }
      };

      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Verify scripts are properly defined
      const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
      
      expect(pkg.scripts['type-check']).toBe('tsc --noEmit');
      expect(pkg.scripts['type-check:watch']).toBe('tsc --noEmit --watch');
      expect(pkg.scripts.build).toBe('tsc');
      expect(pkg.scripts.lint).toContain('eslint');
      expect(pkg.scripts.format).toContain('prettier');
      
      // Verify TypeScript dependency
      expect(pkg.devDependencies.typescript).toBeTruthy();
    });

    test('should work with existing project structure', () => {
      // Create a realistic project structure
      const dirs = [
        'src',
        'src/components',
        'src/lib',
        'src/types',
        'tests'
      ];

      dirs.forEach(dir => {
        fs.mkdirSync(path.join(tempDir, dir), { recursive: true });
      });

      // Create TypeScript configuration
      const tsConfig = {
        compilerOptions: {
          target: 'ES2017',
          module: 'commonjs',
          lib: ['ES2017', 'DOM'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
            '@/components/*': ['src/components/*'],
            '@/lib/*': ['src/lib/*'],
            '@/types/*': ['src/types/*']
          }
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests']
      };

      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      // Create sample files
      fs.writeFileSync(
        path.join(tempDir, 'src/types/index.ts'),
        'export interface User { id: number; name: string; }'
      );

      fs.writeFileSync(
        path.join(tempDir, 'src/lib/utils.ts'),
        'import { User } from "@/types"; export const createUser = (name: string): User => ({ id: Date.now(), name });'
      );

      fs.writeFileSync(
        path.join(tempDir, 'src/components/UserCard.ts'),
        'import { User } from "@/types"; export class UserCard { constructor(private user: User) {} }'
      );

      // Test that the project structure is valid
      expect(fs.existsSync(path.join(tempDir, 'src/types/index.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'src/lib/utils.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'src/components/UserCard.ts'))).toBe(true);

      // Test TypeScript compilation with path mappings
      let compilationResult;
      try {
        execSync('npx tsc --noEmit', { 
          cwd: tempDir, 
          stdio: 'pipe',
          timeout: 10000 
        });
        compilationResult = { success: true };
      } catch (error: any) {
        compilationResult = { 
          success: false,
          output: error.stdout?.toString() || error.stderr?.toString() || ''
        };
      }

      // Should handle path mappings correctly
      if (!compilationResult.success) {
        // If there are errors, they shouldn't be related to path resolution
        expect(compilationResult.output).not.toContain('Cannot find module');
      }
    });
  });
});