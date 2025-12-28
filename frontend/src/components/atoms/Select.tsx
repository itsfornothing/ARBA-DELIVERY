'use client';

import React, { SelectHTMLAttributes, forwardRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

const SelectContainer = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}
`;

const SelectWrapper = styled.div<{ 
  $size: SelectProps['size'];
  $variant: SelectProps['variant'];
  $hasError: boolean;
  $isFocused: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  
  ${({ $size, theme }) => {
    const sizeStyles = {
      small: css`height: 36px;`,
      medium: css`height: 44px;`,
      large: css`height: 52px;`,
    };
    return sizeStyles[$size || 'medium'];
  }}
  
  ${({ $variant, $hasError, $isFocused, theme }) => {
    const baseStyles = css`
      border-radius: ${theme.borderRadius.medium};
      transition: all ${theme.animations.duration.fast}ms ${theme.animations.easing.easeOut};
      border: 2px solid;
    `;
    
    const variantStyles = {
      default: css`
        ${baseStyles}
        background-color: ${theme.colors.background};
        border-color: ${$hasError ? theme.colors.error : $isFocused ? theme.colors.primary : theme.colors.border};
        
        &:hover {
          border-color: ${$hasError ? theme.colors.error : $isFocused ? theme.colors.primary : theme.colors.muted};
        }
      `,
      filled: css`
        ${baseStyles}
        background-color: ${theme.colors.surface};
        border-color: ${$hasError ? theme.colors.error : $isFocused ? theme.colors.primary : 'transparent'};
        
        &:hover {
          background-color: ${theme.colors.border};
        }
      `,
      outlined: css`
        ${baseStyles}
        background-color: transparent;
        border-color: ${$hasError ? theme.colors.error : $isFocused ? theme.colors.primary : theme.colors.border};
        
        &:hover {
          border-color: ${$hasError ? theme.colors.error : $isFocused ? theme.colors.primary : theme.colors.muted};
        }
      `,
    };
    
    return variantStyles[$variant || 'default'];
  }}
  
  ${({ $isFocused, theme }) => $isFocused && css`
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  `}
`;

const StyledSelect = styled.select<{
  $size: SelectProps['size'];
  $hasPlaceholder: boolean;
}>`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ theme }) => theme.colors.text};
  appearance: none;
  cursor: pointer;
  
  ${({ $size, theme }) => {
    const sizeStyles = {
      small: css`
        font-size: 0.875rem;
        padding: 0 ${theme.spacing.scale[3] * theme.spacing.unit}px;
      `,
      medium: css`
        font-size: 1rem;
        padding: 0 ${theme.spacing.scale[4] * theme.spacing.unit}px;
      `,
      large: css`
        font-size: 1.125rem;
        padding: 0 ${theme.spacing.scale[5] * theme.spacing.unit}px;
      `,
    };
    return sizeStyles[$size || 'medium'];
  }}
  
  padding-right: ${({ theme }) => theme.spacing.scale[10] * theme.spacing.unit}px;
  
  ${({ $hasPlaceholder, theme }) => $hasPlaceholder && css`
    color: ${theme.colors.muted};
  `}
  
  option {
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.background};
    
    &:disabled {
      color: ${({ theme }) => theme.colors.muted};
    }
  }
`;

const FloatingLabel = styled(motion.label)<{
  $isFloating: boolean;
  $isFocused: boolean;
  $hasError: boolean;
  $size: SelectProps['size'];
}>`
  position: absolute;
  left: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  pointer-events: none;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  transition: all ${({ theme }) => theme.animations.duration.fast}ms ${({ theme }) => theme.animations.easing.easeOut};
  
  ${({ $isFloating, $isFocused, $hasError, $size, theme }) => {
    const color = $hasError ? theme.colors.error : $isFocused ? theme.colors.primary : theme.colors.muted;
    
    if ($isFloating) {
      return css`
        top: -8px;
        font-size: 0.75rem;
        font-weight: 500;
        color: ${color};
        background-color: ${theme.colors.background};
        padding: 0 ${theme.spacing.scale[1] * theme.spacing.unit}px;
      `;
    }
    
    const sizeStyles = {
      small: css`top: 50%; font-size: 0.875rem;`,
      medium: css`top: 50%; font-size: 1rem;`,
      large: css`top: 50%; font-size: 1.125rem;`,
    };
    
    return css`
      ${sizeStyles[$size || 'medium']}
      transform: translateY(-50%);
      color: ${theme.colors.muted};
    `;
  }}
`;

const ChevronIcon = styled(motion.div)<{ $isFocused: boolean }>`
  position: absolute;
  right: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
  pointer-events: none;
  transition: transform ${({ theme }) => theme.animations.duration.fast}ms ${({ theme }) => theme.animations.easing.easeOut};
  
  ${({ $isFocused }) => $isFocused && css`
    transform: rotate(180deg);
  `}
`;

const HelperText = styled(motion.div)<{ $isError: boolean }>`
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ $isError, theme }) => $isError ? theme.colors.error : theme.colors.muted};
  margin-top: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
`;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    error, 
    helperText, 
    size = 'medium', 
    variant = 'default', 
    fullWidth = false,
    options,
    placeholder,
    onFocus,
    onBlur,
    value,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(value && value !== '');
    const isFloating = isFocused || hasValue;
    const hasError = Boolean(error);
    const hasPlaceholder = !hasValue && Boolean(placeholder);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <SelectContainer $fullWidth={fullWidth}>
        <SelectWrapper
          $size={size}
          $variant={variant}
          $hasError={hasError}
          $isFocused={isFocused}
        >
          <StyledSelect
            ref={ref}
            $size={size}
            $hasPlaceholder={hasPlaceholder}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </StyledSelect>
          
          {label && (
            <FloatingLabel
              $isFloating={isFloating}
              $isFocused={isFocused}
              $hasError={hasError}
              $size={size}
              animate={{
                y: isFloating ? 0 : '-50%',
                scale: isFloating ? 1 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </FloatingLabel>
          )}
          
          <ChevronIcon $isFocused={isFocused}>
            <ChevronDown size={20} />
          </ChevronIcon>
        </SelectWrapper>
        
        <AnimatePresence>
          {(error || helperText) && (
            <HelperText
              $isError={hasError}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {error || helperText}
            </HelperText>
          )}
        </AnimatePresence>
      </SelectContainer>
    );
  }
);

Select.displayName = 'Select';