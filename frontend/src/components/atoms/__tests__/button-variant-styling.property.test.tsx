/**
 * **Feature: ui-system-enhancement, Property 2: Button variant styling correctness**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**
 * 
 * Property: For any button component instance, each variant (primary, secondary, outline, ghost, danger) 
 * should render with distinct styling characteristics, proper focus states, loading states, 
 * and appropriate touch targets for the specified size
 */

import React from 'react';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { Button, ButtonProps } from '../Button';

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock responsive utilities
jest.mock('@/lib/responsive', () => ({
  getTouchTargetClasses: jest.fn(() => ({
    mobile: 'min-h-[44px] px-4 py-2',
    desktop: 'md:min-h-[40px] md:px-4 md:py-2',
    combined: 'min-h-[44px] px-4 py-2 md:min-h-[40px] md:px-4 md:py-2',
  })),
  BUTTON_SIZES: {
    sm: {
      mobile: { height: 'min-h-[44px]', padding: 'px-3 py-2', text: 'text-sm', icon: 'w-4 h-4' },
      desktop: { height: 'min-h-[32px]', padding: 'px-3 py-1.5', text: 'text-sm', icon: 'w-4 h-4' },
    },
    md: {
      mobile: { height: 'min-h-[44px]', padding: 'px-4 py-2.5', text: 'text-base', icon: 'w-5 h-5' },
      desktop: { height: 'min-h-[40px]', padding: 'px-4 py-2', text: 'text-base', icon: 'w-5 h-5' },
    },
    lg: {
      mobile: { height: 'min-h-[48px]', padding: 'px-6 py-3', text: 'text-lg', icon: 'w-6 h-6' },
      desktop: { height: 'min-h-[48px]', padding: 'px-6 py-3', text: 'text-lg', icon: 'w-6 h-6' },
    },
  },
}));

// Generators for property-based testing
const buttonVariantArb = fc.constantFrom('primary', 'secondary', 'outline', 'ghost', 'danger');
const buttonSizeArb = fc.constantFrom('sm', 'md', 'lg');
const booleanArb = fc.boolean();
const buttonTextArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.includes('\n') && !s.includes('\t'));

// Helper functions for validation
const hasDistinctStyling = (element: HTMLElement, variant: ButtonProps['variant']): boolean => {
  const classList = Array.from(element.classList);
  
  switch (variant) {
    case 'primary':
      return classList.includes('bg-primary-600') && 
             classList.includes('text-white') && 
             classList.includes('border-primary-600');
    
    case 'secondary':
      return classList.includes('bg-secondary-600') && 
             classList.includes('text-white') && 
             classList.includes('border-secondary-600');
    
    case 'outline':
      return classList.includes('bg-transparent') && 
             classList.includes('text-primary-600') && 
             classList.includes('border-primary-600');
    
    case 'ghost':
      return classList.includes('bg-transparent') && 
             classList.includes('text-neutral-700') && 
             classList.includes('border-transparent');
    
    case 'danger':
      return classList.includes('bg-error-600') && 
             classList.includes('text-white') && 
             classList.includes('border-error-600');
    
    default:
      return false;
  }
};

const hasProperFocusStates = (element: HTMLElement): boolean => {
  const classList = Array.from(element.classList);
  return classList.includes('focus:outline-none') && 
         classList.includes('focus:ring-2') && 
         classList.includes('focus:ring-offset-2');
};

const hasProperTouchTargets = (element: HTMLElement, size: ButtonProps['size']): boolean => {
  const classList = Array.from(element.classList);
  
  switch (size) {
    case 'sm':
      return classList.includes('min-h-[44px]'); // WCAG compliant minimum
    case 'md':
      return classList.includes('min-h-[44px]'); // WCAG compliant minimum
    case 'lg':
      return classList.includes('min-h-[48px]'); // Larger touch target
    default:
      return classList.includes('min-h-[44px]'); // Default to medium
  }
};

const hasLoadingState = (element: HTMLElement, loading: boolean): boolean => {
  if (!loading) return true;
  
  const classList = Array.from(element.classList);
  const hasLoadingCursor = classList.includes('cursor-wait');
  const isDisabled = element.hasAttribute('disabled');
  const hasSpinner = element.querySelector('svg.animate-spin') !== null;
  
  return hasLoadingCursor && isDisabled && hasSpinner;
};

const hasProperInteractionStates = (element: HTMLElement): boolean => {
  const classList = Array.from(element.classList);
  return classList.includes('transition-all') && 
         classList.includes('duration-200') && 
         classList.includes('ease-out');
};

const hasProperDisabledState = (element: HTMLElement, disabled: boolean): boolean => {
  if (!disabled) return true;
  
  const classList = Array.from(element.classList);
  const isDisabled = element.hasAttribute('disabled');
  const hasDisabledStyles = classList.includes('disabled:opacity-50') && 
                           classList.includes('disabled:cursor-not-allowed');
  
  return isDisabled && hasDisabledStyles;
};

describe('Button Variant Styling Property Tests', () => {
  // Clean up after each test to prevent DOM pollution
  afterEach(() => {
    cleanup();
  });

  it('Property 2.1: All button variants render with distinct styling characteristics', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        (variant, size, text) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent(text);
          
          // Verify button exists and has distinct styling for the variant
          expect(hasDistinctStyling(button!, variant)).toBe(true);
          
          // Verify proper base styling
          expect(button).toHaveClass('inline-flex items-center justify-center');
          expect(button).toHaveClass('rounded-lg font-semibold');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.2: All button variants have proper focus states for accessibility', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        (variant, size, text) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent(text);
          
          // Verify proper focus states
          expect(hasProperFocusStates(button!)).toBe(true);
          
          // Verify variant-specific focus ring colors
          const classList = Array.from(button!.classList);
          switch (variant) {
            case 'primary':
              expect(classList.includes('focus:ring-primary-500')).toBe(true);
              break;
            case 'secondary':
              expect(classList.includes('focus:ring-secondary-500')).toBe(true);
              break;
            case 'outline':
              expect(classList.includes('focus:ring-primary-500')).toBe(true);
              break;
            case 'ghost':
              expect(classList.includes('focus:ring-neutral-500')).toBe(true);
              break;
            case 'danger':
              expect(classList.includes('focus:ring-error-500')).toBe(true);
              break;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.3: All button sizes provide appropriate touch targets', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        (variant, size, text) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent(text);
          
          // Verify proper touch targets for accessibility
          expect(hasProperTouchTargets(button!, size)).toBe(true);
          
          // Verify size-specific styling
          const classList = Array.from(button!.classList);
          switch (size) {
            case 'sm':
              expect(classList.some(cls => cls.includes('px-3'))).toBe(true);
              expect(classList.includes('text-sm')).toBe(true);
              break;
            case 'md':
              expect(classList.some(cls => cls.includes('px-4'))).toBe(true);
              expect(classList.includes('text-base')).toBe(true);
              break;
            case 'lg':
              expect(classList.some(cls => cls.includes('px-6'))).toBe(true);
              expect(classList.includes('text-lg')).toBe(true);
              break;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.4: Loading states render correctly with spinner and disabled interaction', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        booleanArb,
        (variant, size, text, loading) => {
          const { container } = render(
            <Button variant={variant} size={size} loading={loading}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          
          // Verify loading state behavior
          expect(hasLoadingState(button!, loading)).toBe(true);
          
          if (loading) {
            // Verify spinner is present and animated
            const spinner = button!.querySelector('svg.animate-spin');
            expect(spinner).toBeInTheDocument();
            expect(spinner).toHaveClass('h-5 w-5 text-current');
            
            // Verify content is hidden when loading
            const contentContainer = button!.querySelector('div.invisible');
            expect(contentContainer).toBeInTheDocument();
            
            // Verify button is disabled
            expect(button).toBeDisabled();
            expect(button).toHaveClass('cursor-wait');
          } else {
            // Verify no spinner when not loading
            const spinner = button!.querySelector('svg.animate-spin');
            expect(spinner).not.toBeInTheDocument();
            
            // Verify content is visible
            const contentContainer = button!.querySelector('div.invisible');
            expect(contentContainer).not.toBeInTheDocument();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.5: Disabled states render correctly with proper styling and interaction prevention', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        booleanArb,
        (variant, size, text, disabled) => {
          const { container } = render(
            <Button variant={variant} size={size} disabled={disabled}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent(text);
          
          // Verify disabled state behavior
          expect(hasProperDisabledState(button!, disabled)).toBe(true);
          
          if (disabled) {
            expect(button).toBeDisabled();
            expect(button).toHaveClass('disabled:opacity-50');
            expect(button).toHaveClass('disabled:cursor-not-allowed');
            expect(button).toHaveClass('disabled:transform-none');
          } else {
            expect(button).not.toBeDisabled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.6: All button variants have proper interaction states and animations', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        (variant, size, text) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent(text);
          
          // Verify proper interaction states
          expect(hasProperInteractionStates(button!)).toBe(true);
          
          // Verify hover and active states are present
          const classList = Array.from(button!.classList);
          const hasHoverStates = classList.some(cls => cls.startsWith('hover:'));
          const hasActiveStates = classList.some(cls => cls.startsWith('active:'));
          
          expect(hasHoverStates).toBe(true);
          expect(hasActiveStates).toBe(true);
          
          // Verify shadow and transform effects for non-ghost variants
          if (variant !== 'ghost' && variant !== 'outline') {
            expect(classList.includes('shadow-soft')).toBe(true);
            expect(classList.includes('hover:shadow-medium')).toBe(true);
            expect(classList.includes('hover:-translate-y-0.5')).toBe(true);
            expect(classList.includes('active:translate-y-0')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.7: Full width buttons expand to container width', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        booleanArb,
        (variant, size, text, fullWidth) => {
          const { container } = render(
            <Button variant={variant} size={size} fullWidth={fullWidth}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent(text);
          
          if (fullWidth) {
            expect(button).toHaveClass('w-full');
          } else {
            expect(button).not.toHaveClass('w-full');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.8: Button icons render correctly with proper spacing and sizing', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        booleanArb,
        booleanArb,
        (variant, size, text, hasLeftIcon, hasRightIcon) => {
          const LeftIcon = () => <span data-testid="left-icon">←</span>;
          const RightIcon = () => <span data-testid="right-icon">→</span>;
          
          const { container } = render(
            <Button 
              variant={variant} 
              size={size}
              leftIcon={hasLeftIcon ? <LeftIcon /> : undefined}
              rightIcon={hasRightIcon ? <RightIcon /> : undefined}
            >
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          // Check that button contains the text (may have icons too)
          expect(button!.textContent).toContain(text.trim());
          
          // Verify button has proper gap for icons
          expect(button).toHaveClass('gap-2');
          
          // Verify icons are present when specified
          if (hasLeftIcon) {
            const leftIcon = container.querySelector('[data-testid="left-icon"]');
            expect(leftIcon).toBeInTheDocument();
            expect(leftIcon!.parentElement).toHaveClass('flex-shrink-0');
            expect(leftIcon!.parentElement).toHaveAttribute('aria-hidden', 'true');
          }
          
          if (hasRightIcon) {
            const rightIcon = container.querySelector('[data-testid="right-icon"]');
            expect(rightIcon).toBeInTheDocument();
            expect(rightIcon!.parentElement).toHaveClass('flex-shrink-0');
            expect(rightIcon!.parentElement).toHaveAttribute('aria-hidden', 'true');
          }
          
          // Verify text content is always present
          expect(button!.textContent).toContain(text.trim());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.9: Button variants maintain visual hierarchy and contrast', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        (variant, size, text) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent(text);
          const classList = Array.from(button!.classList);
          
          // Verify proper visual hierarchy through styling
          switch (variant) {
            case 'primary':
              // Primary should have highest visual weight
              expect(classList.includes('bg-primary-600')).toBe(true);
              expect(classList.includes('text-white')).toBe(true);
              expect(classList.includes('shadow-soft')).toBe(true);
              break;
              
            case 'secondary':
              // Secondary should have medium visual weight
              expect(classList.includes('bg-secondary-600')).toBe(true);
              expect(classList.includes('text-white')).toBe(true);
              expect(classList.includes('shadow-soft')).toBe(true);
              break;
              
            case 'outline':
              // Outline should have lower visual weight
              expect(classList.includes('bg-transparent')).toBe(true);
              expect(classList.includes('text-primary-600')).toBe(true);
              expect(classList.includes('border-primary-600')).toBe(true);
              break;
              
            case 'ghost':
              // Ghost should have lowest visual weight
              expect(classList.includes('bg-transparent')).toBe(true);
              expect(classList.includes('text-neutral-700')).toBe(true);
              expect(classList.includes('border-transparent')).toBe(true);
              break;
              
            case 'danger':
              // Danger should have high visual weight with error colors
              expect(classList.includes('bg-error-600')).toBe(true);
              expect(classList.includes('text-white')).toBe(true);
              expect(classList.includes('shadow-soft')).toBe(true);
              break;
          }
          
          // All variants should have proper border styling
          expect(classList.includes('border-2')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.10: Button component maintains accessibility attributes', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        buttonTextArb,
        booleanArb,
        booleanArb,
        (variant, size, text, loading, disabled) => {
          const { container } = render(
            <Button variant={variant} size={size} loading={loading} disabled={disabled}>
              {text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          // Normalize whitespace for comparison since browser normalizes multiple spaces
          const normalizedText = text.replace(/\s+/g, ' ').trim();
          const buttonText = button!.textContent?.replace(/\s+/g, ' ').trim() || '';
          expect(buttonText).toBe(normalizedText);
          
          // Verify proper button type
          expect(button).toHaveAttribute('type', 'button');
          
          // Verify proper disabled state
          if (disabled || loading) {
            expect(button).toBeDisabled();
          } else {
            expect(button).not.toBeDisabled();
          }
          
          // Verify spinner has proper accessibility attributes when loading
          if (loading) {
            const spinner = button!.querySelector('svg');
            expect(spinner).toHaveAttribute('aria-hidden', 'true');
          }
          
          // Verify button is focusable when not disabled
          if (!disabled && !loading) {
            expect(button).not.toHaveAttribute('tabindex', '-1');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});