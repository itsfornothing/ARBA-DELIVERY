/**
 * Basic Performance Tests
 * Simple tests to verify performance monitoring functionality
 */

import { performanceMonitor } from '@/lib/performanceMonitor';

// Mock performance APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 50, // 50MB
  },
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

describe('Performance Monitor Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.stopMonitoring();
  });

  afterEach(() => {
    performanceMonitor.destroy();
  });

  test('should start monitoring', () => {
    performanceMonitor.startMonitoring();
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });

  test('should stop monitoring', () => {
    performanceMonitor.startMonitoring();
    performanceMonitor.stopMonitoring();
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  test('should track animations', async () => {
    const animationId = 'test-animation';
    
    performanceMonitor.startAnimationTracking(animationId);
    
    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const data = performanceMonitor.endAnimationTracking(animationId);
    
    expect(data).toBeTruthy();
    expect(data?.animationId).toBe(animationId);
  });

  test('should record interactions', () => {
    performanceMonitor.recordInteraction({
      type: 'click',
      startTime: performance.now(),
      successful: true,
    });
    
    const metrics = performanceMonitor.getInteractionMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].type).toBe('click');
  });

  test('should provide metrics', () => {
    const metrics = performanceMonitor.getMetrics();
    expect(Array.isArray(metrics)).toBe(true);
  });

  test('should provide optimization suggestions', () => {
    const suggestions = performanceMonitor.getOptimizationSuggestions();
    expect(Array.isArray(suggestions)).toBe(true);
  });
});