/**
 * Responsive Container Component
 * Provides consistent responsive behavior and spacing across the application
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { GRID_SYSTEMS, getResponsiveSpacing } from '@/lib/responsive';

export interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'mobile' | 'tablet' | 'desktop' | 'full';
  spacing?: 'container' | 'section' | 'component';
  children: React.ReactNode;
}

const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ className, size = 'desktop', spacing = 'container', children, ...props }, ref) => {
    // Container size configurations
    const sizeClasses = {
      mobile: 'max-w-sm mx-auto px-4',
      tablet: 'max-w-3xl mx-auto px-4 md:px-6',
      desktop: 'max-w-7xl mx-auto px-4 md:px-6 lg:px-8',
      full: 'w-full px-4 md:px-6 lg:px-8',
    };

    // Responsive spacing
    const spacingClasses = spacing ? getResponsiveSpacing(spacing) : '';

    return (
      <div
        className={cn(
          sizeClasses[size],
          spacingClasses,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveContainer.displayName = 'ResponsiveContainer';

export { ResponsiveContainer };