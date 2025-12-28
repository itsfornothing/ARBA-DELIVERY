'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion, generateAriaLabel, handleKeyboardNavigation } from '@/lib/accessibility';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  loadingText?: string;
}

const LoadingSpinner = () => (
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" />
);

const ScreenReaderText = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
);

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'medium', 
    loading = false, 
    fullWidth = false, 
    disabled, 
    children, 
    onClick, 
    ariaLabel,
    ariaDescribedBy,
    loadingText = 'Loading',
    onKeyDown,
    className = '',
    ...props 
  }, ref) => {
    // Filter out conflicting props between HTML and Framer Motion
    const { 
      onDrag, 
      onDragEnd, 
      onDragStart, 
      onAnimationStart, 
      onAnimationEnd,
      onAnimationIteration,
      ...safeProps 
    } = props;
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      onClick?.(event);
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      handleKeyboardNavigation(
        event,
        () => handleClick(event as any), // Enter key
        () => handleClick(event as any)  // Space key
      );
      onKeyDown?.(event);
    };
    
    const buttonAriaLabel = ariaLabel || generateAriaLabel(
      typeof children === 'string' ? children : 'button',
      loading ? 'loading' : disabled ? 'disabled' : undefined
    );

    // Base classes
    const baseClasses = [
      'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-center cursor-pointer relative overflow-hidden transition-all duration-150 ease-out',
      'focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2',
      'disabled:opacity-60 disabled:cursor-not-allowed',
    ];

    // Size classes
    const sizeClasses = {
      small: 'px-3 py-2 text-sm min-h-[44px]',
      medium: 'px-4 py-3 text-base min-h-[44px]',
      large: 'px-6 py-4 text-lg min-h-[48px]',
    };

    // Variant classes
    const variantClasses = {
      primary: 'bg-primary-600 text-white border-2 border-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:-translate-y-0.5 hover:shadow-medium active:translate-y-0 active:shadow-soft',
      secondary: 'bg-secondary-600 text-white border-2 border-secondary-600 hover:bg-secondary-700 hover:border-secondary-700 hover:-translate-y-0.5 hover:shadow-medium',
      outline: 'bg-transparent text-primary-600 border-2 border-primary-600 hover:bg-primary-50 hover:-translate-y-0.5',
      ghost: 'bg-transparent text-neutral-700 border-2 border-transparent hover:bg-neutral-100 hover:border-neutral-200',
      danger: 'bg-error-600 text-white border-2 border-error-600 hover:bg-error-700 hover:border-error-700',
    };

    // Full width class
    const fullWidthClass = fullWidth ? 'w-full' : '';

    // Loading class
    const loadingClass = loading ? 'text-transparent' : '';

    const allClasses = [
      ...baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      fullWidthClass,
      loadingClass,
      className,
    ].filter(Boolean).join(' ');
    
    return (
      <motion.button
        ref={ref}
        className={allClasses}
        disabled={disabled || loading}
        whileTap={disabled || loading || useReducedMotion() ? undefined : { scale: 0.98 }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={buttonAriaLabel}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled || loading}
        role="button"
        {...safeProps}
      >
        {loading && (
          <>
            <LoadingSpinner />
            <ScreenReaderText>{loadingText}</ScreenReaderText>
          </>
        )}
        {children}
      </motion.button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';