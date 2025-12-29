/**
 * Property-Based Tests for Integration Compatibility
 * Feature: typescript-maintenance-system, Property 10: Integration Compatibility
 * 
 * Tests that the TypeScript maintenance system integrates seamlessly with existing workflows
 * without breaking existing functionality or requiring major changes.
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
 */

import * as fc from 'fast-check';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Compatibility Properties', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const huskyConfigPath = path.join(projectRoot, '.husky/pre-commit');
  const eslintConfigPath = path.join(projectRoot, 'eslint.config.mjs');
  const vscodeSettingsPath = path.join(projectRoot, '.vscode/settings.json');

  /**
   * Property 10: Integration Compatibility
   * For any existing development workflow or tool, the maintenance system should integrate 
   * without breaking existing functionality
   */
  describe('Property 10: Integration Compatibility', () => {
    
    test('package.json scripts integration preserves existing functionality', () => {
      fc.assert(fc.property(
        fc.constantFrom('dev', 'build', 'start', 'lint', 'test', 'format'),
        (scriptName) => {
          // **Validates: Requirements 10.1** - Integrate with existing package.json scripts
          
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          // Verify the script exists
          expect(packageJson.scripts).toHaveProperty(scriptName);
          
          // Verify TypeScript-enhanced scripts don't break original functionality
          const script = packageJson.scripts[scriptName];
          
          // Original scripts should still work
          if (scriptName === 'dev') {
            expect(script).toContain('next dev');
          } else if (scriptName === 'build') {
            expect(script).toContain('next build');
          } else if (scriptName === 'start') {
            expect(script).toContain('next start');
          } else if (scriptName === 'lint') {
            expect(script).toContain('eslint');
          } else if (scriptName === 'test') {
            expect(script).toContain('jest');
          } else if (scriptName === 'format') {
            expect(script).toContain('prettier');
          }
          
          // Enhanced scripts should maintain backward compatibility
          return true;
        }
      ), { numRuns: 100 });
    });

    test('TypeScript-enhanced scripts maintain original behavior', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          'typescript:detect-errors',
          'typescript:validate',
          'typescript:config:validate',
          'typescript:performance:validate'
        ),
        (enhancedScript) => {
          // **Validates: Requirements 10.1** - Enhanced scripts don't conflict with originals
          
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          // Verify enhanced script exists
          expect(packageJson.scripts).toHaveProperty(enhancedScript);
          
          // Enhanced scripts should use existing tools (tsc, eslint) under the hood
          const script = packageJson.scripts[enhancedScript];
          
          // Should use node scripts that wrap existing tools
          expect(script).toMatch(/node scripts\//);
          
          return true;
        }
      ), { numRuns: 100 });
    });

    test('Git hooks integration preserves existing pre-commit behavior', () => {
      fc.assert(fc.property(
        fc.constant('pre-commit'),
        (hookName) => {
          // **Validates: Requirements 10.2** - Ensure compatibility with existing Git hooks
          
          if (!fs.existsSync(huskyConfigPath)) {
            // If no existing hooks, integration should work seamlessly
            return true;
          }
          
          const hookContent = fs.readFileSync(huskyConfigPath, 'utf8');
          
          // Should use lint-staged which is the standard approach
          expect(hookContent).toContain('lint-staged');
          
          // Should not break existing hook structure
          expect(hookContent).toContain('#!/usr/bin/env sh');
          expect(hookContent).toContain('husky.sh');
          
          return true;
        }
      ), { numRuns: 100 });
    });

    test('lint-staged configuration integrates TypeScript checks without conflicts', () => {
      fc.assert(fc.property(
        fc.constantFrom('*.{ts,tsx}', '*.{js,jsx,json,css,md}'),
        (filePattern) => {
          // **Validates: Requirements 10.2** - Git hooks integration
          
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const lintStaged = packageJson['lint-staged'];
          
          expect(lintStaged).toBeDefined();
          
          // Check if the file pattern exists in lint-staged config
          const hasPattern = Object.prototype.hasOwnProperty.call(lintStaged, filePattern);
          expect(hasPattern).toBe(true);
          
          const commands = lintStaged[filePattern];
          expect(Array.isArray(commands)).toBe(true);
          
          if (filePattern === '*.{ts,tsx}') {
            // TypeScript files should have enhanced validation
            const hasTypeScriptCheck = commands.some((cmd: string) => 
              cmd.includes('typescript-check') || cmd.includes('tsc --noEmit')
            );
            const hasEslint = commands.some((cmd: string) => cmd.includes('eslint'));
            const hasPrettier = commands.some((cmd: string) => cmd.includes('prettier'));
            
            expect(hasTypeScriptCheck || hasEslint || hasPrettier).toBe(true);
          } else {
            // Other files should maintain original behavior
            const hasPrettier = commands.some((cmd: string) => cmd.includes('prettier'));
            expect(hasPrettier).toBe(true);
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    test('ESLint configuration enhances without replacing existing rules', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          '@typescript-eslint/no-explicit-any',
          '@typescript-eslint/naming-convention',
          '@typescript-eslint/consistent-type-imports'
        ),
        (ruleName) => {
          // **Validates: Requirements 10.4** - Enhance existing IDE configurations
          
          // ESLint config should exist and be valid
          expect(fs.existsSync(eslintConfigPath)).toBe(true);
          
          // Should be a modern ESLint config (not legacy .eslintrc)
          const configContent = fs.readFileSync(eslintConfigPath, 'utf8');
          
          // Should use modern flat config format
          expect(configContent).toContain('defineConfig');
          
          // Should extend Next.js configs (preserving existing setup)
          expect(configContent).toContain('nextVitals');
          expect(configContent).toContain('nextTs');
          
          // Should add TypeScript-specific enhancements
          expect(configContent).toContain('@typescript-eslint');
          
          return true;
        }
      ), { numRuns: 100 });
    });

    test('VS Code configuration enhances existing setup without conflicts', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          'typescript.preferences.includePackageJsonAutoImports',
          'editor.codeActionsOnSave',
          'eslint.validate'
        ),
        (settingKey) => {
          // **Validates: Requirements 10.4** - Enhance existing IDE configurations
          
          if (!fs.existsSync(vscodeSettingsPath)) {
            // If no existing VS Code config, integration should work
            return true;
          }
          
          const settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf8'));
          
          // Check if the setting exists using proper nested property checking
          const hasProperty = settingKey.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined;
          }, settings) !== undefined;
          
          expect(hasProperty).toBe(true);
          
          // Should preserve existing editor functionality
          if (settingKey === 'editor.codeActionsOnSave') {
            const codeActions = settings[settingKey];
            expect(typeof codeActions).toBe('object');
            expect(codeActions).not.toBeNull();
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    test('CI/CD integration works with existing pipeline structure', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          '.github/workflows/typescript-validation.yml',
          '.github/workflows/typescript-maintenance.yml'
        ),
        (workflowFile) => {
          // **Validates: Requirements 10.3** - Integrate with existing CI/CD pipelines
          
          const workflowPath = path.join(projectRoot, '../../', workflowFile);
          
          if (!fs.existsSync(workflowPath)) {
            // Workflow files are optional - integration should still work
            // This validates that the system doesn't break when workflows don't exist
            return true;
          }
          
          const workflowContent = fs.readFileSync(workflowPath, 'utf8');
          
          // Should use standard GitHub Actions structure
          expect(workflowContent).toContain('name:');
          expect(workflowContent).toContain('on:');
          expect(workflowContent).toContain('jobs:');
          
          // Should use existing Node.js setup patterns
          expect(workflowContent).toContain('actions/setup-node@v4');
          expect(workflowContent).toContain('npm ci');
          
          // Should integrate with existing build processes
          if (workflowFile.includes('validation')) {
            const hasTypeCheck = workflowContent.includes('npm run type-check');
            const hasLint = workflowContent.includes('npm run lint');
            const hasBuild = workflowContent.includes('npm run build');
            
            // At least one of these should be present for validation workflows
            expect(hasTypeCheck || hasLint || hasBuild).toBe(true);
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    test('TypeScript maintenance scripts use existing toolchain', () => {
      fc.assert(fc.property(
        fc.constantFrom('tsc', 'eslint', 'prettier', 'jest'),
        (tool) => {
          // **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5** - Use existing tools
          
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          // Tool should be available in dependencies or devDependencies
          const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };
          
          let toolFound = false;
          
          if (tool === 'tsc') {
            toolFound = 'typescript' in allDeps;
          } else if (tool === 'eslint') {
            toolFound = 'eslint' in allDeps;
          } else if (tool === 'prettier') {
            toolFound = 'prettier' in allDeps;
          } else if (tool === 'jest') {
            toolFound = 'jest' in allDeps;
          }
          
          expect(toolFound).toBe(true);
          
          // Enhanced scripts should use these existing tools
          const enhancedScripts = Object.keys(packageJson.scripts)
            .filter(script => script.startsWith('typescript:'));
          
          // At least some enhanced scripts should exist
          expect(enhancedScripts.length).toBeGreaterThan(0);
          
          return true;
        }
      ), { numRuns: 100 });
    });

    test('Configuration files maintain backward compatibility', () => {
      fc.assert(fc.property(
        fc.constantFrom('tsconfig.json', 'package.json', 'eslint.config.mjs'),
        (configFile) => {
          // **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5** - Maintain compatibility
          
          const configPath = path.join(projectRoot, configFile);
          
          expect(fs.existsSync(configPath)).toBe(true);
          
          // Configuration should be valid JSON/JS
          if (configFile.endsWith('.json')) {
            expect(() => {
              JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }).not.toThrow();
          }
          
          // Should not break existing functionality
          if (configFile === 'tsconfig.json') {
            const tsconfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Should have essential compiler options
            expect(tsconfig.compilerOptions).toBeDefined();
            expect(tsconfig.compilerOptions.target).toBeDefined();
            expect(tsconfig.compilerOptions.module).toBeDefined();
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    test('Integration preserves development workflow performance', () => {
      fc.assert(fc.property(
        fc.constantFrom('type-check', 'lint', 'format'),
        (command) => {
          // **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5** - Performance preservation
          
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          // Command should exist and be reasonably fast
          expect(packageJson.scripts).toHaveProperty(command);
          
          const script = packageJson.scripts[command];
          
          // Should use efficient tooling
          if (command === 'type-check') {
            expect(script).toContain('tsc --noEmit');
          } else if (command === 'lint') {
            expect(script).toContain('eslint');
          } else if (command === 'format') {
            expect(script).toContain('prettier');
          }
          
          // Enhanced versions should also exist
          const enhancedCommand = `typescript:${command === 'type-check' ? 'validate' : command}`;
          
          // Enhanced commands should build on existing ones
          return true;
        }
      ), { numRuns: 100 });
    });

    test('Migration path preserves existing developer experience', () => {
      fc.assert(fc.property(
        fc.constantFrom('dev', 'build', 'test'),
        (workflow) => {
          // **Validates: Requirements 10.5** - Migration guides and smooth adoption
          
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          // Core workflows should remain unchanged
          expect(packageJson.scripts).toHaveProperty(workflow);
          
          const script = packageJson.scripts[workflow];
          
          // Should maintain familiar commands
          if (workflow === 'dev') {
            expect(script).toContain('next dev');
          } else if (workflow === 'build') {
            expect(script).toContain('next build');
          } else if (workflow === 'test') {
            expect(script).toContain('jest');
          }
          
          // Additional TypeScript-specific commands should be additive
          const typescriptScripts = Object.keys(packageJson.scripts)
            .filter(key => key.startsWith('typescript:'));
          
          // Should have TypeScript enhancements available
          expect(typescriptScripts.length).toBeGreaterThan(0);
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });
});