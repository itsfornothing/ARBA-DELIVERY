#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Enhanced Module Resolution Debug');
console.log('====================================');

// Check current working directory
console.log(`Current working directory: ${process.cwd()}`);

// Check if src directory exists
const srcPath = path.join(process.cwd(), 'src');
console.log(`src directory exists: ${fs.existsSync(srcPath)}`);

// Check if lib directory exists
const libPath = path.join(process.cwd(), 'src', 'lib');
console.log(`src/lib directory exists: ${fs.existsSync(libPath)}`);

// Check critical utility files
const criticalFiles = [
  'src/lib/utils.ts',
  'src/lib/validation.ts',
  'src/lib/theme.ts',
  'src/lib/index.ts'
];

console.log('\nCritical utility files:');
criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  
  if (exists && file.endsWith('.ts')) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const exportCount = (content.match(/export/g) || []).length;
      console.log(`    - Contains ${exportCount} exports`);
    } catch (error) {
      console.log(`    - Error reading file: ${error.message}`);
    }
  }
});

// Check tsconfig.json
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
console.log(`\ntsconfig.json exists: ${fs.existsSync(tsconfigPath)}`);

if (fs.existsSync(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    console.log(`  baseUrl: ${tsconfig.compilerOptions?.baseUrl}`);
    console.log(`  paths configured: ${JSON.stringify(tsconfig.compilerOptions?.paths, null, 2)}`);
    console.log(`  moduleResolution: ${tsconfig.compilerOptions?.moduleResolution}`);
  } catch (error) {
    console.log(`  Error reading tsconfig.json: ${error.message}`);
  }
}

// Check next.config.js
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
console.log(`\nnext.config.js exists: ${fs.existsSync(nextConfigPath)}`);

if (fs.existsSync(nextConfigPath)) {
  try {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    const hasWebpackConfig = content.includes('webpack:');
    const hasResolveAlias = content.includes('resolve.alias');
    console.log(`  Has webpack config: ${hasWebpackConfig}`);
    console.log(`  Has resolve.alias: ${hasResolveAlias}`);
  } catch (error) {
    console.log(`  Error reading next.config.js: ${error.message}`);
  }
}

// Check for specific problematic imports
const problematicFiles = [
  'src/components/atoms/ResponsiveGrid.tsx',
  'src/components/atoms/Typography.tsx',
  'src/app/design-system/forms/page.tsx',
  'src/components/molecules/Form.tsx',
  'src/components/molecules/FormField.tsx'
];

console.log('\nChecking problematic files:');
problematicFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  
  if (exists) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasUtilsImport = content.includes("from '@/lib/utils'");
      const hasValidationImport = content.includes("from '@/lib/validation'");
      
      if (hasUtilsImport) console.log(`    - Uses @/lib/utils import`);
      if (hasValidationImport) console.log(`    - Uses @/lib/validation import`);
    } catch (error) {
      console.log(`    - Error reading file: ${error.message}`);
    }
  }
});

// List all files in src/lib
if (fs.existsSync(libPath)) {
  console.log('\nAll files in src/lib:');
  const libFiles = fs.readdirSync(libPath);
  libFiles.forEach(file => {
    const filePath = path.join(libPath, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`  - ${file} (${size} KB)`);
  });
}

// Environment info
console.log('\nEnvironment:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`NODE_VERSION: ${process.version}`);
console.log(`CI: ${process.env.CI}`);
console.log(`RENDER: ${process.env.RENDER}`);

// Package.json check
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`\nPackage info:`);
    console.log(`  Name: ${pkg.name}`);
    console.log(`  Next.js version: ${pkg.dependencies?.next || 'not found'}`);
    console.log(`  TypeScript version: ${pkg.devDependencies?.typescript || 'not found'}`);
  } catch (error) {
    console.log(`\nError reading package.json: ${error.message}`);
  }
}

// Final validation
console.log('\n🔍 Final Validation:');
const allCriticalExist = criticalFiles.every(file => 
  fs.existsSync(path.join(process.cwd(), file))
);
console.log(`All critical files exist: ${allCriticalExist ? '✅' : '❌'}`);

if (!allCriticalExist) {
  console.log('\n❌ ISSUE DETECTED: Missing critical files!');
  console.log('This will cause module resolution failures during build.');
  process.exit(1);
}

console.log('\n✅ Enhanced module resolution debug complete');