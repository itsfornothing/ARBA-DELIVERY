/**
 * Performance Optimization Tests
 * 
 * Tests to ensure that the enhanced UI system maintains acceptable performance
 * characteristics and doesn't degrade application speed or bundle size.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { 
  PerformanceMonitor, 
  BundleSizeAnalyzer, 
  CSSOptimizer,
  BUNDLE_SIZE_THRESHOLDS,
  PERFORMANCE_THRESHOLDS 
} from '@/lib/performanceOptimization';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';

// Mock performance API for testing
const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
};

const MockPerformanceObserver = jest.fn().mockImplementation(() => mockPerformanceObserver);
(MockPerformanceObserver as any).supportedEntryTypes = ['measure', 'navigation', 'resource'];
global.PerformanceObserver = MockPerformanceObserver as any;

describe('Performance Optimization', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.destroy();
  });

  describe('Component Render Performance', () => {
    it('should render Button component within acceptable time limits', () => {
      const startTime = performance.now();
      
      render(
        <Button variant="primary" size="md">
          Test Button
        </Button>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Button should render in less than 16ms (60fps target)
      expect(renderTime).toBeLessThan(16);
    });

    it('should render Card component within acceptable time limits', () => {
      const startTime = performance.now();
      
      render(
        <Card variant="default" padding="md">
          <Typography variant="h3">Test Card</Typography>
          <Typography variant="body1">Card content</Typography>
        </Card>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Card should render in less than 16ms (60fps target)
      expect(renderTime).toBeLessThan(16);
    });

    it('should handle multiple component renders efficiently', () => {
      const startTime = performance.now();
      
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <Card key={i} variant="default" padding="sm">
              <Button variant="primary" size="sm">
                Button {i}
              </Button>
            </Card>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Multiple components should render in less than 50ms
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Interaction Performance', () => {
    it('should handle button clicks within acceptable response time', async () => {
      const handleClick = jest.fn();
      const startTime = performance.now();
      
      render(
        <Button variant="primary" size="md" onClick={handleClick}>
          Click Me
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      // Interaction should complete in less than 100ms
      expect(interactionTime).toBeLessThan(100);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should maintain performance during rapid interactions', async () => {
      const handleClick = jest.fn();
      
      render(
        <Button variant="primary" size="md" onClick={handleClick}>
          Rapid Click
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /rapid click/i });
      const startTime = performance.now();
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // 10 rapid clicks should complete in less than 200ms
      expect(totalTime).toBeLessThan(200);
      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('Performance Monitor', () => {
    it('should initialize without errors', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
      expect(performanceMonitor.getMetrics()).toEqual([]);
    });

    it('should measure component render time', () => {
      const componentName = 'TestComponent';
      const mockRenderFn = jest.fn(() => 'rendered');
      
      const result = performanceMonitor.measureComponentRender(componentName, mockRenderFn);
      
      expect(result).toBe('rendered');
      expect(mockRenderFn).toHaveBeenCalledTimes(1);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty('componentRenderTime');
      expect(typeof metrics[0].componentRenderTime).toBe('number');
    });

    it('should measure interaction time', () => {
      const interactionName = 'TestInteraction';
      const mockInteractionFn = jest.fn(() => 'completed');
      
      const result = performanceMonitor.measureInteraction(interactionName, mockInteractionFn);
      
      expect(result).toBe('completed');
      expect(mockInteractionFn).toHaveBeenCalledTimes(1);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty('interactionTime');
      expect(typeof metrics[0].interactionTime).toBe('number');
    });

    it('should validate performance thresholds', () => {
      // Mock some metrics
      performanceMonitor['metrics'] = [{
        fcp: 1200, // Good FCP
        lcp: 2000, // Good LCP
        fid: 50,   // Good FID
        cls: 0.05, // Good CLS
        timestamp: Date.now(),
      }];
      
      const validation = performanceMonitor.validatePerformance();
      
      expect(validation.passed).toBe(true);
      expect(validation.failures).toHaveLength(0);
      expect(validation.metrics).toBeTruthy();
    });

    it('should detect performance threshold violations', () => {
      // Mock poor metrics
      performanceMonitor['metrics'] = [{
        fcp: 2000, // Poor FCP
        lcp: 3000, // Poor LCP
        fid: 150,  // Poor FID
        cls: 0.2,  // Poor CLS
        timestamp: Date.now(),
      }];
      
      const validation = performanceMonitor.validatePerformance();
      
      expect(validation.passed).toBe(false);
      expect(validation.failures.length).toBeGreaterThan(0);
      expect(validation.failures.some(f => f.includes('FCP'))).toBe(true);
      expect(validation.failures.some(f => f.includes('LCP'))).toBe(true);
      expect(validation.failures.some(f => f.includes('FID'))).toBe(true);
      expect(validation.failures.some(f => f.includes('CLS'))).toBe(true);
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should validate acceptable bundle sizes', () => {
      const bundleStats = {
        main: 200 * 1024,    // 200KB - within threshold
        vendor: 400 * 1024,  // 400KB - within threshold
        css: 30 * 1024,      // 30KB - within threshold
        total: 630 * 1024,   // 630KB - within threshold
      };
      
      const validation = BundleSizeAnalyzer.validateBundleSize(bundleStats);
      
      expect(validation.passed).toBe(true);
      expect(validation.failures).toHaveLength(0);
      expect(validation.stats).toEqual(bundleStats);
    });

    it('should detect bundle size threshold violations', () => {
      const bundleStats = {
        main: 300 * 1024,    // 300KB - exceeds threshold
        vendor: 600 * 1024,  // 600KB - exceeds threshold
        css: 60 * 1024,      // 60KB - exceeds threshold
        total: 960 * 1024,   // 960KB - exceeds threshold
      };
      
      const validation = BundleSizeAnalyzer.validateBundleSize(bundleStats);
      
      expect(validation.passed).toBe(false);
      expect(validation.failures.length).toBeGreaterThan(0);
      expect(validation.failures.some(f => f.includes('Main bundle'))).toBe(true);
      expect(validation.failures.some(f => f.includes('Vendor bundle'))).toBe(true);
      expect(validation.failures.some(f => f.includes('CSS bundle'))).toBe(true);
    });

    it('should provide optimization recommendations', () => {
      const bundleStats = {
        main: 220 * 1024,    // Close to threshold
        vendor: 450 * 1024,  // Close to threshold
        css: 45 * 1024,      // Close to threshold
        total: 715 * 1024,
      };
      
      const recommendations = BundleSizeAnalyzer.getBundleOptimizationRecommendations(bundleStats);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('code splitting'))).toBe(true);
      expect(recommendations.some(r => r.includes('vendor dependencies'))).toBe(true);
      expect(recommendations.some(r => r.includes('CSS purging'))).toBe(true);
    });
  });

  describe('CSS Optimization', () => {
    it('should validate effective CSS purging', () => {
      const originalSize = 1000 * 1024; // 1MB original
      const purgedSize = 200 * 1024;    // 200KB after purging (80% reduction)
      
      const validation = CSSOptimizer.validateCSSPurging(originalSize, purgedSize);
      
      expect(validation.passed).toBe(true);
      expect(validation.reductionPercentage).toBe(80);
      expect(validation.message).toContain('effective');
    });

    it('should detect ineffective CSS purging', () => {
      const originalSize = 1000 * 1024; // 1MB original
      const purgedSize = 600 * 1024;    // 600KB after purging (40% reduction)
      
      const validation = CSSOptimizer.validateCSSPurging(originalSize, purgedSize);
      
      expect(validation.passed).toBe(false);
      expect(validation.reductionPercentage).toBe(40);
      expect(validation.message).toContain('ineffective');
    });

    it('should provide CSS optimization recommendations', () => {
      const cssSize = 60 * 1024; // 60KB - exceeds threshold
      
      const recommendations = CSSOptimizer.getCSSOptimizationRecommendations(cssSize);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('Tailwind CSS purging'))).toBe(true);
      expect(recommendations.some(r => r.includes('unused CSS'))).toBe(true);
    });
  });

  describe('Performance Thresholds', () => {
    it('should have reasonable performance thresholds defined', () => {
      expect(PERFORMANCE_THRESHOLDS.FCP_MAX).toBe(1500);
      expect(PERFORMANCE_THRESHOLDS.LCP_MAX).toBe(2500);
      expect(PERFORMANCE_THRESHOLDS.FID_MAX).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.CLS_MAX).toBe(0.1);
      expect(PERFORMANCE_THRESHOLDS.TTI_MAX).toBe(3500);
    });

    it('should have reasonable bundle size thresholds defined', () => {
      expect(BUNDLE_SIZE_THRESHOLDS.MAIN_BUNDLE_MAX).toBe(250 * 1024);
      expect(BUNDLE_SIZE_THRESHOLDS.VENDOR_BUNDLE_MAX).toBe(500 * 1024);
      expect(BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX).toBe(50 * 1024);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks during component lifecycle', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Render and unmount components multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(
          <Card variant="default" padding="md">
            <Button variant="primary" size="md">
              Test {i}
            </Button>
          </Card>
        );
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Animation Performance', () => {
    it('should handle animations without blocking the main thread', async () => {
      const startTime = performance.now();
      
      render(
        <Button variant="primary" size="md">
          Animated Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      // Simulate hover animation
      fireEvent.mouseEnter(button);
      await waitFor(() => {
        // Animation should start quickly
        const currentTime = performance.now();
        expect(currentTime - startTime).toBeLessThan(50);
      });
      
      fireEvent.mouseLeave(button);
    });
  });
});