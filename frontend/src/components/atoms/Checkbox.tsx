'use client';

import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled';
  indeterminate?: boolean;
  fullWidth?: boolean;
}

const CheckboxContainer = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}
`;

const CheckboxWrapper = styled.label<{ 
  $size: CheckboxProps['size'];
  $hasError: boolean;
  $disabled: boolean;
}>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  user-select: none;
  
  ${({ $size, theme }) => {
    const sizeStyles = {
      small: css`font-size: 0.875rem;`,
      medium: css`font-size: 1rem;`,
      large: css`font-size: 1.125rem;`,
    };
    return sizeStyles[$size || 'medium'];
  }}
  
  ${({ $disabled }) => $disabled && css`
    opacity: 0.6;
  `}
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const CheckboxBox = styled(motion.div)<{
  $size: CheckboxProps['size'];
  $variant: CheckboxProps['variant'];
  $hasError: boolean;
  $checked: boolean;
  $indeterminate: boolean;
  $disabled: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all ${({ theme }) => theme.animations.duration.fast}ms ${({ theme }) => theme.animations.easing.easeOut};
  border: 2px solid;
  flex-shrink: 0;
  
  ${({ $size, theme }) => {
    const sizeStyles = {
      small: css`
        width: 16px;
        height: 16px;
      `,
      medium: css`
        width: 20px;
        height: 20px;
      `,
      large: css`
        width: 24px;
        height: 24px;
      `,
    };
    return sizeStyles[$size || 'medium'];
  }}
  
  ${({ $variant, $hasError, $checked, $indeterminate, $disabled, theme }) => {
    const isActive = $checked || $indeterminate;
    const borderColor = $hasError ? theme.colors.error : 
                       isActive ? theme.colors.primary : theme.colors.border;
    const backgroundColor = isActive ? theme.colors.primary : 
                           $variant === 'filled' ? theme.colors.surface : 'transparent';
    
    return css`
      border-color: ${borderColor};
      background-color: ${backgroundColor};
      
      ${!$disabled && css`
        &:hover {
          border-color: ${$hasError ? theme.colors.error : theme.colors.primary};
          ${!isActive && $variant === 'filled' && css`
            background-color: ${theme.colors.border};
          `}
        }
      `}
    `;
  }}
`;

const CheckboxIcon = styled(motion.div)<{ $size: CheckboxProps['size'] }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  ${({ $size }) => {
    const sizeStyles = {
      small: css`
        svg {
          width: 10px;
          height: 10px;
        }
      `,
      medium: css`
        svg {
          width: 12px;
          height: 12px;
        }
      `,
      large: css`
        svg {
          width: 14px;
          height: 14px;
        }
      `,
    };
    return sizeStyles[$size || 'medium'];
  }}
`;

const CheckboxLabel = styled.div<{ $hasError: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ $hasError, theme }) => $hasError ? theme.colors.error : theme.colors.text};
  line-height: 1.5;
  margin-top: 1px; // Align with checkbox center
`;

const HelperText = styled(motion.div)<{ $isError: boolean }>`
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ $isError, theme }) => $isError ? theme.colors.error : theme.colors.muted};
  margin-top: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  margin-left: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    label, 
    error, 
    helperText, 
    size = 'medium', 
    variant = 'default', 
    indeterminate = false,
    fullWidth = false,
    checked,
    disabled = false,
    onChange,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = Boolean(error);
    const isChecked = Boolean(checked);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) {
        onChange?.(e);
      }
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    return (
      <CheckboxContainer $fullWidth={fullWidth}>
        <CheckboxWrapper
          $size={size}
          $hasError={hasError}
          $disabled={disabled}
        >
          <HiddenCheckbox
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          <CheckboxBox
            $size={size}
            $variant={variant}
            $hasError={hasError}
            $checked={isChecked}
            $indeterminate={indeterminate}
            $disabled={disabled}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            animate={{
              scale: isFocused ? 1.05 : 1,
            }}
            transition={{ duration: 0.1 }}
          >
            <AnimatePresence>
              {(isChecked || indeterminate) && (
                <CheckboxIcon
                  $size={size}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'backOut' }}
                >
                  {indeterminate ? <Minus /> : <Check />}
                </CheckboxIcon>
              )}
            </AnimatePresence>
          </CheckboxBox>
          
          {label && (
            <CheckboxLabel $hasError={hasError}>
              {label}
            </CheckboxLabel>
          )}
        </CheckboxWrapper>
        
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
      </CheckboxContainer>
    );
  }
);

Checkbox.displayName = 'Checkbox';