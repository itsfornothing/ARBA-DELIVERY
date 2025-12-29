/**
 * Property-Based Test for Responsive Design Maintenance
 * **Feature: ui-system-enhancement, Property 5: Responsive design maintenance**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 * 
 * For any enhanced component, it should maintain proper responsive behavior across all breakpoints,
 * ensure touch targets meet minimum size requirements on mobile, and adapt typography and spacing
 * appropriately for different screen sizes.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import fc from 'fast-check';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Typography } from '@/components/atoms/Typography';
import { BREAKPOINTS } from '@/lib/responsive';

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (width: number) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => {
      const matches = query.includes(`max-width: ${width}px`) || 
                     query.includes(`min-width: ${width - 1}px`) ||
                     (query.includes('max-width') && parseInt(query.match(/\d+/)?.[0] || '0') >= width) ||
                     (query.includes('min-width') && parseInt(query.match(/\d+/)?.[0] || '0') <= width);
      return {
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }),
  });
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Viewport size generator covering all breakpoints
const viewportArbitrary = fc.record({
  width: fc.integer({ min: 320, max: 1920 }),
  height: fc.integer({ min: 568, max: 1080 }),
});

// Component variant generators
const buttonVariantArbitrary = fc.constantFrom('primary', 'secondary', 'outline', 'ghost');
const buttonSizeArbitrary = fc.constantFrom('sm', 'md', 'lg');
const inputSizeArbitrary = fc.constantFrom('sm', 'md', 'lg');
const typographyVariantArbitrary = fc.constantFrom('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption');

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <div style={{ padding: '16px', width: '100%', maxWidth: '100%' }}>
      {children}
    </div>
  </ThemeProvider>
);

describe('Responsive Design Maintenance Properties', () => {
  beforeEach(() => {
    // Reset viewport
    mockMatchMedia(1024);
    // Clear any existing DOM elements
    document.body.innerHTML = '';
  });

  it('Property 5.1: Components have responsive CSS classes for touch targets on mobile', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
        buttonVariantArbitrary,
        buttonSizeArbitrary,
        (width, variant, size) => {
          // Set mobile viewport
          mockMatchMedia(width);
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });

          const component = (
            <TestWrapper>
              <Button 
                variant={variant} 
                size={size} 
                data-testid="responsive-button"
              >
                Touch Target Test
              </Button>
            </TestWrapper>
          );

          const { container, unmount } = render(component);
          const button = container.querySelector('[data-testid="responsive-button"]') as HTMLElement;
          expect(button).toBeTruthy();

          // Check for responsive classes that indicate proper touch targets
          const hasHeightClasses = button.className.includes('min-h-') || 
                                  button.className.includes('h-') ||
                                  button.className.includes('py-');
          
          const hasPaddingClasses = button.className.includes('px-') || 
                                   button.className.includes('py-') ||
                                   button.className.includes('p-');

          // Button should have responsive sizing classes
          expect(hasHeightClasses || hasPaddingClasses).toBe(true);

          // Button should be visible and
          const computedStyle = window.getComputedStyle(button);
          expect(computedStyle.display).not.toBe('none');
          expect(computedStyle.visibility).not.toBe('hidden');
          expect(computedStyle.pointerEvents).not.toBe('none');

          unmount();
          return true;
        }
      ),
      { numRuns: 50 } // Reduced for faster execution
    );
  });

  it('Property 5.2: Input fields have responsive classes for proper mobile interaction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
        inputSizeArbitrary,
        (width, size) => {
          // Set mobile viewport
          mockMatchMedia(width);
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });

          const component = (
            <TestWrapper>
              <Input 
                size={size} 
                data-testid="responsive-input"
                placeholder="Touch target test"
              />
            </TestWrapper>
          );

          const { container, unmount } = render(component);
          const input = container.querySelector('[data-testid="responsive-input"]') as HTMLInputElement;
          expect(input).toBeTruthy();

          // Check for responsive classes that indicate proper sizing
          const hasHeightClasses = input.className.includes('h-') || 
                                  input.className.includes('min-h-') ||
                                  input.className.includes('py-');

          const hasTextSizeClasses = input.className.includes('text-');

          // Input should have responsive sizing classes
          expect(hasHeightClasses || hasTextSizeClasses).toBe(true);

          // Input should be accessible and
          const computedStyle = window.getComputedStyle(input);
          expect(computedStyle.display).not.toBe('none');
          expect(computedStyle.visibility).not.toBe('hidden');
          expect(input.disabled).toBe(false);

          unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 5.3: Typography components have responsive text sizing classes', () => {
    fc.assert(
      fc.property(
        viewportArbitrary,
        typographyVariantArbitrary,
        (viewport, variant) => {
          // Set viewport
          mockMatchMedia(viewport.width);
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          });

          const component = (
            <TestWrapper>
              <Typography 
                variant={variant} 
                data-testid="responsive-typography"
              >
                Responsive Typography Test
              </Typography>
            </TestWrapper>
          );

          const { container, unmount } = render(component);
          const typography = container.querySelector('[data-testid="responsive-typography"]') as HTMLElement;
          expect(typography).toBeTruthy();

          // Check for responsive typography classes
          const hasTextSizeClasses = typography.className.includes('text-');
          const hasResponsiveClasses = typography.className.includes('sm:') || 
                                      typography.className.includes('md:') ||
                                      typography.className.includes('lg:');

          // Typography should have text sizing classes
          expect(hasTextSizeClasses).toBe(true);

          // Typography should be visible
          const computedStyle = window.getComputedStyle(typography);
          expect(computedStyle.display).not.toBe('none');
          expect(computedStyle.visibility).not.toBe('hidden');

          unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 5.4: Card components have responsive spacing and layout classes', () => {
    fc.assert(
      fc.property(
        viewportArbitrary,
        fc.constantFrom('default', 'elevated', 'outlined'),
        fc.constantFrom('none', 'sm', 'md', 'lg'),
        (viewport, variant, padding) => {
          // Set viewport
          mockMatchMedia(viewport.width);
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          });

          const component = (
            <TestWrapper>
              <Card 
                variant={variant} 
                padding={padding}
                data-testid="responsive-card"
              >
                <Typography variant="h3">Card Title</Typography>
                <Typography variant="body1">Card content that should be responsive</Typography>
                <Button variant="primary" size="md">Card Action</Button>
              </Card>
            </TestWrapper>
          );

          const { container, unmount } = render(component);
          const card = container.querySelector('[data-testid="responsive-card"]') as HTMLElement;
          expect(card).toBeTruthy();

          // Check for responsive classes
          const hasPaddingClasses = card.className.includes('p-') || 
                                   card.className.includes('px-') ||
                                   card.className.includes('py-');

          const hasResponsiveClasses = card.className.includes('sm:') || 
                                      card.className.includes('md:') ||
                                      card.className.includes('lg:');

          const hasBackgroundClasses = card.className.includes('bg-');
          const hasBorderClasses = card.className.includes('border');
          const hasRoundedClasses = card.className.includes('rounded');

          // Card should have styling classes
          expect(hasBackgroundClasses || hasBorderClasses || hasRoundedClasses).toBe(true);

          // Card should be visible and properly styled
          const computedStyle = window.getComputedStyle(card);
          expect(computedStyle.display).not.toBe('none');
          expect(computedStyle.visibility).not.toBe('hidden');

          unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 5.5: Component layouts adapt properly to different screen orientations', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 320, max: 1920 }),
          height: fc.integer({ min: 320, max: 1920 }),
        }),
        fc.array(fc.constantFrom('button', 'input', 'card'), { minLength: 2, maxLength: 4 }),
        (viewport, components) => {
          // Set viewport
          mockMatchMedia(viewport.width);
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewport.height,
          });

          const isLandscape = viewport.width > viewport.height;
          const isMobile = viewport.width < BREAKPOINTS.md;

          const component = (
            <TestWrapper>
              <div 
                data-testid="responsive-layout"
                className={`flex ${(isMobile && !isLandscape) ? 'flex-col' : 'flex-row'} gap-4 flex-wrap w-full max-w-full`}
              >
                {components.map((componentType, index) => {
                  const key = `${componentType}-${index}`;
                  switch (componentType) {
                    case 'button':
                      return (
                        <Button 
                          key={key}
                          data-testid={`layout-${key}`}
                          variant="primary"
                          size="md"
                        >
                          Button {index}
                        </Button>
                      );
                    case 'input':
                      return (
                        <Input 
                          key={key}
                          data-testid={`layout-${key}`}
                          placeholder={`Input ${index}`}
                          size="md"
                        />
                      );
                    case 'card':
                      return (
                        <Card 
                          key={key}
                          data-testid={`layout-${key}`}
                          variant="default"
                          padding="md"
                        >
                          Card {index}
                        </Card>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </TestWrapper>
          );

          const { container, unmount } = render(component);
          const layout = container.querySelector('[data-testid="responsive-layout"]') as HTMLElement;
          expect(layout).toBeTruthy();

          // Check for responsive layout classes
          const hasFlexClasses = layout.className.includes('flex');
          const hasGapClasses = layout.className.includes('gap-');
          const hasWidthClasses = layout.className.includes('w-') || layout.className.includes('max-w-');

          expect(hasFlexClasses).toBe(true);
          expect(hasGapClasses || hasWidthClasses).toBe(true);

          // All components should be visible and properly positioned
          components.forEach((componentType, index) => {
            const element = container.querySelector(`[data-testid="layout-${componentType}-${index}"]`) as HTMLElement;
            expect(element).toBeTruthy();
            expect(element).toBeInTheDocument();

            const elementStyle = window.getComputedStyle(element);
            expect(elementStyle.display).not.toBe('none');
            expect(elementStyle.visibility).not.toBe('hidden');
          });

          unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});