'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { getTouchTargetClasses, BUTTON_SIZES } from '@/lib/responsive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  as?: React.ElementType;
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled, 
    children,
    type = 'button',
    as: Component = 'button',
    href,
    ...props 
  }, ref) => {
    // Base styles with proper accessibility and interaction states
    const baseStyles = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'rounded-lg',
      'font-semibold',
      'transition-all',
      'duration-200',
      'ease-out',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:transform-none',
      'relative',
      'overflow-hidden',
    ];

    // Variant styles with proper color contrast and visual hierarchy
    const variantStyles = {
      primary: [
        'bg-blue-600',
        'text-white',
        'border-2',
        'border-blue-600',
        'hover:bg-blue-700',
        'hover:border-blue-700',
        'hover:shadow-medium',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:shadow-soft',
        'focus:ring-blue-500',
        'shadow-soft'
      ],
      secondary: [
        'bg-secondary-600',
        'text-white',
        'border-2',
        'border-secondary-600',
        'hover:bg-secondary-700',
        'hover:border-secondary-700',
        'hover:shadow-medium',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:shadow-soft',
        'focus:ring-secondary-500',
        'shadow-soft'
      ],
      outline: [
        'bg-transparent',
        'text-blue-600',
        'border-2',
        'border-blue-600',
        'hover:bg-blue-50',
        'hover:shadow-medium',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:bg-blue-100',
        'focus:ring-blue-500'
      ],
      ghost: [
        'bg-transparent',
        'text-neutral-700',
        'border-2',
        'border-transparent',
        'hover:bg-neutral-100',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:bg-neutral-200',
        'focus:ring-neutral-500'
      ],
      danger: [
        'bg-error-600',
        'text-white',
        'border-2',
        'border-error-600',
        'hover:bg-error-700',
        'hover:border-error-700',
        'hover:shadow-medium',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:shadow-soft',
        'focus:ring-error-500',
        'shadow-soft'
      ]
    };

    // Size styles with appropriate touch targets and responsive behavior
    const validSize = (size && ['sm', 'md', 'lg'].includes(size)) ? size : 'md';
    const sizeConfig = BUTTON_SIZES[validSize as keyof typeof BUTTON_SIZES];
    const sizeStyles = [
      // Mobile-first approach with proper touch targets
      sizeConfig.mobile.height,
      sizeConfig.mobile.padding,
      sizeConfig.mobile.text,
      // Desktop overrides
      `md:${sizeConfig.desktop.height.replace('min-h-[', 'min-h-[')}`,
      `md:${sizeConfig.desktop.padding}`,
      `md:${sizeConfig.desktop.text}`,
    ];

    const fullWidthStyles = fullWidth ? ['w-full'] : [];
    const loadingStyles = loading ? ['cursor-wait'] : [];

    return (
      <Component
        className={cn(
          ...baseStyles,
          ...variantStyles[variant as keyof typeof variantStyles] || variantStyles.primary,
          ...sizeStyles,
          ...fullWidthStyles,
          ...loadingStyles,
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        type={Component === 'button' ? type : undefined}
        href={href}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        
        {/* Content container - hidden when loading */}
        <div className={cn('flex items-center gap-2', loading && 'invisible')}>
          {leftIcon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
      </Component>
    );
  }
);

Button.displayName = 'Button';

export { Button };