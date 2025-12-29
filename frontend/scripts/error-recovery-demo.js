#!/usr/bin/env node

/**
 * TypeScript Error Recovery System Demo
 * 
 * Demonstrates the error recovery and suggestion system capabilities
 * by analyzing common TypeScript errors and providing fix suggestions.
 */

const { ErrorRecoverySystem } = require('../src/lib/typescriptErrorRecovery');

// Demo TypeScript errors
const demoErrors = [
  {
    file: 'src/components/Button.tsx',
    line: 15,
    column: 8,
    message: "Type 'string' is not assignable to type 'number'",
    code: 2322,
    severity: 'error',
    category: 'TYPE_ERROR'
  },
  {
    file: 'src/utils/helpers.ts',
    line: 3,
    column: 1,
    message: "Cannot find name 'React'",
    code: 2304,
    severity: 'error',
    category: 'IMPORT_ERROR'
  },
  {
    file: 'src/hooks/useData.ts',
    line: 12,
    column: 5,
    message: "'data' is declared but its value is never read",
    code: 6133,
    severity: 'warning',
    category: 'UNUSED_CODE'
  },
  {
    file: 'src/types/api.ts',
    line: 8,
    column: 12,
    message: "Expected ';'",
    code: 1005,
    severity: 'error',
    category: 'SYNTAX_ERROR'
  }
];

async function demonstrateErrorRecovery() {
  console.log('🔧 TypeScript Error Recovery System Demo\n');
  
  const errorRecoverySystem = new ErrorRecoverySystem();
  
  for (const [index, error] of demoErrors.entries()) {
    console.log(`\n📋 Error ${index + 1}: ${error.message}`);
    console.log(`   File: ${error.file}:${error.line}:${error.column}`);
    console.log(`   Code: TS${error.code} (${error.category})`);
    
    // Analyze the error
    console.log('\n🔍 Analysis:');
    const analysis = errorRecoverySystem.analyzeError(error);
    console.log(`   Root Cause: ${analysis.rootCause}`);
    console.log(`   Impact Level: ${analysis.impactLevel}`);
    console.log(`   Fix Complexity: ${analysis.fixComplexity}`);
    console.log(`   Estimated Fix Time: ${analysis.estimatedFixTime} minutes`);
    
    // Get fix suggestions
    console.log('\n💡 Suggested Fixes:');
    const fixes = errorRecoverySystem.suggestFixes(error);
    fixes.slice(0, 3).forEach((fix, fixIndex) => {
      console.log(`   ${fixIndex + 1}. ${fix.description}`);
      console.log(`      Type: ${fix.type}, Confidence: ${(fix.confidence * 100).toFixed(0)}%`);
      console.log(`      Rollback: ${fix.rollbackPossible ? 'Yes' : 'No'}`);
    });
    
    // Get comprehensive suggestions
    const comprehensive = errorRecoverySystem.getComprehensiveErrorSuggestions(error);
    
    console.log('\n📚 Prevention Tips:');
    comprehensive.preventionTips.slice(0, 2).forEach((tip, tipIndex) => {
      console.log(`   • ${tip}`);
    });
    
    console.log('\n📖 Learning Resources:');
    comprehensive.learningResources.slice(0, 2).forEach((resource, resourceIndex) => {
      console.log(`   • ${resource.title} (${resource.type})`);
      console.log(`     ${resource.url}`);
    });
    
    // Simulate learning from resolution
    const resolution = {
      errorCode: error.code,
      pattern: error.message,
      solution: fixes[0]?.description || 'Manual fix applied',
      success: Math.random() > 0.3, // 70% success rate
      timeToResolve: Math.floor(Math.random() * 10) + 1,
      userFeedback: Math.random() > 0.5 ? 'helpful' : 'partially_helpful'
    };
    
    errorRecoverySystem.learnFromResolution(error, resolution);
    console.log(`\n✅ Resolution recorded: ${resolution.success ? 'Success' : 'Failed'} (${resolution.timeToResolve}min)`);
    
    console.log('\n' + '─'.repeat(80));
  }
  
  console.log('\n🎯 Demo completed! The error recovery system has:');
  console.log('   • Analyzed 4 different types of TypeScript errors');
  console.log('   • Provided targeted fix suggestions for each error');
  console.log('   • Demonstrated learning from error resolutions');
  console.log('   • Shown comprehensive error support with prevention tips');
  console.log('\n💡 The system maintains a knowledge base and improves over time!');
}

// Run the demo
if (require.main === module) {
  demonstrateErrorRecovery().catch(console.error);
}

module.exports = { demonstrateErrorRecovery };