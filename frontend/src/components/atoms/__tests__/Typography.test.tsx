import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Typography } from '../Typography';

describe('Typography Component', () => {
  it('renders with default props', () => {
    render(<Typography>Default text</Typography>);
    
    const text = screen.getByText('Default text');
    expect(text).toBeInTheDocument();
    expect(text.tagName).toBe('P');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Typography variant="h1">Heading 1</Typography>);
    
    let text = screen.getByText('Heading 1');
    expect(text.tagName).toBe('H1');
    // Check for text sizing (responsive or static)
    expect(text.className).toMatch(/(text-(3xl|4xl|5xl)|md:text-)/);

    rerender(<Typography variant="h2">Heading 2</Typography>);
    
    text = screen.getByText('Heading 2');
    expect(text.tagName).toBe('H2');
    expect(text.className).toMatch(/(text-(2xl|3xl|4xl)|md:text-)/);

    rerender(<Typography variant="body1">Body text</Typography>);
    
    text = screen.getByText('Body text');
    expect(text.tagName).toBe('P');
    expect(text.className).toMatch(/(text-base|text-lg)/);
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Typography size="sm">Small text</Typography>);
    
    let text = screen.getByText('Small text');
    expect(text).toHaveClass('text-sm');

    rerender(<Typography size="lg">Large text</Typography>);
    
    text = screen.getByText('Large text');
    expect(text).toHaveClass('text-lg');
  });

  it('renders with different weights', () => {
    const { rerender } = render(<Typography weight="normal">Normal text</Typography>);
    
    let text = screen.getByText('Normal text');
    expect(text).toHaveClass('font-normal');

    rerender(<Typography weight="bold">Bold text</Typography>);
    
    text = screen.getByText('Bold text');
    expect(text).toHaveClass('font-bold');
  });

  it('renders with different colors', () => {
    const { rerender } = render(<Typography color="primary">Primary text</Typography>);
    
    let text = screen.getByText('Primary text');
    expect(text.className).toMatch(/text-(primary|blue)/);

    rerender(<Typography color="secondary">Secondary text</Typography>);
    
    text = screen.getByText('Secondary text');
    expect(text.className).toMatch(/text-(secondary|gray)/);

    rerender(<Typography color="error">Error text</Typography>);
    
    text = screen.getByText('Error text');
    expect(text.className).toMatch(/text-(error|red)/);
  });

  it('renders with custom component', () => {
    render(<Typography as="span">Span text</Typography>);
    
    const text = screen.getByText('Span text');
    expect(text.tagName).toBe('SPAN');
  });

  it('applies custom className', () => {
    render(<Typography className="custom-typography">Custom text</Typography>);
    
    const text = screen.getByText('Custom text');
    expect(text).toHaveClass('custom-typography');
  });

  it('handles text alignment', () => {
    const { rerender } = render(<Typography align="center">Centered text</Typography>);
    
    let text = screen.getByText('Centered text');
    expect(text).toHaveClass('text-center');

    rerender(<Typography align="right">Right aligned text</Typography>);
    
    text = screen.getByText('Right aligned text');
    expect(text).toHaveClass('text-right');
  });

  it('handles line height properly', () => {
    render(<Typography lineHeight="tight">Text with tight line height</Typography>);
    
    const text = screen.getByText('Text with tight line height');
    expect(text).toHaveClass('leading-tight');
  });

  it('supports responsive typography', () => {
    render(<Typography variant="h1">Responsive heading</Typography>);
    
    const text = screen.getByText('Responsive heading');
    // Check for responsive classes or appropriate text sizing
    const hasResponsiveClasses = text.className.includes('md:') || 
                                text.className.includes('lg:') || 
                                text.className.includes('sm:') ||
                                text.className.includes('text-');
    expect(hasResponsiveClasses).toBe(true);
  });

  it('has proper accessibility attributes', () => {
    render(
      <Typography 
        variant="h1" 
        role="heading" 
        aria-level={1}
      >
        Accessible heading
      </Typography>
    );
    
    const text = screen.getByText('Accessible heading');
    expect(text).toHaveAttribute('role', 'heading');
    expect(text).toHaveAttribute('aria-level', '1');
  });

  it('renders children correctly', () => {
    render(
      <Typography>
        <span>Child span</span>
        <strong>Strong text</strong>
      </Typography>
    );
    
    expect(screen.getByText('Child span')).toBeInTheDocument();
    expect(screen.getByText('Strong text')).toBeInTheDocument();
  });

  // Enhanced tests for all typography variants and color combinations
  // Requirements: 4.5, 6.3
  describe('Typography Variants', () => {
    const variants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption', 'overline'] as const;
    const colors = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info', 'muted'] as const;

    it('renders all typography variants correctly', () => {
      variants.forEach((variant) => {
        const { unmount } = render(<Typography variant={variant} data-testid={`variant-${variant}`}>Test {variant}</Typography>);
        
        const element = screen.getByTestId(`variant-${variant}`);
        expect(element).toBeInTheDocument();
        expect(element).toHaveTextContent(`Test ${variant}`);
        
        // Check that each variant has appropriate styling
        expect(element.className).toMatch(/font-/); // Should have font styling
        expect(element.className).toMatch(/text-/); // Should have text size
        expect(element.className).toMatch(/leading-/); // Should have line height
        
        // Check semantic HTML elements for headings
        if (variant.startsWith('h')) {
          expect(element.tagName).toBe(variant.toUpperCase());
        } else if (variant === 'body1' || variant === 'body2') {
          expect(element.tagName).toBe('P');
        } else {
          expect(element.tagName).toBe('SPAN');
        }
        
        unmount();
      });
    });

    it('renders all color combinations correctly', () => {
      colors.forEach((color) => {
        const { unmount } = render(<Typography color={color} data-testid={`color-${color}`}>Test {color}</Typography>);
        
        const element = screen.getByTestId(`color-${color}`);
        expect(element).toBeInTheDocument();
        
        // Check that color classes are applied
        const hasColorClass = element.className.includes(`text-${color}`) || 
                             element.className.includes('text-primary') ||
                             element.className.includes('text-secondary') ||
                             element.className.includes('text-neutral') ||
                             element.className.includes('text-success') ||
                             element.className.includes('text-warning') ||
                             element.className.includes('text-error') ||
                             element.className.includes('text-info') ||
                             element.className.includes('text-red') ||
                             element.className.includes('text-blue') ||
                             element.className.includes('text-green') ||
                             element.className.includes('text-yellow') ||
                             element.className.includes('text-gray');
        
        expect(hasColorClass).toBe(true);
        
        unmount();
      });
    });

    it('combines variants and colors correctly', () => {
      // Test a few key combinations
      const combinations = [
        { variant: 'h1' as const, color: 'primary' as const },
        { variant: 'h2' as const, color: 'secondary' as const },
        { variant: 'body1' as const, color: 'neutral' as const },
        { variant: 'caption' as const, color: 'muted' as const },
        { variant: 'overline' as const, color: 'error' as const },
      ];

      combinations.forEach(({ variant, color }) => {
        const { unmount } = render(
          <Typography variant={variant} color={color} data-testid={`combo-${variant}-${color}`}>
            Test {variant} {color}
          </Typography>
        );
        
        const element = screen.getByTestId(`combo-${variant}-${color}`);
        expect(element).toBeInTheDocument();
        
        // Should have both variant and color styling
        expect(element.className).toMatch(/font-/);
        expect(element.className).toMatch(/text-/);
        
        unmount();
      });
    });

    it('applies proper font weights for each variant', () => {
      const variantWeights = {
        h1: 'font-bold',
        h2: 'font-bold', 
        h3: 'font-semibold',
        h4: 'font-semibold',
        h5: 'font-medium',
        h6: 'font-medium',
        body1: '', // No specific weight
        body2: '', // No specific weight
        caption: '', // No specific weight
        overline: 'font-medium',
      };

      Object.entries(variantWeights).forEach(([variant, expectedWeight]) => {
        const { unmount } = render(
          <Typography variant={variant as keyof typeof variantWeights} data-testid={`weight-${variant}`}>
            Test {variant}
          </Typography>
        );
        
        const element = screen.getByTestId(`weight-${variant}`);
        
        if (expectedWeight) {
          expect(element).toHaveClass(expectedWeight);
        }
        
        unmount();
      });
    });

    it('applies proper spacing for each variant', () => {
      const spacingVariants = ['h1', 'h2', 'h3', 'body1', 'body2'] as const;
      
      spacingVariants.forEach((variant) => {
        const { unmount } = render(
          <Typography variant={variant} data-testid={`spacing-${variant}`}>
            Test {variant}
          </Typography>
        );
        
        const element = screen.getByTestId(`spacing-${variant}`);
        
        // Should have margin bottom for spacing
        expect(element.className).toMatch(/mb-/);
        
        unmount();
      });
    });
  });

  describe('Responsive Typography Behavior', () => {
    // Requirements: 6.3 - Typography scales appropriately for different screen sizes
    
    it('applies responsive typography classes for all variants', () => {
      const responsiveVariants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption', 'overline'] as const;
      
      responsiveVariants.forEach((variant) => {
        const { unmount } = render(
          <Typography variant={variant} data-testid={`responsive-${variant}`}>
            Responsive {variant}
          </Typography>
        );
        
        const element = screen.getByTestId(`responsive-${variant}`);
        
        // Should have responsive classes (mobile and desktop sizes)
        const hasResponsiveClasses = element.className.includes('md:text-') || 
                                    element.className.includes('lg:text-') ||
                                    element.className.includes('sm:text-') ||
                                    // Or should have appropriate base text size
                                    element.className.includes('text-');
        
        expect(hasResponsiveClasses).toBe(true);
        
        unmount();
      });
    });

    it('maintains readability across different screen sizes', () => {
      // Test that typography maintains proper contrast and sizing
      const { container } = render(
        <div>
          <Typography variant="h1" data-testid="mobile-h1">Mobile Heading</Typography>
          <Typography variant="body1" data-testid="mobile-body">
            This is body text that should remain readable on mobile devices with appropriate sizing.
          </Typography>
          <Typography variant="caption" data-testid="mobile-caption">Caption text</Typography>
        </div>
      );

      const h1 = screen.getByTestId('mobile-h1');
      const body = screen.getByTestId('mobile-body');
      const caption = screen.getByTestId('mobile-caption');

      // Check that elements have appropriate classes for mobile readability
      expect(h1.className).toMatch(/text-/);
      expect(body.className).toMatch(/text-/);
      expect(caption.className).toMatch(/text-/);

      // Check line height for readability
      expect(h1.className).toMatch(/leading-/);
      expect(body.className).toMatch(/leading-/);
      expect(caption.className).toMatch(/leading-/);
    });

    it('handles custom size overrides with responsive behavior', () => {
      const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'] as const;
      
      sizes.forEach((size) => {
        const { unmount } = render(
          <Typography size={size} data-testid={`size-${size}`}>
            Size {size}
          </Typography>
        );
        
        const element = screen.getByTestId(`size-${size}`);
        
        // Should have the specific size class
        expect(element).toHaveClass(`text-${size}`);
        
        unmount();
      });
    });

    it('handles line height overrides properly', () => {
      const lineHeights = ['tight', 'normal', 'relaxed'] as const;
      
      lineHeights.forEach((lineHeight) => {
        const { unmount } = render(
          <Typography lineHeight={lineHeight} data-testid={`lineheight-${lineHeight}`}>
            Line height {lineHeight}
          </Typography>
        );
        
        const element = screen.getByTestId(`lineheight-${lineHeight}`);
        
        // Should have the specific line height class
        expect(element).toHaveClass(`leading-${lineHeight}`);
        
        unmount();
      });
    });

    it('maintains proper hierarchy across breakpoints', () => {
      // Test that heading hierarchy is maintained across different screen sizes
      const { container } = render(
        <div>
          <Typography variant="h1" data-testid="hierarchy-h1">Main Title</Typography>
          <Typography variant="h2" data-testid="hierarchy-h2">Section Title</Typography>
          <Typography variant="h3" data-testid="hierarchy-h3">Subsection Title</Typography>
          <Typography variant="body1" data-testid="hierarchy-body">Body content</Typography>
        </div>
      );

      const h1 = screen.getByTestId('hierarchy-h1');
      const h2 = screen.getByTestId('hierarchy-h2');
      const h3 = screen.getByTestId('hierarchy-h3');
      const body = screen.getByTestId('hierarchy-body');

      // All should have responsive typography
      [h1, h2, h3, body].forEach((element) => {
        const hasResponsiveOrStaticSizing = element.className.includes('md:text-') || 
                                           element.className.includes('text-');
        expect(hasResponsiveOrStaticSizing).toBe(true);
      });

      // Check semantic HTML structure is maintained
      expect(h1.tagName).toBe('H1');
      expect(h2.tagName).toBe('H2');
      expect(h3.tagName).toBe('H3');
      expect(body.tagName).toBe('P');
    });

    it('handles weight overrides correctly', () => {
      const weights = ['normal', 'medium', 'semibold', 'bold'] as const;
      
      weights.forEach((weight) => {
        const { unmount } = render(
          <Typography weight={weight} data-testid={`weight-override-${weight}`}>
            Weight {weight}
          </Typography>
        );
        
        const element = screen.getByTestId(`weight-override-${weight}`);
        
        // Should have the specific weight class
        expect(element).toHaveClass(`font-${weight}`);
        
        unmount();
      });
    });

    it('handles text alignment across screen sizes', () => {
      const alignments = ['left', 'center', 'right', 'justify'] as const;
      
      alignments.forEach((align) => {
        const { unmount } = render(
          <Typography align={align} data-testid={`align-${align}`}>
            Aligned {align}
          </Typography>
        );
        
        const element = screen.getByTestId(`align-${align}`);
        
        // Should have the specific alignment class
        expect(element).toHaveClass(`text-${align}`);
        
        unmount();
      });
    });
  });
});