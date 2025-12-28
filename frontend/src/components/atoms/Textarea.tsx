'use client';

import React, { TextareaHTMLAttributes, forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { ThemeConfig } from '@/lib/theme';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
}

const TextareaContainer = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}
`;

const StyledTextarea = styled.textarea<{
  $size: TextareaProps['size'];
  $variant: TextareaProps['variant'];
  $hasError: boolean;
}>`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  transition: all ${({ theme }) => theme.animations.duration.fast}ms ${({ theme }) => theme.animations.easing.easeOut};
  resize: vertical;
  min-height: 80px;
  
  ${({ $size, theme }) => {
    switch ($size) {
      case 'small':
        return css`
          padding: ${theme.spacing.scale[2] * theme.spacing.unit}px ${theme.spacing.scale[3] * theme.spacing.unit}px;
          font-size: 0.875rem;
        `;
      case 'large':
        return css`
          padding: ${theme.spacing.scale[4] * theme.spacing.unit}px ${theme.spacing.scale[4] * theme.spacing.unit}px;
          font-size: 1.125rem;
        `;
      default:
        return css`
          padding: ${theme.spacing.scale[3] * theme.spacing.unit}px ${theme.spacing.scale[4] * theme.spacing.unit}px;
          font-size: 1rem;
        `;
    }
  }}
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'filled':
        return css`
          background-color: ${theme.colors.surface};
          border: 2px solid transparent;
          color: ${theme.colors.text};
          
          &:focus {
            outline: none;
            border-color: ${theme.colors.primary};
            background-color: ${theme.colors.background};
          }
        `;
      case 'outlined':
        return css`
          background-color: transparent;
          border: 2px solid ${theme.colors.border};
          color: ${theme.colors.text};
          
          &:focus {
            outline: none;
            border-color: ${theme.colors.primary};
          }
        `;
      default:
        return css`
          background-color: ${theme.colors.background};
          border: 1px solid ${theme.colors.border};
          color: ${theme.colors.text};
          
          &:focus {
            outline: none;
            border-color: ${theme.colors.primary};
            box-shadow: 0 0 0 1px ${theme.colors.primary}20;
          }
        `;
    }
  }}
  
  ${({ $hasError, theme }) => $hasError && css`
    border-color: ${theme.colors.error} !important;
    
    &:focus {
      box-shadow: 0 0 0 1px ${theme.colors.error}20;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.surface};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const HelperText = styled.span<{ $isError: boolean }>`
  font-size: 0.75rem;
  color: ${({ theme, $isError }) => $isError ? theme.colors.error : theme.colors.muted};
`;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    error, 
    helperText, 
    size = 'medium', 
    variant = 'default', 
    fullWidth = true,
    className,
    ...props 
  }, ref) => {
    return (
      <TextareaContainer $fullWidth={fullWidth} className={className}>
        {label && <Label>{label}</Label>}
        <StyledTextarea
          ref={ref}
          $size={size}
          $variant={variant}
          $hasError={!!error}
          {...props}
        />
        {(error || helperText) && (
          <HelperText $isError={!!error}>
            {error || helperText}
          </HelperText>
        )}
      </TextareaContainer>
    );
  }
);

Textarea.displayName = 'Textarea';