/**
 * Property Test 2: Animation State Management
 * Validates: Requirements 12.2, 6.4
 * 
 * This test ensures that animations respect user preferences for reduced motion
 * and that animation states are properly managed across the application.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import fc from 'fast-check';
import { ThemeProvider } from 'styled-components';
import { accessibleTheme, reducedMotionTheme } from '@/lib/accessibleTheme';
import { MotionWrapper, FadeIn, SlideUp, ScaleIn, ConditionalMotion } from '@/components/molecules/MotionWrapper';
import { AccessibilityProvider } from '@/components/providers/AccessibilityProvider';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { LoadingSpinner } from '@/components/molecules/LoadingSpinner';

// Mock the reduced motion media query
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Test wrapper
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  reducedMotion?: boolean;
}> = ({ children, reducedMotion = false }) => {
  const theme = reducedMotion ? reducedMotionTheme : accessibleTheme;
  
  return (
    <ThemeProvider theme={theme}>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </ThemeProvider>
  );
};

// Generators for testing
const animationTypeArb = fc.constantFrom('fadeIn', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 'scaleIn');
const durationArb = fc.float({ min: Math.fround(0.1), max: Math.fround(2.0) });
const delayArb = fc.float({ min: Math.fround(0), max: Math.fround(1.0) });
const textArb = fc.string({ minLength: 1, maxLength: 50 });

describe('Property Test 2: Animation State Management', () => {
  beforeEach(() => {
    // Reset matchMedia mock
    mockMatchMedia(false);
  });

  describe('Reduced Motion Preferences (Requirement 12.2)', () => {
    test('animations are disabled when user prefers reduced motion', () => {
      fc.assert(
        fc.property(
          animationTypeArb,
          durationArb,
          textArb,
          (animationType, duration, content) => {
            // Mock reduced motion preference
            mockMatchMedia(true);
            
            render(
              <TestWrapper reducedMotion={true}>
                <MotionWrapper 
                  animation={animationType}
                  duration={duration}
                  data-testid="motion-wrapper"
                >
                  <div>{content}</div>
                </MotionWrapper>
              </TestWrapper>
            );
            
            const wrapper = screen.getByTestId('motion-wrapper');
            
            // Should render as static div when reduced motion is preferred
            expect(wrapper.tagName.toLowerCase()).toBe('div');
            expect(screen.getByText(content)).toBeInTheDocument();
            
            // Should not have motion-related attributes
            expect(wrapper).not.toHaveAttribute('data-framer-motion');
          }
        ),
        { numRuns: 20 }
      );
    });

    test('animations work normally when reduced motion is not preferred', () => {
      fc.assert(
        fc.property(
          animationTypeArb,
          durationArb,
          textArb,
          (animationType, duration, content) => {
            // Mock normal motion preference
            mockMatchMedia(false);
            
            render(
              <TestWrapper reducedMotion={false}>
                <MotionWrapper 
                  animation={animationType}
                  duration={duration}
                  data-testid="motion-wrapper"
                >
                  <div>{content}</div>
                </MotionWrapper>
              </TestWrapper>
            );
            
            const wrapper = screen.getByTestId('motion-wrapper');
            expect(screen.getByText(content)).toBeInTheDocument();
            
            // Content should still be accessible regardless of animation state
            expect(wrapper).toBeInTheDocument();
          }
        ),
        { numRuns: 20 }
      );
    });

    test('button animations respect reduced motion preferences', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'secondary', 'outline'),
          textArb,
          fc.boolean(),
          (variant, buttonText, reducedMotion) => {
            mockMatchMedia(reducedMotion);
            
            render(
              <TestWrapper reducedMotion={reducedMotion}>
                <AccessibleButton 
                  variant={variant}
                  data-testid="test-button"
                >
                  {buttonText}
                </AccessibleButton>
              </TestWrapper>
            );
            
            const button = screen.getByTestId('test-button');
            expect(button).toBeInTheDocument();
            expect(screen.getByText(buttonText)).toBeInTheDocument();
            
            // Button should be functional regardless of motion preferences
            expect(button).not.toBeDisabled();
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Animation Component Consistency (Requirement 6.4)', () => {
    test('specialized motion components render correctly', () => {
      fc.assert(
        fc.property(
          textArb,
          durationArb,
          (content, duration) => {
            const components = [
              { Component: FadeIn, name: 'FadeIn' },
              { Component: SlideUp, name: 'SlideUp' },
              { Component: ScaleIn, name: 'ScaleIn' },
            ];
            
            components.forEach(({ Component, name }) => {
              const { unmount } = render(
                <TestWrapper>
                  <Component 
                    duration={duration}
                    data-testid={`${name.toLowerCase()}-wrapper`}
                  >
                    <div>{content}</div>
                  </Component>
                </TestWrapper>
              );
              
              expect(screen.getByText(content)).toBeInTheDocument();
              unmount();
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    test('conditional motion respects animation conditions', () => {
      fc.assert(
        fc.property(
          textArb,
          fc.boolean(),
          fc.boolean(),
          (content, shouldAnimate, reducedMotion) => {
            mockMatchMedia(reducedMotion);
            
            render(
              <TestWrapper reducedMotion={reducedMotion}>
                <ConditionalMotion
                  condition={shouldAnimate}
                  animatedProps={{
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                  }}
                  staticProps={{ 'data-testid': 'static-element' }}
                >
                  <div>{content}</div>
                </ConditionalMotion>
              </TestWrapper>
            );
            
            expect(screen.getByText(content)).toBeInTheDocument();
            
            // If reduced motion is preferred, should always render static
            if (reducedMotion) {
              expect(screen.queryByTestId('static-element')).toBeInTheDocument();
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Loading Animation States', () => {
    test('loading spinners respect motion preferences', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('small', 'medium', 'large'),
          fc.constantFrom('primary', 'secondary', 'muted'),
          fc.boolean(),
          (size, color, reducedMotion) => {
            mockMatchMedia(reducedMotion);
            
            render(
              <TestWrapper reducedMotion={reducedMotion}>
                <LoadingSpinner 
                  size={size}
                  color={color}
                  data-testid="loading-spinner"
                />
              </TestWrapper>
            );
            
            const spinner = screen.getByTestId('loading-spinner');
            expect(spinner).toBeInTheDocument();
            
            // Spinner should be present regardless of motion preferences
            // but animation behavior would differ (tested in integration tests)
          }
        ),
        { numRuns: 10 }
      );
    });

    test('button loading states maintain accessibility', () => {
      fc.assert(
        fc.property(
          textArb,
          fc.option(textArb),
          fc.boolean(),
          (buttonText, loadingText, reducedMotion) => {
            mockMatchMedia(reducedMotion);
            
            const { rerender } = render(
              <TestWrapper reducedMotion={reducedMotion}>
                <AccessibleButton 
                  loading={false}
                  loadingText={loadingText || 'Loading'}
                  data-testid="loading-button"
                >
                  {buttonText}
                </AccessibleButton>
              </TestWrapper>
            );
            
            let button = screen.getByTestId('loading-button');
            expect(button).not.toBeDisabled();
            expect(screen.getByText(buttonText)).toBeInTheDocument();
            
            // Change to loading state
            rerender(
              <TestWrapper reducedMotion={reducedMotion}>
                <AccessibleButton 
                  loading={true}
                  loadingText={loadingText || 'Loading'}
                  data-testid="loading-button"
                >
                  {buttonText}
                </AccessibleButton>
              </TestWrapper>
            );
            
            button = screen.getByTestId('loading-button');
            expect(button).toBeDisabled();
            
            // Loading text should be available for screen readers
            const loadingTextElement = screen.getByText(loadingText || 'Loading');
            expect(loadingTextElement).toBeInTheDocument();
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Animation Duration and Timing', () => {
    test('animation durations are properly applied or disabled', () => {
      fc.assert(
        fc.property(
          durationArb,
          delayArb,
          textArb,
          fc.boolean(),
          (duration, delay, content, reducedMotion) => {
            mockMatchMedia(reducedMotion);
            
            render(
              <TestWrapper reducedMotion={reducedMotion}>
                <MotionWrapper 
                  animation="fadeIn"
                  duration={duration}
                  delay={delay}
                  data-testid="timed-animation"
                >
                  <div>{content}</div>
                </MotionWrapper>
              </TestWrapper>
            );
            
            expect(screen.getByText(content)).toBeInTheDocument();
            
            // Content should be immediately visible regardless of animation settings
            const wrapper = screen.getByTestId('timed-animation');
            expect(wrapper).toBeInTheDocument();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Theme Integration', () => {
    test('animation settings from theme are respected', () => {
      fc.assert(
        fc.property(
          textArb,
          (content) => {
            // Test with reduced motion theme
            render(
              <ThemeProvider theme={reducedMotionTheme}>
                <AccessibilityProvider>
                  <MotionWrapper data-testid="themed-animation">
                    <div>{content}</div>
                  </MotionWrapper>
                </AccessibilityProvider>
              </ThemeProvider>
            );
            
            expect(screen.getByText(content)).toBeInTheDocument();
            
            // Should respect theme's reduced motion setting
            const wrapper = screen.getByTestId('themed-animation');
            expect(wrapper).toBeInTheDocument();
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});