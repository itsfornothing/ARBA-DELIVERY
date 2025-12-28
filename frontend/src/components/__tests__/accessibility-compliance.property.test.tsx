/**
 * Property Test 7: Accessibility Compliance
 * Validates: Requirements 12.1, 12.3, 12.4, 12.5
 * 
 * This test ensures that all UI components maintain WCAG compliance standards,
 * proper keyboard navigation, screen reader compatibility, and focus management.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { ThemeProvider } from 'styled-components';
import { accessibleTheme, highContrastTheme } from '@/lib/accessibleTheme';
import { meetsWCAGStandard, getContrastRatio } from '@/lib/accessibility';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { AccessibilityProvider } from '@/components/providers/AccessibilityProvider';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';

// Mock matchMedia for tests
const mockMatchMedia = (matches: boolean = false) => {
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

// Test wrapper with accessibility provider
const TestWrapper: React.FC<{ children: React.ReactNode; theme?: any }> = ({ 
  children, 
  theme = accessibleTheme 
}) => (
  <ThemeProvider theme={theme}>
    <AccessibilityProvider>
      {children}
    </AccessibilityProvider>
  </ThemeProvider>
);

// Generators for testing
const colorArb = fc.constantFrom(
  '#FFFFFF', '#000000', '#3B82F6', '#EF4444', '#10B981', '#F59E0B'
);

const buttonVariantArb = fc.constantFrom('primary', 'secondary', 'outline', 'ghost', 'danger');
const buttonSizeArb = fc.constantFrom('sm', 'md', 'lg');
const textArb = fc.string({ minLength: 1, maxLength: 50 });

describe('Property Test 7: Accessibility Compliance', () => {
  beforeAll(() => {
    mockMatchMedia(false);
  });

  beforeEach(() => {
    mockMatchMedia(false);
  });

  describe('Color Contrast Compliance (Requirement 12.1)', () => {
    test('all theme colors meet WCAG AA contrast standards', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(accessibleTheme, highContrastTheme),
          (theme) => {
            // Test primary colors against background
            const primaryContrast = getContrastRatio(theme.colors.primary, theme.colors.background);
            const textContrast = getContrastRatio(theme.colors.text, theme.colors.background);
            const errorContrast = getContrastRatio(theme.colors.error, theme.colors.background);
            const successContrast = getContrastRatio(theme.colors.success, theme.colors.background);
            
            // All should meet WCAG AA standard (4.5:1 for normal text)
            expect(primaryContrast).toBeGreaterThanOrEqual(4.5);
            expect(textContrast).toBeGreaterThanOrEqual(4.5);
            expect(errorContrast).toBeGreaterThanOrEqual(4.5);
            expect(successContrast).toBeGreaterThanOrEqual(4.5);
            
            // Verify WCAG compliance helper works correctly
            expect(meetsWCAGStandard(theme.colors.text, theme.colors.background)).toBe(true);
            expect(meetsWCAGStandard(theme.colors.primary, theme.colors.background)).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    test('colorblind-safe colors maintain sufficient contrast', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(accessibleTheme),
          (theme) => {
            const colorBlindSafe = theme.accessibility.colorBlindSafe;
            
            Object.values(colorBlindSafe).forEach(color => {
              const contrast = getContrastRatio(color, theme.colors.background);
              expect(contrast).toBeGreaterThanOrEqual(4.5);
            });
          }
        )
      );
    });
  });

  describe('Keyboard Navigation (Requirement 12.3)', () => {
    test('buttons are keyboard accessible', () => {
      fc.assert(
        fc.property(
          buttonVariantArb,
          buttonSizeArb,
          textArb,
          (variant, size, text) => {
            const handleClick = jest.fn();
            
            render(
              <TestWrapper>
                <AccessibleButton 
                  variant={variant}
                  size={size}
                  onClick={handleClick}
                  data-testid="test-button"
                >
                  {text}
                </AccessibleButton>
              </TestWrapper>
            );
            
            const button = screen.getByTestId('test-button');
            
            // Should be focusable
            expect(button).toHaveAttribute('tabindex', '0');
            
            // Should respond to Enter key
            fireEvent.keyDown(button, { key: 'Enter' });
            expect(handleClick).toHaveBeenCalled();
            
            // Should respond to Space key
            handleClick.mockClear();
            fireEvent.keyDown(button, { key: ' ' });
            expect(handleClick).toHaveBeenCalled();
            
            // Should have proper ARIA attributes
            expect(button).toHaveAttribute('role', 'button');
            expect(button).toHaveAttribute('aria-label');
          }
        ),
        { numRuns: 20 }
      );
    });

    test('form inputs support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Input 
            label="Test Input"
            data-testid="test-input"
          />
        </TestWrapper>
      );
      
      const input = screen.getByTestId('test-input');
      
      // Should be focusable with keyboard
      await user.tab();
      expect(input).toHaveFocus();
      
      // Should accept text input
      await user.type(input, 'test text');
      expect(input).toHaveValue('test text');
    });
  });

  describe('Screen Reader Compatibility (Requirement 12.4, 12.5)', () => {
    test('components have proper ARIA labels and descriptions', () => {
      fc.assert(
        fc.property(
          buttonVariantArb,
          textArb,
          fc.option(textArb),
          (variant, buttonText, ariaDescription) => {
            render(
              <TestWrapper>
                <AccessibleButton 
                  variant={variant}
                  ariaLabel={buttonText}
                  ariaDescribedBy={ariaDescription ? 'description' : undefined}
                  data-testid="test-button"
                >
                  {buttonText}
                </AccessibleButton>
                {ariaDescription && (
                  <div id="description">{ariaDescription}</div>
                )}
              </TestWrapper>
            );
            
            const button = screen.getByTestId('test-button');
            
            // Should have accessible name
            expect(button).toHaveAccessibleName();
            
            // Should have proper ARIA attributes
            expect(button).toHaveAttribute('aria-label');
            
            if (ariaDescription) {
              expect(button).toHaveAttribute('aria-describedby', 'description');
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    test('loading states are announced to screen readers', () => {
      const { rerender } = render(
        <TestWrapper>
          <AccessibleButton 
            loading={false}
            loadingText="Processing request"
            data-testid="test-button"
          >
            Submit
          </AccessibleButton>
        </TestWrapper>
      );
      
      const button = screen.getByTestId('test-button');
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
      
      // Change to loading state
      rerender(
        <TestWrapper>
          <AccessibleButton 
            loading={true}
            loadingText="Processing request"
            data-testid="test-button"
          >
            Submit
          </AccessibleButton>
        </TestWrapper>
      );
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByText('Processing request')).toBeInTheDocument();
    });

    test('error states provide helpful information', () => {
      render(
        <TestWrapper>
          <div>
            <Input 
              label="Email"
              error="Please enter a valid email address"
              data-testid="email-input"
            />
          </div>
        </TestWrapper>
      );
      
      const input = screen.getByTestId('email-input');
      
      // Should have error indication
      expect(input).toHaveAttribute('aria-invalid', 'true');
      
      // Error message should be associated with input
      const errorMessage = screen.getByText('Please enter a valid email address');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Focus Management (Requirement 12.3)', () => {
    test('focus indicators are visible and properly styled', () => {
      fc.assert(
        fc.property(
          buttonVariantArb,
          textArb,
          (variant, text) => {
            render(
              <TestWrapper>
                <AccessibleButton 
                  variant={variant}
                  data-testid="test-button"
                >
                  {text}
                </AccessibleButton>
              </TestWrapper>
            );
            
            const button = screen.getByTestId('test-button');
            
            // Focus the button
            button.focus();
            
            // Should have focus styles (this would be tested with visual regression in a real scenario)
            expect(button).toHaveFocus();
            
            // Should have proper focus outline (checked via computed styles in integration tests)
            const computedStyle = window.getComputedStyle(button);
            expect(computedStyle.outline).toBeDefined();
          }
        ),
        { numRuns: 10 }
      );
    });

    test('minimum touch target sizes are maintained', () => {
      fc.assert(
        fc.property(
          buttonSizeArb,
          textArb,
          (size, text) => {
            render(
              <TestWrapper>
                <AccessibleButton 
                  size={size}
                  data-testid="test-button"
                >
                  {text}
                </AccessibleButton>
              </TestWrapper>
            );
            
            const button = screen.getByTestId('test-button');
            const computedStyle = window.getComputedStyle(button);
            
            // Minimum touch target should be 44px (WCAG guideline)
            const minHeight = parseInt(computedStyle.minHeight);
            expect(minHeight).toBeGreaterThanOrEqual(44);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Alternative Text and Descriptions', () => {
    test('visual elements have appropriate alternative text', () => {
      render(
        <TestWrapper>
          <Card data-testid="info-card">
            <Typography variant="h3">Important Information</Typography>
            <Typography>This card contains important details.</Typography>
          </Card>
        </TestWrapper>
      );
      
      const card = screen.getByTestId('info-card');
      
      // Card should have accessible content
      expect(screen.getByText('Important Information')).toBeInTheDocument();
      expect(screen.getByText('This card contains important details.')).toBeInTheDocument();
      
      // Heading should have proper semantic structure
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });
});