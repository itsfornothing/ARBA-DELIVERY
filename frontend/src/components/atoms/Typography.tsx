'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getResponsiveTypography, MOBILE_TYPOGRAPHY_SCALE } from '@/lib/responsive';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'muted';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  lineHeight?: 'tight' | 'normal' | 'relaxed';
  as?: keyof React.JSX.IntrinsicElements;
  children: React.ReactNode;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ 
    className, 
    variant = 'body1', 
    color = 'neutral', 
    weight, 
    align = 'left', 
    size,
    lineHeight,
    as,
    children, 
    ...props 
  }, ref) => {
    // Typography variant configurations with responsive sizing
    const variants = {
      h1: { 
        element: 'h1', 
        styles: getResponsiveTypography('h1') + ' font-bold leading-tight tracking-tight',
        defaultColor: 'neutral',
        spacing: 'mb-6'
      },
      h2: { 
        element: 'h2', 
        styles: getResponsiveTypography('h2') + ' font-bold leading-tight tracking-tight',
        defaultColor: 'neutral',
        spacing: 'mb-5'
      },
      h3: { 
        element: 'h3', 
        styles: getResponsiveTypography('h3') + ' font-semibold leading-tight tracking-tight',
        defaultColor: 'neutral',
        spacing: 'mb-4'
      },
      h4: { 
        element: 'h4', 
        styles: getResponsiveTypography('h4') + ' font-semibold leading-tight',
        defaultColor: 'neutral',
        spacing: 'mb-4'
      },
      h5: { 
        element: 'h5', 
        styles: getResponsiveTypography('h5') + ' font-medium leading-tight',
        defaultColor: 'neutral',
        spacing: 'mb-3'
      },
      h6: { 
        element: 'h6', 
        styles: getResponsiveTypography('h6') + ' font-medium leading-tight',
        defaultColor: 'neutral',
        spacing: 'mb-3'
      },
      body1: { 
        element: 'p', 
        styles: getResponsiveTypography('body1') + ' leading-relaxed',
        defaultColor: 'neutral',
        spacing: 'mb-4'
      },
      body2: { 
        element: 'p', 
        styles: getResponsiveTypography('body2') + ' leading-relaxed',
        defaultColor: 'neutral',
        spacing: 'mb-3'
      },
      caption: { 
        element: 'span', 
        styles: getResponsiveTypography('caption') + ' leading-normal',
        defaultColor: 'muted',
        spacing: ''
      },
      overline: { 
        element: 'span', 
        styles: getResponsiveTypography('overline') + ' font-medium uppercase tracking-wide leading-normal',
        defaultColor: 'muted',
        spacing: ''
      },
    };

    // Color mappings using the enhanced theme colors
    const colors = {
      primary: 'text-primary-700 dark:text-primary-300',
      secondary: 'text-secondary-700 dark:text-secondary-300',
      neutral: 'text-neutral-900 dark:text-neutral-100',
      success: 'text-success-700 dark:text-success-300',
      warning: 'text-warning-700 dark:text-warning-300',
      error: 'text-error-700 dark:text-error-300',
      info: 'text-info-700 dark:text-info-300',
      muted: 'text-neutral-600 dark:text-neutral-400',
    };

    // Font weight mappings
    const weights = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    // Text alignment mappings
    const alignments = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    };

    // Custom size mappings (overrides variant default)
    const sizes = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    };

    // Line height mappings (overrides variant default)
    const lineHeights = {
      tight: 'leading-tight',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
    };

    const variantConfig = variants[variant] || variants.body1;
    const Element = (as || variantConfig.element) as any;
    const effectiveColor = color || variantConfig.defaultColor;
    
    return (
      <Element
        className={cn(
          // Base font family
          'font-sans',
          // Variant styles (can be overridden by size/lineHeight props)
          size ? sizes[size] : variantConfig.styles,
          lineHeight && lineHeights[lineHeight],
          // Color
          colors[effectiveColor],
          // Weight override
          weight && weights[weight],
          // Alignment
          alignments[align],
          // Default spacing (can be overridden by className)
          variantConfig.spacing,
          // Custom className
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Typography.displayName = 'Typography';

export { Typography };