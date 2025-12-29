/**
 * Property-Based Test: Monitoring Accuracy
 * 
 * **Feature: typescript-maintenance-system, Property 9: Monitoring Accuracy**
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 * 
 * Tests that the monitoring system accurately collects and reports metrics
 * without data loss across all validation runs and quality checks.
 */

import fc from 'fast-check';
import { TypeScriptMonitoringSystem } from '../lib/typescriptMonitoringSystem';
import { ValidationResult, QualityMetrics, MonitoringConfig } from '../types/monitoring';

describe('Property Test: Monitoring Accuracy', () => {
  let monitoringSystem: TypeScriptMonitoringSystem;

  beforeEach(() => {
    monitoringSystem = new TypeScriptMonitoringSystem();
  });

  afterEach(() => {
    monitoringSystem.cleanup();
  });

  /**
   * Property 9: Monitoring Accuracy
   * For any validation run or quality check, the monitoring system should 
   * accurately collect and report metrics without data loss
   */
  test('should accurately collect metrics for all validation runs without data loss', () => {
    fc.assert(
      fc.property(
        // Generate validation results with various error types and frequencies
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            errors: fc.array(
              fc.record({
                file: fc.string({ minLength: 1, maxLength: 100 }),
                line: fc.integer({ min: 1, max: 1000 }),
                column: fc.integer({ min: 1, max: 200 }),
                message: fc.string({ minLength: 1, maxLength: 200 }),
                code: fc.integer({ min: 1000, max: 9999 }),
                severity: fc.constantFrom('error', 'warning', 'info'),
                category: fc.constantFrom('syntax', 'type', 'import', 'unused', 'strict')
              }),
              { minLength: 0, maxLength: 50 }
            ),
            warnings: fc.array(
              fc.record({
                file: fc.string({ minLength: 1, maxLength: 100 }),
                message: fc.string({ minLength: 1, maxLength: 200 }),
                severity: fc.constantFrom('warning', 'info')
              }),
              { minLength: 0, maxLength: 30 }
            ),
            performance: fc.record({
              compilationTime: fc.float({ min: Math.fround(0.1), max: Math.fround(300.0) }),
              memoryUsage: fc.integer({ min: 100, max: 2000 }),
              fileCount: fc.integer({ min: 1, max: 1000 }),
              cacheHitRate: fc.float({ min: Math.fround(0.0), max: Math.fround(1.0) })
            })
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (validationResults) => {
          // Requirement 9.1: Collect metrics on error types and frequencies
          const collectedMetrics: QualityMetrics[] = [];
          
          validationResults.forEach(result => {
            const metrics = monitoringSystem.collectValidationMetrics(result);
            collectedMetrics.push(metrics);
          });

          // Verify no data loss occurred
          expect(collectedMetrics).toHaveLength(validationResults.length);

          // Verify error type categorization is accurate
          collectedMetrics.forEach((metrics, index) => {
            const originalResult = validationResults[index];
            
            // Check error count accuracy
            expect(metrics.errorCount).toBe(originalResult.errors.length);
            expect(metrics.warningCount).toBe(originalResult.warnings.length);
            
            // Check error categorization
            const errorsByCategory = originalResult.errors.reduce((acc, error) => {
              acc[error.category] = (acc[error.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            // Add missing categories with 0 count for comparison
            const allCategories: ErrorCategory[] = ['syntax', 'type', 'import', 'unused', 'strict'];
            allCategories.forEach(category => {
              if (!(category in errorsByCategory)) {
                errorsByCategory[category] = 0;
              }
            });
            
            expect(metrics.errorsByCategory).toEqual(errorsByCategory);
            
            // Check performance metrics preservation
            expect(metrics.performance.compilationTime).toBe(originalResult.performance.compilationTime);
            expect(metrics.performance.memoryUsage).toBe(originalResult.performance.memoryUsage);
          });

          // Requirement 9.2: Show trends in TypeScript error rates over time
          const trendData = monitoringSystem.generateTrendReport(collectedMetrics);
          
          // Verify trend data completeness
          expect(trendData.dataPoints).toHaveLength(collectedMetrics.length);
          expect(trendData.totalErrors).toBe(
            collectedMetrics.reduce((sum, m) => sum + m.errorCount, 0)
          );
          expect(trendData.totalWarnings).toBe(
            collectedMetrics.reduce((sum, m) => sum + m.warningCount, 0)
          );

          // Requirement 9.3: Categorize and prioritize code quality issues
          const prioritizedIssues = monitoringSystem.categorizeAndPrioritizeIssues(collectedMetrics);
          
          // Verify all issues are categorized
          const totalOriginalErrors = validationResults.reduce(
            (sum, result) => sum + result.errors.length, 0
          );
          const totalCategorizedIssues = Object.values(prioritizedIssues.categories)
            .reduce((sum, category) => sum + category.count, 0);
          
          expect(totalCategorizedIssues).toBe(totalOriginalErrors);

          // Requirement 9.4: Provide dashboards showing project health
          if (collectedMetrics.length > 0) {
            const healthDashboard = monitoringSystem.generateHealthDashboard(collectedMetrics);
            
            // Verify dashboard completeness
            expect(healthDashboard.overallHealth).toBeDefined();
            expect(healthDashboard.metrics).toBeDefined();
            expect(healthDashboard.trends).toBeDefined();
            expect(healthDashboard.recommendations).toBeDefined();
            
            // Verify health score calculation accuracy
            const expectedHealthScore = monitoringSystem.calculateHealthScore(collectedMetrics);
            expect(healthDashboard.overallHealth.score).toBe(expectedHealthScore);
          }

          // Requirement 9.5: Alert when error rates exceed thresholds
          const alertConfig = {
            errorThreshold: 10,
            warningThreshold: 20,
            performanceThreshold: 60.0
          };
          
          const alerts = monitoringSystem.checkThresholds(collectedMetrics, alertConfig);
          
          // Verify alert accuracy
          const metricsExceedingErrorThreshold = collectedMetrics.filter(
            m => m.errorCount > alertConfig.errorThreshold
          );
          const metricsExceedingWarningThreshold = collectedMetrics.filter(
            m => m.warningCount > alertConfig.warningThreshold
          );
          const metricsExceedingPerformanceThreshold = collectedMetrics.filter(
            m => m.performance.compilationTime > alertConfig.performanceThreshold
          );
          
          expect(alerts.errorAlerts).toHaveLength(metricsExceedingErrorThreshold.length);
          expect(alerts.warningAlerts).toHaveLength(metricsExceedingWarningThreshold.length);
          expect(alerts.performanceAlerts).toHaveLength(metricsExceedingPerformanceThreshold.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should maintain data integrity during concurrent monitoring operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            operationType: fc.constantFrom('collect', 'report', 'alert', 'trend'),
            timestamp: fc.date(),
            data: fc.record({
              errorCount: fc.integer({ min: 0, max: 100 }),
              warningCount: fc.integer({ min: 0, max: 50 }),
              performanceScore: fc.float({ min: Math.fround(0.0), max: Math.fround(100.0) })
            })
          }),
          { minLength: 5, maxLength: 50 }
        ),
        async (operations) => {
          // Create a fresh monitoring system for this test
          const testMonitoringSystem = new TypeScriptMonitoringSystem();
          
          // Simulate concurrent operations
          const promises = operations.map(async (op, index) => {
            switch (op.operationType) {
              case 'collect':
                return testMonitoringSystem.collectMetrics(op.data, `collect-${index}`);
              case 'report':
                return testMonitoringSystem.generateReport(op.data, `report-${index}`);
              case 'alert':
                return testMonitoringSystem.checkAlerts(op.data, `alert-${index}`);
              case 'trend':
                return testMonitoringSystem.updateTrends(op.data, `trend-${index}`);
            }
          });

          const results = await Promise.all(promises);

          // Verify no data corruption occurred
          expect(results).toHaveLength(operations.length);
          results.forEach((result, index) => {
            expect(result).toBeDefined();
            expect(result.operationId).toBe(`${operations[index].operationType}-${index}`);
            expect(result.success).toBe(true);
          });

          // Verify data consistency
          const finalState = testMonitoringSystem.getState();
          expect(finalState.operationCount).toBe(operations.length);
          expect(finalState.dataIntegrityCheck).toBe(true);
          
          testMonitoringSystem.cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should accurately aggregate metrics across different time periods', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
            metrics: fc.record({
              errorCount: fc.integer({ min: 0, max: 20 }),
              warningCount: fc.integer({ min: 0, max: 15 }),
              compilationTime: fc.float({ min: Math.fround(1.0), max: Math.fround(60.0) }).filter(n => !isNaN(n) && isFinite(n)),
              fileCount: fc.integer({ min: 1, max: 100 })
            })
          }),
          { minLength: 10, maxLength: 100 }
        ),
        (dataPoints) => {
          // Sort by timestamp for proper aggregation
          const sortedData = dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          // Test daily aggregation
          const dailyAggregation = monitoringSystem.aggregateByPeriod(sortedData, 'daily');
          
          // Verify aggregation accuracy
          const expectedDailyTotals = sortedData.reduce((acc, point) => {
            const dateKey = point.timestamp.toISOString().split('T')[0];
            if (!acc[dateKey]) {
              acc[dateKey] = { errorCount: 0, warningCount: 0, compilationTime: 0, fileCount: 0, count: 0 };
            }
            acc[dateKey].errorCount += point.metrics.errorCount;
            acc[dateKey].warningCount += point.metrics.warningCount;
            acc[dateKey].compilationTime += point.metrics.compilationTime;
            acc[dateKey].fileCount += point.metrics.fileCount;
            acc[dateKey].count += 1;
            return acc;
          }, {} as Record<string, any>);

          Object.keys(expectedDailyTotals).forEach(dateKey => {
            const aggregatedDay = dailyAggregation.find(d => d.date === dateKey);
            expect(aggregatedDay).toBeDefined();
            expect(aggregatedDay!.totalErrors).toBe(expectedDailyTotals[dateKey].errorCount);
            expect(aggregatedDay!.totalWarnings).toBe(expectedDailyTotals[dateKey].warningCount);
            
            const expectedAvgTime = expectedDailyTotals[dateKey].compilationTime / expectedDailyTotals[dateKey].count;
            if (isFinite(expectedAvgTime) && !isNaN(expectedAvgTime)) {
              expect(aggregatedDay!.averageCompilationTime).toBeCloseTo(expectedAvgTime, 2);
            }
          });

          // Test weekly aggregation
          const weeklyAggregation = monitoringSystem.aggregateByPeriod(sortedData, 'weekly');
          
          // Verify weekly totals are consistent with daily totals
          const totalErrorsDaily = dailyAggregation.reduce((sum, day) => sum + day.totalErrors, 0);
          const totalErrorsWeekly = weeklyAggregation.reduce((sum, week) => sum + week.totalErrors, 0);
          
          expect(totalErrorsDaily).toBe(totalErrorsWeekly);
        }
      ),
      { numRuns: 100 }
    );
  });
});