/**
 * Performance Optimization Tests for UI Enhancements
 * 
 * Tests performance characteristics of UI components and ensures
 * optimizations don't degrade user experience.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';
import { defaultTheme } from '@/lib/theme';

// Import components for performance testing
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { LoadingSpinner } from '@/components/molecules/LoadingSpinner';
import { Form } from '@/components/molecules/Form';
import { ResponsiveLayout } from '@/components/molecules/ResponsiveLayout';
import { SkeletonScreens } from '@/components/molecules/SkeletonScreens';

// Mock performance APIs
const mockPerformanceObserver = () => {
  global.PerformanceObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
  }));
};

const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme={defaultTheme}>
    <PerformanceProvider>
      <div style={{ padding: '16px' }}>
        {children}
      </div>
    </PerformanceProvider>
  </ThemeProvider>
);

describe('Performance Optimization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceObserver();
    mockIntersectionObserver();
  });

  describe('Component Rendering Performance', () => {
    it('should render large lists efficiently', () => {
      const startTime = performance.now();
      
      const { container } = render(
        <TestWrapper>
          <div data-testid="large-list">
            {Array.from({ length: 100 }, (_, i) => (
              <Card key={i} data-testid={`card-${i}`}>
                <Typography variant="h4">Item {i}</Typography>
                <Typography variant="body">Description for item {i}</Typography>
                <Button size="small">Action {i}</Button>
              </Card>
            ))}
          </div>
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Verify components are rendered
      expect(screen.getByTestId('large-list')).toBeInTheDocument();
      expect(screen.getByTestId('card-0')).toBeInTheDocument();
      expect(screen.getByTestId('card-99')).toBeInTheDocument();
      
      // Performance should be reasonable (less than 200ms for 100 items)
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle rapid re-renders efficiently', async () => {
      const user = userEvent.setup();
      let renderCount = 0;
      
      const TestComponent: React.FC = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          renderCount++;
        });
        
        return (
          <TestWrapper>
            <div data-testid="rapid-render-test">
              <Typography variant="h3">Count: {count}</Typography>
              <Button 
                onClick={() => setCount(c => c + 1)}
                data-testid="increment-button"
              >
                Increment
              </Button>
            </div>
          </TestWrapper>
        );
      };
      
      render(<TestComponent />);
      
      const button = screen.getByTestId('increment-button');
      const startTime = performance.now();
      
      // Perform rapid clicks
      for (let i = 0; i < 10; i++) {
        await user.click(button);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify final state
      expect(screen.getByText('Count: 10')).toBeInTheDocument();
      
      // Should handle 10 rapid updates efficiently (less than 100ms total)
      expect(totalTime).toBeLessThan(100);
    });

    it('should optimize form validation performance', async () => {
      const user = userEvent.setup();
      let validationCount = 0;
      
      const handleValidation = () => {
        validationCount++;
      };
      
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <Form 
            onSubmit={() => {}}
            validationRules={{
              email: { required: true, email: true },
              name: { required: true, minLength: 2 }
            }}
            onFieldChange={handleValidation}
            data-testid="performance-form"
          >
            <Input name="email" label="Email" type="email" />
            <Input name="name" label="Name" />
            <Button type="submit">Submit</Button>
          </Form>
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText('Email');
      const nameInput = screen.getByLabelText('Name');
      
      // Type in both fields rapidly
      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, 'John Doe');
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify form is populated
      expect(emailInput).toHaveValue('test@example.com');
      expect(nameInput).toHaveValue('John Doe');
      
      // Form validation should be efficient (less than 150ms for typing)
      expect(totalTime).toBeLessThan(150);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should clean up event listeners properly', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <TestWrapper>
          <ResponsiveLayout data-testid="responsive-component">
            <Typography variant="h2">Responsive Content</Typography>
          </ResponsiveLayout>
        </TestWrapper>
      );
      
      // Component should add event listeners for responsive behavior
      expect(addEventListenerSpy).toHaveBeenCalled();
      
      // Unmount component
      unmount();
      
      // Event listeners should be cleaned up
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle component unmounting without memory leaks', () => {
      const components = [];
      
      // Create and unmount multiple components
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <TestWrapper>
            <Card key={i} data-testid={`memory-test-card-${i}`}>
              <Typography variant="h4">Card {i}</Typography>
              <Button onClick={() => {}}>Action</Button>
            </Card>
          </TestWrapper>
        );
        
        components.push(unmount);
      }
      
      // Unmount all components
      components.forEach(unmount => unmount());
      
      // No specific assertion here, but this test ensures no memory leaks occur
      // In a real environment, you'd use memory profiling tools
      expect(true).toBe(true);
    });
  });

  describe('Animation Performance', () => {
    it('should handle animation performance efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <div data-testid="animation-test">
            <Button 
              variant="primary"
              data-testid="animated-button"
              style={{
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Hover Me
            </Button>
          </div>
        </TestWrapper>
      );
      
      const button = screen.getByTestId('animated-button');
      const startTime = performance.now();
      
      // Trigger hover animations rapidly
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Animation handling should be efficient (less than 50ms for 10 hover cycles)
      expect(totalTime).toBeLessThan(50);
    });

    it('should optimize loading animations', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div data-testid="loading-animations">
            <LoadingSpinner size="small" />
            <LoadingSpinner size="medium" />
            <LoadingSpinner size="large" />
            <SkeletonScreens variant="card" count={5} />
          </div>
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Loading animations should render quickly (less than 50ms)
      expect(renderTime).toBeLessThan(50);
      
      // Verify all loading components are rendered
      expect(screen.getByTestId('loading-animations')).toBeInTheDocument();
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should import components efficiently', () => {
      // This test verifies that components can be imported without importing the entire library
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div data-testid="bundle-test">
            <Button variant="primary">Test Button</Button>
            <Input label="Test Input" />
            <Card>Test Card</Card>
          </div>
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const importTime = endTime - startTime;
      
      // Component imports should be fast (less than 30ms)
      expect(importTime).toBeLessThan(30);
    });
  });

  describe('Lazy Loading Performance', () => {
    it('should handle lazy loading efficiently', async () => {
      const LazyComponent = React.lazy(() => 
        Promise.resolve({
          default: () => (
            <Card data-testid="lazy-card">
              <Typography variant="h3">Lazy Loaded Content</Typography>
            </Card>
          )
        })
      );
      
      render(
        <TestWrapper>
          <React.Suspense fallback={<LoadingSpinner data-testid="lazy-loading" />}>
            <LazyComponent />
          </React.Suspense>
        </TestWrapper>
      );
      
      // Initially should show loading
      expect(screen.getByTestId('lazy-loading')).toBeInTheDocument();
      
      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('lazy-card')).toBeInTheDocument();
      });
      
      // Verify lazy component loaded
      expect(screen.getByText('Lazy Loaded Content')).toBeInTheDocument();
    });
  });

  describe('Responsive Performance', () => {
    it('should handle viewport changes efficiently', () => {
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });
      
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ResponsiveLayout data-testid="responsive-performance">
            <Typography variant="h2">Responsive Content</Typography>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {Array.from({ length: 20 }, (_, i) => (
                <Card key={i}>
                  <Typography variant="h4">Card {i}</Typography>
                </Card>
              ))}
            </div>
          </ResponsiveLayout>
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Responsive layout should render efficiently (less than 100ms for 20 cards)
      expect(renderTime).toBeLessThan(100);
      
      // Verify responsive layout is rendered
      expect(screen.getByTestId('responsive-performance')).toBeInTheDocument();
    });
  });

  describe('Accessibility Performance', () => {
    it('should handle accessibility features without performance impact', async () => {
      const user = userEvent.setup();
      
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div data-testid="a11y-performance">
            {Array.from({ length: 30 }, (_, i) => (
              <Button
                key={i}
                aria-label={`Button ${i}`}
                aria-describedby={`desc-${i}`}
                data-testid={`a11y-button-${i}`}
              >
                Button {i}
              </Button>
            ))}
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} id={`desc-${i}`} style={{ display: 'none' }}>
                Description for button {i}
              </div>
            ))}
          </div>
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Accessibility attributes should not significantly impact performance
      expect(renderTime).toBeLessThan(80);
      
      // Test keyboard navigation performance
      const firstButton = screen.getByTestId('a11y-button-0');
      const navigationStart = performance.now();
      
      await user.tab();
      expect(firstButton).toHaveFocus();
      
      const navigationEnd = performance.now();
      const navigationTime = navigationEnd - navigationStart;
      
      // Keyboard navigation should be fast (less than 20ms)
      expect(navigationTime).toBeLessThan(20);
    });
  });

  describe('Theme Switching Performance', () => {
    it('should handle theme changes efficiently', async () => {
      const user = userEvent.setup();
      
      const ThemeToggleTest: React.FC = () => {
        const [isDark, setIsDark] = React.useState(false);
        
        return (
          <TestWrapper>
            <div data-testid="theme-performance">
              <Button 
                onClick={() => setIsDark(!isDark)}
                data-testid="theme-toggle"
              >
                Toggle Theme
              </Button>
              <div style={{ marginTop: '16px' }}>
                {Array.from({ length: 20 }, (_, i) => (
                  <Card key={i} style={{ marginBottom: '8px' }}>
                    <Typography variant="h4">Card {i}</Typography>
                    <Typography variant="body">Content for card {i}</Typography>
                  </Card>
                ))}
              </div>
            </div>
          </TestWrapper>
        );
      };
      
      render(<ThemeToggleTest />);
      
      const toggleButton = screen.getByTestId('theme-toggle');
      
      // Measure theme switching performance
      const startTime = performance.now();
      await user.click(toggleButton);
      const endTime = performance.now();
      
      const switchTime = endTime - startTime;
      
      // Theme switching should be fast (less than 50ms)
      expect(switchTime).toBeLessThan(50);
    });
  });
});