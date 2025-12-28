'use client';

import React, { InputHTMLAttributes, forwardRef, useState, useId, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { INPUT_SIZES, getIOSFriendlyFontSize } from '@/lib/responsive';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    label, 
    error, 
    helperText, 
    size = 'md', 
    variant = 'default', 
    fullWidth = false,
    leftIcon,
    rightIcon,
    onFocus,
    onBlur,
    value,
    id,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const generatedId = useId();
    const hasValue = Boolean(value || props.defaultValue);
    const isFloating = isFocused || hasValue;
    const hasError = Boolean(error);
    
    // Use provided ID or generate a stable one only on client
    const inputId = id || (isClient ? `input-${generatedId}` : undefined);

    // Ensure client-side rendering for ID generation
    useEffect(() => {
      setIsClient(true);
    }, []);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // Size classes with responsive behavior and proper touch targets
    const validSize = (size && ['sm', 'md', 'lg'].includes(size)) ? size : 'md';
    const sizeConfig = INPUT_SIZES[validSize as keyof typeof INPUT_SIZES];
    const sizeClasses = {
      input: cn(
        // Mobile-first with proper touch targets
        sizeConfig.mobile.height,
        sizeConfig.mobile.padding,
        sizeConfig.mobile.text, // Prevents zoom on iOS
        // Desktop overrides
        `md:${sizeConfig.desktop.height}`,
        `md:${sizeConfig.desktop.padding}`,
        `md:${sizeConfig.desktop.text}`
      ),
      icon: sizeConfig.mobile.icon,
      iconPosition: 'left-3 right-3',
      iconPadding: leftIcon ? 'pl-11' : rightIcon ? 'pr-11' : '',
      label: sizeConfig.mobile.text,
      labelFloating: 'text-xs',
    };

    // Variant classes
    const variantClasses = {
      default: cn(
        'bg-white border-2 border-neutral-300',
        hasError 
          ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' 
          : 'focus:border-blue-500 focus:ring-blue-500/20',
        'hover:border-neutral-400',
        isFocused && !hasError && 'border-blue-500'
      ),
      filled: cn(
        'bg-neutral-100 border-2',
        hasError 
          ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' 
          : 'border-transparent focus:border-blue-500 focus:ring-blue-500/20',
        'hover:bg-neutral-200',
        isFocused && !hasError && 'border-blue-500'
      ),
      outlined: cn(
        'bg-transparent border-2 border-neutral-300',
        hasError 
          ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' 
          : 'focus:border-blue-500 focus:ring-blue-500/20',
        'hover:border-neutral-400',
        isFocused && !hasError && 'border-blue-500'
      ),
    };

    const currentSize = sizeClasses;
    const currentVariant = variantClasses[variant];

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {/* Static Label (when not using floating label) */}
        {label && !label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className={cn(
              'absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none text-neutral-400',
              'left-3',
              currentSize.icon
            )}>
              {leftIcon}
            </div>
          )}
          
          {/* Input Field */}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              // Base styles
              'block w-full rounded-lg font-sans text-neutral-900 placeholder-neutral-500',
              'transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2',
              'disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-500',
              
              // Size styles
              currentSize.input,
              
              // Icon padding
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              
              // Variant styles
              currentVariant,
              
              // Focus ring
              isFocused && 'ring-2',
              
              className
            )}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* Floating Label */}
          {label && (
            <motion.label
              htmlFor={inputId}
              className={cn(
                'absolute left-4 pointer-events-none font-sans font-medium transition-all duration-200 ease-out',
                isFloating ? (
                  cn(
                    '-top-2 bg-white px-1',
                    currentSize.labelFloating,
                    hasError ? 'text-error-500' : isFocused ? 'text-blue-500' : 'text-neutral-500'
                  )
                ) : (
                  cn(
                    'top-1/2 -translate-y-1/2 text-neutral-500',
                    currentSize.label
                  )
                )
              )}
              animate={{
                y: isFloating ? 0 : '-50%',
                scale: isFloating ? 1 : 1,
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>
          )}
          
          {/* Right Icon */}
          {rightIcon && (
            <div className={cn(
              'absolute inset-y-0 right-0 flex items-center justify-center pointer-events-none text-neutral-400',
              'right-3',
              currentSize.icon
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {/* Helper Text / Error Message */}
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'text-sm font-sans mt-1',
                hasError ? 'text-error-500' : 'text-neutral-500'
              )}
            >
              {error || helperText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';