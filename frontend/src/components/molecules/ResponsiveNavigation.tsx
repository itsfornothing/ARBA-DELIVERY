/**
 * Responsive Navigation Component
 * Handles mobile-first navigation with proper touch targets and accessibility
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { getResponsiveNavClasses, TOUCH_TARGETS } from '@/lib/responsive';
import { Menu, X } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export interface ResponsiveNavigationProps {
  brand?: React.ReactNode;
  items: NavigationItem[];
  actions?: React.ReactNode;
  className?: string;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  brand,
  items,
  actions,
  className,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navClasses = getResponsiveNavClasses();

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('[data-mobile-nav]')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={cn('relative bg-white shadow-soft border-b border-neutral-200', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          {brand && (
            <div className="flex-shrink-0">
              {brand}
            </div>
          )}

          {/* Desktop Navigation */}
          <div className={navClasses.desktop}>
            {items.map((item, index) => (
              <a
                key={index}
                href={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={cn(
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'min-h-[40px]', // Adequate touch target for desktop
                  item.active
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
              >
                {item.icon && (
                  <span className="mr-2 flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          {actions && (
            <div className={navClasses.desktop}>
              {actions}
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className={navClasses.mobile} data-mobile-nav>
            <Button
              variant="ghost"
              size="md"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={navClasses.mobileMenu} data-mobile-nav>
          <div className="px-4 py-4 space-y-2">
            {items.map((item, index) => (
              <a
                key={index}
                href={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                  }
                  handleItemClick(item);
                }}
                className={cn(
                  'flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors',
                  `min-h-[${TOUCH_TARGETS.MINIMUM}px]`, // WCAG compliant touch target
                  item.active
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
              >
                {item.icon && (
                  <span className="mr-3 flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </a>
            ))}
            
            {/* Mobile Actions */}
            {actions && (
              <div className="pt-4 border-t border-neutral-200">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export { ResponsiveNavigation };