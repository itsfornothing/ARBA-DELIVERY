'use client';

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { ThemeConfig } from '@/lib/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'muted';
  variant?: 'spinner' | 'dots' | 'pulse';
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const getSpinnerStyles = (
  size: LoadingSpinnerProps['size'] = 'medium',
  color: LoadingSpinnerProps['color'] = 'primary',
  theme: ThemeConfig
) => {
  const sizeStyles = {
    small: css`
      width: 16px;
      height: 16px;
      border-width: 2px;
    `,
    medium: css`
      width: 24px;
      height: 24px;
      border-width: 3px;
    `,
    large: css`
      width: 32px;
      height: 32px;
      border-width: 4px;
    `,
  };

  const colorStyles = {
    primary: css`
      border-color: ${theme.colors.primary}20;
      border-top-color: ${theme.colors.primary};
    `,
    secondary: css`
      border-color: ${theme.colors.secondary}20;
      border-top-color: ${theme.colors.secondary};
    `,
    muted: css`
      border-color: ${theme.colors.muted}20;
      border-top-color: ${theme.colors.muted};
    `,
  };

  return css`
    ${sizeStyles[size]}
    ${colorStyles[color]}
  `;
};

const SpinnerContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.div<{
  $size: LoadingSpinnerProps['size'];
  $color: LoadingSpinnerProps['color'];
}>`
  border-radius: 50%;
  border-style: solid;
  animation: ${spin} 1s linear infinite;
  
  ${({ $size, $color, theme }) => getSpinnerStyles($size, $color, theme)}
`;

const DotsContainer = styled.div<{
  $size: LoadingSpinnerProps['size'];
}>`
  display: flex;
  gap: ${({ $size }) => $size === 'small' ? '2px' : $size === 'large' ? '6px' : '4px'};
`;

const Dot = styled(motion.div)<{
  $size: LoadingSpinnerProps['size'];
  $color: LoadingSpinnerProps['color'];
}>`
  border-radius: 50%;
  
  ${({ $size, $color, theme }) => {
    const sizeStyles = {
      small: css`width: 4px; height: 4px;`,
      medium: css`width: 6px; height: 6px;`,
      large: css`width: 8px; height: 8px;`,
    };
    
    const colorStyles = {
      primary: css`background-color: ${theme.colors.primary};`,
      secondary: css`background-color: ${theme.colors.secondary};`,
      muted: css`background-color: ${theme.colors.muted};`,
    };
    
    return css`
      ${sizeStyles[$size || 'medium']}
      ${colorStyles[$color || 'primary']}
    `;
  }}
`;

const PulseCircle = styled.div<{
  $size: LoadingSpinnerProps['size'];
  $color: LoadingSpinnerProps['color'];
}>`
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
  
  ${({ $size, $color, theme }) => {
    const sizeStyles = {
      small: css`width: 16px; height: 16px;`,
      medium: css`width: 24px; height: 24px;`,
      large: css`width: 32px; height: 32px;`,
    };
    
    const colorStyles = {
      primary: css`background-color: ${theme.colors.primary};`,
      secondary: css`background-color: ${theme.colors.secondary};`,
      muted: css`background-color: ${theme.colors.muted};`,
    };
    
    return css`
      ${sizeStyles[$size || 'medium']}
      ${colorStyles[$color || 'primary']}
    `;
  }}
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  variant = 'spinner',
}) => {
  if (variant === 'dots') {
    return (
      <SpinnerContainer>
        <DotsContainer $size={size}>
          {[0, 1, 2].map((index) => (
            <Dot
              key={index}
              $size={size}
              $color={color}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </DotsContainer>
      </SpinnerContainer>
    );
  }

  if (variant === 'pulse') {
    return (
      <SpinnerContainer>
        <PulseCircle $size={size} $color={color} />
      </SpinnerContainer>
    );
  }

  return (
    <SpinnerContainer>
      <Spinner $size={size} $color={color} />
    </SpinnerContainer>
  );
};