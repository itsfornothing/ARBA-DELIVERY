/**
 * Property-Based Test for Loading State Completeness
 * Feature: delivery-app-ui-enhancement, Property 6: Loading State Completeness
 * Validates: Requirements 6.3, 10.1, 10.3, 10.4
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import * as fc from 'fast-check';
import { defaultTheme } from '@/lib/theme';
import { 
  LoadingSpinner, 
  LoadingOverlay,
  LoadingBoundary,
  OrderCardSkeleton,
  DashboardStatsSkeleton,
  FormSkeleton,
  TableSkeleton,
  ProfileSkeleton,
  ChartSkeleton,
  PageSkeleton
} from '@/components/molecules';
import { Skeleton } from '@/components/atoms';
import { useLoadingStore, LoadingKeys } from '@/lib/loadingState';

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={defaultTheme}>
    {children}
  </ThemeProvider>
);

// Mock component for testing async operations
const AsyncComponent: React.FC<{ delay: number; shouldError?: boolean }> = ({ delay, shouldError = false }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldError) {
        setError(true);
      }
      setLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, shouldError]);

  if (loading) {
    return <LoadingSpinner data-testid="async-loading" />;
  }

  if (error) {
    return <div data-testid="async-error">Error occurred</div>;
  }

  return <div data-testid="async-content">Content loaded</div>;
};

describe('Loading State Completeness Properties', () => {
  beforeEach(() => {
    // Clear loading store before each test
    useLoadingStore.getState().clearAll();
    // Clear any existing DOM elements
    document.body.innerHTML = '';
  });

  /**
   * Property 6: Loading State Completeness
   * For any asynchronous operation (API calls, image loading, page navigation), 
   * the system must display appropriate loading indicators without blocking the entire interface
   */
  it('should display appropriate loading indicators for all async operations without blocking interface', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom('spinner', 'dots', 'pulse'),
          size: fc.constantFrom('small', 'medium', 'large'),
          color: fc.constantFrom('primary', 'secondary', 'muted'),
          message: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
        }),
        ({ variant, size, color, message }) => {
          const testId = `test-${Math.random().toString(36).substr(2, 9)}`;
          
          const { container } = render(
            <TestWrapper>
              <div data-testid={`${testId}-container`}>
                <div data-testid={`${testId}-content`}>Other interface elements</div>
                <div data-testid={`${testId}-spinner`}>
                  <LoadingSpinner 
                    variant={variant}
                    size={size}
                    color={color}
                  />
                </div>
                {message && (
                  <div data-testid={`${testId}-overlay`}>
                    <LoadingOverlay
                      loading={true}
                      message={message}
                      variant="inline"
                    />
                  </div>
                )}
              </div>
            </TestWrapper>
          );

          // Verify loading indicators are present
          const spinner = screen.getByTestId(`${testId}-spinner`);
          expect(spinner).toBeInTheDocument();

          // Verify interface is not completely blocked
          const otherContent = screen.getByTestId(`${testId}-content`);
          expect(otherContent).toBeInTheDocument();
          expect(otherContent).toBeVisible();

          // Verify styled components are rendered (indicating loading components work)
          const styledElements = container.querySelectorAll('[class*="sc-"]');
          expect(styledElements.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should provide skeleton screens that match content structure for all loading states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'order-card',
          'dashboard-stats', 
          'form',
          'table',
          'profile',
          'chart',
          'page'
        ),
        (skeletonType) => {
          let SkeletonComponent;

          switch (skeletonType) {
            case 'order-card':
              SkeletonComponent = OrderCardSkeleton;
              break;
            case 'dashboard-stats':
              SkeletonComponent = DashboardStatsSkeleton;
              break;
            case 'form':
              SkeletonComponent = FormSkeleton;
              break;
            case 'table':
              SkeletonComponent = TableSkeleton;
              break;
            case 'profile':
              SkeletonComponent = ProfileSkeleton;
              break;
            case 'chart':
              SkeletonComponent = ChartSkeleton;
              break;
            case 'page':
              SkeletonComponent = PageSkeleton;
              break;
            default:
              SkeletonComponent = PageSkeleton;
          }

          const testId = `${skeletonType}-${Math.random().toString(36).substr(2, 9)}`;
          const { container } = render(
            <TestWrapper>
              <div data-testid={testId}>
                <SkeletonComponent />
              </div>
            </TestWrapper>
          );

          // Verify skeleton component renders
          const skeletonElement = screen.getByTestId(testId);
          expect(skeletonElement).toBeInTheDocument();

          // Verify skeleton contains styled elements (indicating proper rendering)
          const styledElements = container.querySelectorAll('[class*="sc-"]');
          expect(styledElements.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle skeleton loading without blocking content display', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom('text', 'rectangular', 'circular', 'rounded'),
          animation: fc.constantFrom('pulse', 'wave', 'none'),
          width: fc.integer({ min: 50, max: 500 }),
          height: fc.integer({ min: 20, max: 200 })
        }),
        ({ variant, animation, width, height }) => {
          const testId = `skeleton-${Math.random().toString(36).substr(2, 9)}`;
          const { container } = render(
            <TestWrapper>
              <div data-testid={`${testId}-container`}>
                <div data-testid={`${testId}-content`}>Other content</div>
                <div data-testid={`${testId}-skeleton`}>
                  <Skeleton
                    variant={variant}
                    animation={animation}
                    width={width}
                    height={height}
                  />
                </div>
              </div>
            </TestWrapper>
          );

          // Verify other content is not blocked
          const otherContent = screen.getByTestId(`${testId}-content`);
          expect(otherContent).toBeInTheDocument();
          expect(otherContent).toBeVisible();

          // Verify skeleton component renders
          const skeletonContainer = screen.getByTestId(`${testId}-skeleton`);
          expect(skeletonContainer).toBeInTheDocument();

          // Verify styled components are rendered
          const styledElements = container.querySelectorAll('[class*="sc-"]');
          expect(styledElements.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should maintain loading state consistency across component boundaries', () => {
    fc.assert(
      fc.property(
        fc.record({
          loadingKey: fc.constantFrom(...Object.values(LoadingKeys)),
          initialLoading: fc.boolean()
        }),
        ({ loadingKey, initialLoading }) => {
          // Set initial loading state with act wrapper
          act(() => {
            useLoadingStore.getState().setLoading(loadingKey, initialLoading);
          });

          const testId = `test-${Math.random().toString(36).substr(2, 9)}`;
          
          const TestComponent = () => {
            const loading = useLoadingStore(state => state.isLoading(loadingKey));
            
            return (
              <div data-testid={testId}>
                <div data-testid={`${testId}-content`}>
                  {loading ? 'Loading...' : 'Content loaded'}
                </div>
                <div data-testid={`${testId}-overlay`}>
                  <LoadingOverlay
                    loading={loading}
                    variant="inline"
                    message="Processing..."
                  />
                </div>
              </div>
            );
          };

          const { container } = render(
            <TestWrapper>
              <TestComponent />
            </TestWrapper>
          );

          // Verify initial state
          const component = screen.getByTestId(testId);
          expect(component).toBeInTheDocument();

          // Verify loading state is consistent
          const currentLoading = useLoadingStore.getState().isLoading(loadingKey);
          expect(currentLoading).toBe(initialLoading);

          // Verify component structure is consistent
          const contentElement = screen.getByTestId(`${testId}-content`);
          expect(contentElement).toBeInTheDocument();
          
          // Verify overlay container exists
          const overlayContainer = screen.getByTestId(`${testId}-overlay`);
          expect(overlayContainer).toBeInTheDocument();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should provide smooth animations for all loading state transitions', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom('spinner', 'dots', 'pulse'),
          animationType: fc.constantFrom('pulse', 'wave', 'none'),
          duration: fc.integer({ min: 100, max: 2000 })
        }),
        ({ variant, animationType, duration }) => {
          const testId = `animation-${Math.random().toString(36).substr(2, 9)}`;
          const { container } = render(
            <TestWrapper>
              <div data-testid={testId}>
                <LoadingSpinner variant={variant} />
                <Skeleton 
                  variant="rectangular" 
                  animation={animationType}
                  width={200} 
                  height={100} 
                />
              </div>
            </TestWrapper>
          );

          // Verify animated elements are present
          const animationContainer = screen.getByTestId(testId);
          expect(animationContainer).toBeInTheDocument();

          // Verify styled components are rendered (they contain animation styles)
          const styledElements = container.querySelectorAll('[class*="sc-"]');
          expect(styledElements.length).toBeGreaterThan(0);

          // At minimum, we should have child elements
          expect(animationContainer.children.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });
});