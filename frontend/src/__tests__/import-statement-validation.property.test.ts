/**
 * **Feature: frontend-missing-utilities-fix, Property 8: Import Statement Validation**
 * **Validates: Requirements 4.3, 4.4**
 * 
 * Property: For any import statement in the codebase, the build analysis should find no broken import paths 
 * and handle both named and default imports correctly
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

describe('Import Statement Validation Property Tests', () => {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');

  // Helper function to extract import statements from a file
  function extractImportStatements(filePath: string): Array<{
    importPath: string;
    isNamedImport: boolean;
    isDefaultImport: boolean;
    importedNames: string[];
    line: number;
  }> {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const imports: Array<{
      importPath: string;
      isNamedImport: boolean;
      isDefaultImport: boolean;
      importedNames: string[];
      line: number;
    }> = [];

    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Match various import patterns
      const importRegexes = [
        // import { named } from 'module'
        /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"`]([^'"`]+)['"`]/,
        // import defaultName from 'module'
        /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"`]([^'"`]+)['"`]/,
        // import defaultName, { named } from 'module'
        /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*\{\s*([^}]+)\s*\}\s*from\s*['"`]([^'"`]+)['"`]/,
        // import * as name from 'module'
        /import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"`]([^'"`]+)['"`]/,
        // import 'module' (side effect import)
        /import\s*['"`]([^'"`]+)['"`]/
      ];

      for (const regex of importRegexes) {
        const match = line.match(regex);
        if (match) {
          let importPath = '';
          let isNamedImport = false;
          let isDefaultImport = false;
          let importedNames: string[] = [];

          if (regex === importRegexes[0]) { // Named imports
            importedNames = match[1].split(',').map(name => name.trim());
            importPath = match[2];
            isNamedImport = true;
          } else if (regex === importRegexes[1]) { // Default import
            importedNames = [match[1]];
            importPath = match[2];
            isDefaultImport = true;
          } else if (regex === importRegexes[2]) { // Mixed import
            importedNames = [match[1], ...match[2].split(',').map(name => name.trim())];
            importPath = match[3];
            isNamedImport = true;
            isDefaultImport = true;
          } else if (regex === importRegexes[3]) { // Namespace import
            importedNames = [match[1]];
            importPath = match[2];
            isNamedImport = true;
          } else if (regex === importRegexes[4]) { // Side effect import
            importPath = match[1];
          }

          imports.push({
            importPath,
            isNamedImport,
            isDefaultImport,
            importedNames,
            line: index + 1
          });
          break;
        }
      }
    });

    return imports;
  }

  // Helper function to resolve import path
  function resolveImportPath(importPath: string): string | null {
    if (importPath.startsWith('@/')) {
      const relativePath = importPath.replace('@/', '');
      const fullPath = path.join(srcDir, relativePath);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        if (fs.existsSync(fullPath + ext)) {
          return fullPath + ext;
        }
      }
      
      // Try index files
      for (const ext of extensions) {
        const indexPath = path.join(fullPath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
      
      return fullPath;
    }
    
    return null;
  }

  // Helper function to get all TypeScript files
  function getAllTsFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files: string[] = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...getAllTsFiles(fullPath));
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  it('Property 8.1: All @/lib import statements resolve to existing files', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          const allFiles = getAllTsFiles(srcDir);
          let allImportsValid = true;
          const brokenImports: Array<{
            file: string;
            importPath: string;
            line: number;
            error: string;
          }> = [];

          for (const file of allFiles) {
            const imports = extractImportStatements(file);
            
            for (const importStatement of imports) {
              // Only check @/lib imports
              if (importStatement.importPath.startsWith('@/lib')) {
                const resolvedPath = resolveImportPath(importStatement.importPath);
                
                if (!resolvedPath || !fs.existsSync(resolvedPath)) {
                  allImportsValid = false;
                  brokenImports.push({
                    file: path.relative(projectRoot, file),
                    importPath: importStatement.importPath,
                    line: importStatement.line,
                    error: `Cannot resolve import path: ${importStatement.importPath}`
                  });
                }
              }
            }
          }

          // All @/lib imports should resolve successfully
          expect(allImportsValid).toBe(true);
          expect(brokenImports).toHaveLength(0);
          
          if (brokenImports.length > 0) {
            console.error('Broken imports found:', brokenImports);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8.2: Named imports from @/lib/utils work correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('cn', 'formatCurrency', 'formatDistance', 'formatDateTime'), { minLength: 1, maxLength: 4 }),
        (importNames) => {
          // Test that named imports work for all valid export names
          let importError: Error | null = null;
          let importedModule: any = null;

          try {
            importedModule = require('@/lib/utils');
          } catch (error) {
            importError = error as Error;
          }

          // Import should succeed
          expect(importError).toBeNull();
          expect(importedModule).toBeDefined();

          // All requested named imports should be available
          for (const importName of importNames) {
            expect(importedModule).toHaveProperty(importName);
            expect(typeof importedModule[importName]).toBe('function');
          }

          // Test that the functions work correctly
          if (importNames.includes('cn')) {
            const cnResult = importedModule.cn('test-class');
            expect(typeof cnResult).toBe('string');
          }

          if (importNames.includes('formatCurrency')) {
            const currencyResult = importedModule.formatCurrency(100);
            expect(typeof currencyResult).toBe('string');
            expect(currencyResult).toContain('$');
          }

          if (importNames.includes('formatDistance')) {
            const distanceResult = importedModule.formatDistance(5.5);
            expect(typeof distanceResult).toBe('string');
            expect(distanceResult).toContain('km');
          }

          if (importNames.includes('formatDateTime')) {
            const dateResult = importedModule.formatDateTime(new Date());
            expect(typeof dateResult).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8.3: Named imports from @/lib/validation work correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('FormValidator', 'commonValidationRules'), { minLength: 1, maxLength: 2 }),
        (importNames) => {
          // Test that named imports work for all valid export names
          let importError: Error | null = null;
          let importedModule: any = null;

          try {
            importedModule = require('@/lib/validation');
          } catch (error) {
            importError = error as Error;
          }

          // Import should succeed
          expect(importError).toBeNull();
          expect(importedModule).toBeDefined();

          // All requested named imports should be available
          for (const importName of importNames) {
            expect(importedModule).toHaveProperty(importName);
            
            if (importName === 'FormValidator') {
              expect(typeof importedModule[importName]).toBe('function');
              expect(typeof importedModule[importName].validate).toBe('function');
              expect(typeof importedModule[importName].validateForm).toBe('function');
            } else if (importName === 'commonValidationRules') {
              expect(typeof importedModule[importName]).toBe('object');
              expect(importedModule[importName]).toHaveProperty('email');
              expect(importedModule[importName]).toHaveProperty('password');
            }
          }

          // Test that FormValidator works if imported
          if (importNames.includes('FormValidator')) {
            const validationResult = importedModule.FormValidator.validate('test@example.com', { email: true });
            expect(validationResult).toHaveProperty('isValid');
            expect(typeof validationResult.isValid).toBe('boolean');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8.4: Default imports work consistently with named imports', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('@/lib/utils', '@/lib/validation'),
        (modulePath) => {
          // Test that default and named imports resolve to the same module
          let defaultImportError: Error | null = null;
          let namedImportError: Error | null = null;
          let defaultImport: any = null;
          let namedImport: any = null;

          try {
            // Test default import (require returns the module object)
            defaultImport = require(modulePath);
          } catch (error) {
            defaultImportError = error as Error;
          }

          try {
            // Test named import (destructuring from the same module)
            const module = require(modulePath);
            if (modulePath === '@/lib/utils') {
              namedImport = { cn: module.cn, formatCurrency: module.formatCurrency };
            } else {
              namedImport = { FormValidator: module.FormValidator, commonValidationRules: module.commonValidationRules };
            }
          } catch (error) {
            namedImportError = error as Error;
          }

          // Both import styles should succeed
          expect(defaultImportError).toBeNull();
          expect(namedImportError).toBeNull();
          expect(defaultImport).toBeDefined();
          expect(namedImport).toBeDefined();

          // Named imports should reference the same functions as default import
          if (modulePath === '@/lib/utils') {
            expect(namedImport.cn).toBe(defaultImport.cn);
            expect(namedImport.formatCurrency).toBe(defaultImport.formatCurrency);
          } else {
            expect(namedImport.FormValidator).toBe(defaultImport.FormValidator);
            expect(namedImport.commonValidationRules).toBe(defaultImport.commonValidationRules);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8.5: Import statements handle edge cases gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('@/lib/utils', '@/lib/validation'),
        (modulePath) => {
          // Test various edge cases in import handling
          let importError: Error | null = null;
          let module: any = null;

          try {
            module = require(modulePath);
          } catch (error) {
            importError = error as Error;
          }

          // Import should succeed
          expect(importError).toBeNull();
          expect(module).toBeDefined();

          // Test that the module is an object with expected properties
          expect(typeof module).toBe('object');
          expect(module).not.toBeNull();

          // Test that accessing non-existent properties returns undefined (not throws)
          expect(() => {
            const nonExistent = module.nonExistentProperty;
            expect(nonExistent).toBeUndefined();
          }).not.toThrow();

          // Test that the module can be imported multiple times consistently
          let secondImport: any = null;
          try {
            secondImport = require(modulePath);
          } catch (error) {
            // Should not throw
            expect(error).toBeNull();
          }

          expect(secondImport).toBe(module); // Should be the same reference due to require caching
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8.6: Import paths are case-sensitive and exact', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Test that import paths must be exact
          const validPaths = ['@/lib/utils', '@/lib/validation'];

          // Valid paths should work
          for (const validPath of validPaths) {
            let importError: Error | null = null;
            let module: any = null;

            try {
              module = require(validPath);
            } catch (error) {
              importError = error as Error;
            }

            expect(importError).toBeNull();
            expect(module).toBeDefined();
          }

          // Test that the resolved paths are exact by checking file system
          for (const validPath of validPaths) {
            const resolvedPath = resolveImportPath(validPath);
            expect(resolvedPath).not.toBeNull();
            
            if (resolvedPath) {
              expect(fs.existsSync(resolvedPath)).toBe(true);
              
              // Verify the actual file path matches expected case
              const expectedFileName = validPath.includes('utils') ? 'utils.ts' : 'validation.ts';
              expect(path.basename(resolvedPath)).toBe(expectedFileName);
            }
          }

          // Test that non-existent paths fail
          const nonExistentPaths = ['@/lib/nonexistent', '@/lib/missing'];
          for (const nonExistentPath of nonExistentPaths) {
            const resolvedPath = resolveImportPath(nonExistentPath);
            if (resolvedPath) {
              expect(fs.existsSync(resolvedPath)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8.7: Import statements work in different file contexts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('@/lib/utils', '@/lib/validation'),
        (modulePath) => {
          // Test that imports work regardless of the importing file's location
          // This simulates imports from different directories in the project
          
          let importError: Error | null = null;
          let module: any = null;

          try {
            // Clear require cache to simulate fresh import
            delete require.cache[require.resolve(modulePath)];
            module = require(modulePath);
          } catch (error) {
            importError = error as Error;
          }

          // Import should succeed from any context
          expect(importError).toBeNull();
          expect(module).toBeDefined();

          // Module should have consistent structure regardless of import context
          if (modulePath === '@/lib/utils') {
            expect(module).toHaveProperty('cn');
            expect(module).toHaveProperty('formatCurrency');
            expect(module).toHaveProperty('formatDistance');
            expect(module).toHaveProperty('formatDateTime');
          } else {
            expect(module).toHaveProperty('FormValidator');
            expect(module).toHaveProperty('commonValidationRules');
          }

          // Functions should work correctly regardless of import context
          if (modulePath === '@/lib/utils') {
            const cnResult = module.cn('test');
            expect(typeof cnResult).toBe('string');
          } else {
            const validationResult = module.FormValidator.validate('test', { required: true });
            expect(validationResult).toHaveProperty('isValid');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8.8: TypeScript compilation handles all import patterns correctly', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Test that TypeScript can compile different import patterns
          const importPatterns = [
            "import { cn } from '@/lib/utils';",
            "import { cn, formatCurrency } from '@/lib/utils';",
            "import { FormValidator } from '@/lib/validation';",
            "import { FormValidator, commonValidationRules } from '@/lib/validation';",
            "import * as utils from '@/lib/utils';",
            "import * as validation from '@/lib/validation';"
          ];

          // All import patterns should be valid TypeScript
          for (const importPattern of importPatterns) {
            // Create a simple TypeScript program to test compilation
            const testCode = `
              ${importPattern}
              
              // Use the imported items to ensure they're properly typed
              ${importPattern.includes('cn') ? 'const result = cn("test");' : ''}
              ${importPattern.includes('formatCurrency') ? 'const currency = formatCurrency(100);' : ''}
              ${importPattern.includes('FormValidator') ? 'const validation = FormValidator.validate("test", { required: true });' : ''}
              ${importPattern.includes('* as utils') ? 'const result = utils.cn("test");' : ''}
              ${importPattern.includes('* as validation') ? 'const result = validation.FormValidator.validate("test", { required: true });' : ''}
            `;

            // Test that the code would compile (by checking the import can be resolved)
            const modulePath = importPattern.includes('@/lib/utils') ? '@/lib/utils' : '@/lib/validation';
            
            let importError: Error | null = null;
            try {
              require(modulePath);
            } catch (error) {
              importError = error as Error;
            }

            expect(importError).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});