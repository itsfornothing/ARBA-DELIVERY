/**
 * Responsive Grid Component
 * Provides consistent responsive grid layouts with proper spacing
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { getResponsiveGrid, GRID_SYSTEMS } from '@/lib/responsive';

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 'single' | 'double' | 'triple' | 'quad' | 'responsive';
  gap?: 'mobile' | 'tablet' | 'desktop' | 'responsive';
  children: React.ReactNode;
}

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, columns = 'responsive', gap = 'responsive', children, ...props }, ref) => {
    // Grid column configurations
    const columnClasses = getResponsiveGrid(columns);

    // Gap configurations
    const gapClasses = {
      mobile: GRID_SYSTEMS.gaps.mobile,
      tablet: GRID_SYSTEMS.gaps.tablet,
      desktop: GRID_SYSTEMS.gaps.desktop,
      responsive: `${GRID_SYSTEMS.gaps.mobile} md:${GRID_SYSTEMS.gaps.tablet} lg:${GRID_SYSTEMS.gaps.desktop}`,
    };

    return (
      <div
        className={cn(
          'grid',
          columnClasses,
          gapClasses[gap],
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

ResponsiveGrid.displayName = 'ResponsiveGrid';

export { ResponsiveGrid };