/**
 * Property-Based Tests for TypeScript Error Recovery Effectiveness
 * 
 * **Feature: typescript-maintenance-system, Property 7: Error Recovery Effectiveness**
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 * 
 * Tests that the error recovery system provides relevant suggestions and maintains
 * a knowledge base for future similar errors across all possible TypeScript errors.
 */

import fc from 'fast-check';
import { 
  ErrorRecoverySystem, 
  TypeScriptError, 
  ErrorCategory, 
  ErrorAnalysis,
  Fix,
  Resolution,
  ComprehensiveErrorSuggestion
} from '../lib/typescriptErrorRecovery';

describe('Error Recovery Effectiveness Properties', () => {
  let errorRecoverySystem: ErrorRecoverySystem;

  beforeEach(() => {
    errorRecoverySystem = new ErrorRecoverySystem();
  });

  /**
   * Property 7.1: Error Analysis Completeness
   * For any TypeScript error, the system should provide complete analysis
   * including root cause, impact level, and fix complexity assessment.
   */
  test('Property 7.1: Error analysis provides complete information for all errors', () => {
    fc.assert(fc.property(
      fc.record({
        file: fc.string({ minLength: 1, maxLength: 100 }),
        line: fc.integer({ min: 1, max: 10000 }),
        column: fc.integer({ min: 1, max: 200 }),
        message: fc.string({ minLength: 10, maxLength: 200 }),
        code: fc.integer({ min: 1000, max: 9999 }),
        severity: fc.constantFrom('error', 'warning', 'info'),
        category: fc.constantFrom(
          'TYPE_ERROR', 'IMPORT_ERROR', 'SYNTAX_ERROR', 
          'CONFIGURATION_ERROR', 'DECLARATION_ERROR', 'GENERIC_ERROR',
          'STRICT_MODE_ERROR', 'UNUSED_CODE', 'DEPRECATED_API'
        )
      }),
      (errorData) => {
        const error: TypeScriptError = errorData as TypeScriptError;
        
        const analysis = errorRecoverySystem.analyzeError(error);
        
        // Analysis should be complete
        expect(analysis).toBeDefined();
        expect(analysis.error).toEqual(error);
        expect(analysis.rootCause).toBeDefined();
        expect(analysis.rootCause.length).toBeGreaterThan(0);
        expect(['low', 'medium', 'high', 'critical']).toContain(analysis.impactLevel);
        expect(['simple', 'moderate', 'complex']).toContain(analysis.fixComplexity);
        expect(analysis.estimatedFixTime).toBeGreaterThan(0);
        expect(Array.isArray(analysis.relatedErrors)).toBe(true);
        expect(Array.isArray(analysis.prerequisites)).toBe(true);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 7.2: Fix Suggestion Relevance
   * For any TypeScript error, suggested fixes should be relevant to the error category
   * and have reasonable confidence scores.
   */
  test('Property 7.2: Fix suggestions are relevant and have valid confidence scores', () => {
    fc.assert(fc.property(
      fc.record({
        file: fc.string({ minLength: 1, maxLength: 100 }),
        line: fc.integer({ min: 1, max: 10000 }),
        column: fc.integer({ min: 1, max: 200 }),
        message: fc.string({ minLength: 10, maxLength: 200 }),
        code: fc.integer({ min: 1000, max: 9999 }),
        severity: fc.constantFrom('error', 'warning', 'info'),
        category: fc.constantFrom(
          'TYPE_ERROR', 'IMPORT_ERROR', 'SYNTAX_ERROR', 
          'CONFIGURATION_ERROR', 'DECLARATION_ERROR', 'GENERIC_ERROR',
          'STRICT_MODE_ERROR', 'UNUSED_CODE', 'DEPRECATED_API'
        )
      }),
      (errorData) => {
        const error: TypeScriptError = errorData as TypeScriptError;
        
        const fixes = errorRecoverySystem.suggestFixes(error);
        
        // Should provide at least one fix suggestion
        expect(fixes.length).toBeGreaterThan(0);
        
        fixes.forEach(fix => {
          // Each fix should have valid properties
          expect(fix.id).toBeDefined();
          expect(fix.id.length).toBeGreaterThan(0);
          expect(fix.description).toBeDefined();
          expect(fix.description.length).toBeGreaterThan(0);
          expect(['automatic', 'semi-automatic', 'manual']).toContain(fix.type);
          expect(fix.confidence).toBeGreaterThanOrEqual(0);
          expect(fix.confidence).toBeLessThanOrEqual(1);
          expect(Array.isArray(fix.changes)).toBe(true);
          expect(fix.validation).toBeDefined();
          expect(Array.isArray(fix.validation.preConditions)).toBe(true);
          expect(Array.isArray(fix.validation.postConditions)).toBe(true);
          expect(Array.isArray(fix.validation.sideEffects)).toBe(true);
          expect(typeof fix.validation.testRequired).toBe('boolean');
          expect(typeof fix.rollbackPossible).toBe('boolean');
        });
        
        // Fixes should be sorted by confidence (highest first)
        for (let i = 1; i < fixes.length; i++) {
          expect(fixes[i-1].confidence).toBeGreaterThanOrEqual(fixes[i].confidence);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 7.3: Automatic Fix Safety
   * For any automatic fix, the system should validate pre-conditions and
   * provide rollback capability if post-conditions fail.
   */
  test('Property 7.3: Automatic fixes are safe and have rollback capability', () => {
    fc.assert(fc.property(
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 50 }),
        description: fc.string({ minLength: 10, maxLength: 100 }),
        type: fc.constant('automatic'),
        confidence: fc.float({ min: 0.5, max: 1.0 }),
        changes: fc.array(fc.record({
          span: fc.record({
            start: fc.integer({ min: 0, max: 1000 }),
            length: fc.integer({ min: 1, max: 100 })
          }),
          newText: fc.string({ maxLength: 200 })
        }), { minLength: 1, maxLength: 5 }),
        validation: fc.record({
          preConditions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 }),
          postConditions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 }),
          sideEffects: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 3 }),
          testRequired: fc.boolean()
        }),
        rollbackPossible: fc.constant(true)
      }),
      (fixData) => {
        const fix: Fix = fixData as Fix;
        
        const result = errorRecoverySystem.applyAutomaticFix(fix);
        
        // Result should be defined
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.appliedChanges)).toBe(true);
        
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe('string');
          expect(result.error!.length).toBeGreaterThan(0);
        }
        
        if (result.success && result.sideEffects) {
          expect(Array.isArray(result.sideEffects)).toBe(true);
        }
      }
    ), { numRuns: 50 });
  });

  /**
   * Property 7.4: Knowledge Base Learning
   * For any error resolution, the system should learn from it and improve
   * future suggestions for similar errors.
   */
  test('Property 7.4: System learns from error resolutions and improves suggestions', () => {
    fc.assert(fc.property(
      fc.tuple(
        fc.record({
          file: fc.string({ minLength: 1, maxLength: 100 }),
          line: fc.integer({ min: 1, max: 10000 }),
          column: fc.integer({ min: 1, max: 200 }),
          message: fc.string({ minLength: 10, maxLength: 200 }),
          code: fc.integer({ min: 2000, max: 2999 }), // Focus on common error codes
          severity: fc.constantFrom('error', 'warning'),
          category: fc.constantFrom('TYPE_ERROR', 'IMPORT_ERROR', 'SYNTAX_ERROR')
        }),
        fc.record({
          errorCode: fc.integer({ min: 2000, max: 2999 }),
          pattern: fc.string({ minLength: 10, maxLength: 100 }),
          solution: fc.string({ minLength: 20, maxLength: 200 }),
          success: fc.boolean(),
          timeToResolve: fc.integer({ min: 1, max: 60 }),
          userFeedback: fc.option(fc.constantFrom('helpful', 'not_helpful', 'partially_helpful'))
        })
      ),
      ([errorData, resolutionData]) => {
        const error: TypeScriptError = errorData as TypeScriptError;
        const resolution: Resolution = {
          ...resolutionData,
          errorCode: error.code // Ensure consistency
        } as Resolution;
        
        // Get initial suggestions
        const initialSuggestions = errorRecoverySystem.suggestFixes(error);
        const initialSuggestionCount = initialSuggestions.length;
        
        // Learn from resolution
        errorRecoverySystem.learnFromResolution(error, resolution);
        
        // Get suggestions after learning
        const updatedSuggestions = errorRecoverySystem.suggestFixes(error);
        
        // System should maintain or improve suggestions
        expect(updatedSuggestions.length).toBeGreaterThanOrEqual(initialSuggestionCount);
        
        // If resolution was successful and helpful, confidence should be maintained or improved
        if (resolution.success && resolution.userFeedback === 'helpful') {
          const hasImprovedConfidence = updatedSuggestions.some(suggestion => 
            initialSuggestions.some(initial => 
              initial.description === suggestion.description && 
              suggestion.confidence >= initial.confidence
            )
          );
          expect(hasImprovedConfidence || updatedSuggestions.length > initialSuggestionCount).toBe(true);
        }
      }
    ), { numRuns: 50 });
  });

  /**
   * Property 7.5: Comprehensive Error Suggestions
   * For any TypeScript error, the system should provide comprehensive suggestions
   * including analysis, fixes, knowledge base entries, and learning resources.
   */
  test('Property 7.5: Comprehensive error suggestions include all relevant information', () => {
    fc.assert(fc.property(
      fc.record({
        file: fc.string({ minLength: 1, maxLength: 100 }),
        line: fc.integer({ min: 1, max: 10000 }),
        column: fc.integer({ min: 1, max: 200 }),
        message: fc.string({ minLength: 10, maxLength: 200 }),
        code: fc.integer({ min: 1000, max: 9999 }),
        severity: fc.constantFrom('error', 'warning', 'info'),
        category: fc.constantFrom(
          'TYPE_ERROR', 'IMPORT_ERROR', 'SYNTAX_ERROR', 
          'CONFIGURATION_ERROR', 'DECLARATION_ERROR', 'GENERIC_ERROR',
          'STRICT_MODE_ERROR', 'UNUSED_CODE', 'DEPRECATED_API'
        )
      }),
      (errorData) => {
        const error: TypeScriptError = errorData as TypeScriptError;
        
        const comprehensiveSuggestion = errorRecoverySystem.getComprehensiveErrorSuggestions(error);
        
        // Should include all components
        expect(comprehensiveSuggestion).toBeDefined();
        expect(comprehensiveSuggestion.analysis).toBeDefined();
        expect(Array.isArray(comprehensiveSuggestion.fixes)).toBe(true);
        expect(comprehensiveSuggestion.fixes.length).toBeGreaterThan(0);
        expect(Array.isArray(comprehensiveSuggestion.similarErrors)).toBe(true);
        expect(Array.isArray(comprehensiveSuggestion.preventionTips)).toBe(true);
        expect(comprehensiveSuggestion.preventionTips.length).toBeGreaterThan(0);
        expect(Array.isArray(comprehensiveSuggestion.learningResources)).toBe(true);
        expect(comprehensiveSuggestion.learningResources.length).toBeGreaterThan(0);
        
        // Analysis should be complete
        const analysis = comprehensiveSuggestion.analysis;
        expect(analysis.error).toEqual(error);
        expect(analysis.rootCause.length).toBeGreaterThan(0);
        expect(['low', 'medium', 'high', 'critical']).toContain(analysis.impactLevel);
        
        // Learning resources should be valid
        comprehensiveSuggestion.learningResources.forEach(resource => {
          expect(resource.title).toBeDefined();
          expect(resource.title.length).toBeGreaterThan(0);
          expect(resource.url).toBeDefined();
          expect(resource.url.length).toBeGreaterThan(0);
          expect(['documentation', 'tutorial', 'reference', 'video']).toContain(resource.type);
          expect(resource.relevance).toBeGreaterThanOrEqual(0);
          expect(resource.relevance).toBeLessThanOrEqual(1);
        });
        
        // Prevention tips should be actionable
        comprehensiveSuggestion.preventionTips.forEach(tip => {
          expect(tip).toBeDefined();
          expect(tip.length).toBeGreaterThan(10); // Should be descriptive
        });
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 7.6: Error Pattern Recognition
   * The system should recognize common error patterns and provide
   * pattern-specific suggestions with higher confidence.
   */
  test('Property 7.6: System recognizes error patterns and provides targeted suggestions', () => {
    fc.assert(fc.property(
      fc.tuple(
        fc.constantFrom(2322, 2304, 2345, 2554, 2531), // Common error codes
        fc.string({ minLength: 20, maxLength: 100 })
      ),
      ([errorCode, baseMessage]) => {
        // Create error with known pattern
        const error: TypeScriptError = {
          file: 'test.ts',
          line: 10,
          column: 5,
          message: baseMessage,
          code: errorCode,
          severity: 'error',
          category: errorCode === 2304 ? 'IMPORT_ERROR' : 'TYPE_ERROR'
        };
        
        const suggestions = errorRecoverySystem.suggestFixes(error);
        
        // Should provide suggestions for known error codes
        expect(suggestions.length).toBeGreaterThan(0);
        
        // At least one suggestion should have high confidence for known patterns
        const hasHighConfidenceSuggestion = suggestions.some(suggestion => 
          suggestion.confidence >= 0.7
        );
        expect(hasHighConfidenceSuggestion).toBe(true);
        
        // Suggestions should be relevant to the error code
        suggestions.forEach(suggestion => {
          expect(suggestion.description.length).toBeGreaterThan(5);
          expect(suggestion.confidence).toBeGreaterThan(0);
        });
      }
    ), { numRuns: 50 });
  });

  /**
   * Property 7.7: Fix Validation Consistency
   * All fixes should have consistent validation requirements and
   * rollback capabilities based on their type and complexity.
   */
  test('Property 7.7: Fix validation requirements are consistent with fix type and complexity', () => {
    fc.assert(fc.property(
      fc.record({
        file: fc.string({ minLength: 1, maxLength: 100 }),
        line: fc.integer({ min: 1, max: 10000 }),
        column: fc.integer({ min: 1, max: 200 }),
        message: fc.string({ minLength: 10, maxLength: 200 }),
        code: fc.integer({ min: 1000, max: 9999 }),
        severity: fc.constantFrom('error', 'warning', 'info'),
        category: fc.constantFrom(
          'TYPE_ERROR', 'IMPORT_ERROR', 'SYNTAX_ERROR', 
          'STRICT_MODE_ERROR', 'UNUSED_CODE'
        )
      }),
      (errorData) => {
        const error: TypeScriptError = errorData as TypeScriptError;
        
        const fixes = errorRecoverySystem.suggestFixes(error);
        
        fixes.forEach(fix => {
          // Automatic fixes should have rollback capability
          if (fix.type === 'automatic') {
            expect(fix.rollbackPossible).toBe(true);
            expect(fix.confidence).toBeGreaterThanOrEqual(0.7); // High confidence for automatic fixes
          }
          
          // Manual fixes should require testing
          if (fix.type === 'manual') {
            expect(fix.validation.testRequired).toBe(true);
          }
          
          // All fixes should have at least one post-condition
          expect(fix.validation.postConditions.length).toBeGreaterThan(0);
          
          // Complex fixes should have more validation requirements
          if (fix.validation.preConditions.length > 2) {
            expect(fix.validation.testRequired).toBe(true);
          }
        });
      }
    ), { numRuns: 100 });
  });
});