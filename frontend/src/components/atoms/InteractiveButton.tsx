'use client';

import React, { ButtonHTMLAttributes, forwardRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { ThemeConfig } from '@/lib/theme';

interface InteractiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  // Enhanced micro-interaction props
  ripple?: boolean;
  hapticFeedback?: boolean;
  successAnimation?: boolean;
}

// Ripple effect animation
const rippleEffect = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

// Success pulse animation
const successPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const getButtonStyles = (
  variant: InteractiveButtonProps['variant'] = 'primary',
  size: InteractiveButtonProps['size'] = 'medium',
  fullWidth: boolean = false,
  theme: ThemeConfig
) => {
  const sizeStyles = {
    small: css`
      padding: ${theme.spacing.scale[2] * theme.spacing.unit}px ${theme.spacing.scale[3] * theme.spacing.unit}px;
      font-size: 0.875rem;
      min-height: 32px;
    `,
    medium: css`
      padding: ${theme.spacing.scale[3] * theme.spacing.unit}px ${theme.spacing.scale[4] * theme.spacing.unit}px;
      font-size: 1rem;
      min-height: 40px;
    `,
    large: css`
      padding: ${theme.spacing.scale[4] * theme.spacing.unit}px ${theme.spacing.scale[6] * theme.spacing.unit}px;
      font-size: 1.125rem;
      min-height: 48px;
    `,
  };

  const variantStyles = {
    primary: css`
      background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}dd);
      color: white;
      border: 2px solid ${theme.colors.primary};
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, ${theme.colors.primary}dd, ${theme.colors.primary}bb);
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.large};
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: ${theme.shadows.medium};
      }
    `,
    secondary: css`
      background: linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.secondary}dd);
      color: white;
      border: 2px solid ${theme.colors.secondary};
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, ${theme.colors.secondary}dd, ${theme.colors.secondary}bb);
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.large};
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: ${theme.shadows.medium};
      }
    `,
    success: css`
      background: linear-gradient(135deg, ${theme.colors.success}, ${theme.colors.success}dd);
      color: white;
      border: 2px solid ${theme.colors.success};
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, ${theme.colors.success}dd, ${theme.colors.success}bb);
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.large};
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: ${theme.shadows.medium};
      }
    `,
    outline: css`
      background-color: transparent;
      color: ${theme.colors.primary};
      border: 2px solid ${theme.colors.primary};
      
      &:hover:not(:disabled) {
        background-color: ${theme.colors.primary}10;
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.large};
        border-color: ${theme.colors.primary}dd;
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px);
        background-color: ${theme.colors.primary}20;
      }
    `,
    ghost: css`
      background-color: transparent;
      color: ${theme.colors.text};
      border: 2px solid transparent;
      
      &:hover:not(:disabled) {
        background-color: ${theme.colors.surface};
        transform: translateY(-1px);
        box-shadow: ${theme.shadows.small};
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
        background-color: ${theme.colors.border};
      }
    `,
    danger: css`
      background: linear-gradient(135deg, ${theme.colors.error}, ${theme.colors.error}dd);
      color: white;
      border: 2px solid ${theme.colors.error};
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, ${theme.colors.error}dd, ${theme.colors.error}bb);
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.large};
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: ${theme.shadows.medium};
      }
    `,
  };

  return css`
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${fullWidth && css`width: 100%;`}
  `;
};

const StyledButton = styled(motion.button)<{
  $variant: InteractiveButtonProps['variant'];
  $size: InteractiveButtonProps['size'];
  $fullWidth: boolean;
  $loading: boolean;
  $successAnimation: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-family: ${({ theme }) => theme.typography.fontFamily.default};
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.normal}ms ${({ theme }) => theme.animations.easing.easeOut};
  position: relative;
  overflow: hidden;
  
  ${({ $variant, $size, $fullWidth, theme }) => getButtonStyles($variant, $size, $fullWidth, theme)}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.primary}40;
    outline-offset: 2px;
  }
  
  ${({ $loading }) => $loading && css`
    color: transparent;
  `}
  
  ${({ $successAnimation }) => $successAnimation && css`
    animation: ${successPulse} 0.6s ease-out;
  `}
`;

const RippleContainer = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
`;

const RippleElement = styled.span<{ $x: number; $y: number }>`
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ${rippleEffect} 0.6s linear;
  left: ${({ $x }) => $x - 10}px;
  top: ${({ $y }) => $y - 10}px;
`;

const LoadingSpinner = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
`;

interface RippleState {
  x: number;
  y: number;
  id: number;
}

export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'medium', 
    loading = false, 
    fullWidth = false, 
    ripple = true,
    hapticFeedback = false,
    successAnimation = false,
    disabled, 
    children, 
    onClick, 
    onMouseDown,
    className, 
    style, 
    type, 
    ...props 
  }, ref) => {
    const [ripples, setRipples] = useState<RippleState[]>([]);
    const [isSuccess, setIsSuccess] = useState(false);

    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || disabled || loading) return;

      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newRipple: RippleState = {
        x,
        y,
        id: Date.now(),
      };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(event);
      
      // Haptic feedback simulation (would use navigator.vibrate in real implementation)
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      onMouseDown?.(event);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (successAnimation) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 600);
      }
      
      onClick?.(event);
    };

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

    return (
      <StyledButton
        ref={ref}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        $loading={loading}
        $successAnimation={isSuccess}
        disabled={disabled || loading}
        whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        className={className}
        style={style}
        type={type}
        {...safeProps}
      >
        {ripple && (
          <RippleContainer>
            {ripples.map(ripple => (
              <RippleElement
                key={ripple.id}
                $x={ripple.x}
                $y={ripple.y}
              />
            ))}
          </RippleContainer>
        )}
        
        {loading && (
          <LoadingSpinner
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
        {children}
      </StyledButton>
    );
  }
);

InteractiveButton.displayName = 'InteractiveButton';