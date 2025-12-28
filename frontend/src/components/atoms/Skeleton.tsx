'use client';

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { ThemeConfig } from '@/lib/theme';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
`;

const getSkeletonStyles = (
  variant: SkeletonProps['variant'] = 'rectangular',
  animation: SkeletonProps['animation'] = 'pulse',
  theme: ThemeConfig
) => {
  const variantStyles = {
    text: css`
      height: 1em;
      border-radius: ${theme.borderRadius.small};
    `,
    rectangular: css`
      border-radius: ${theme.borderRadius.medium};
    `,
    circular: css`
      border-radius: 50%;
    `,
    rounded: css`
      border-radius: ${theme.borderRadius.large};
    `,
  };

  const animationStyles = {
    pulse: css`
      animation: ${pulse} 2s ease-in-out infinite;
    `,
    wave: css`
      background: linear-gradient(
        90deg,
        ${theme.colors.border} 25%,
        ${theme.colors.surface} 37%,
        ${theme.colors.border} 63%
      );
      background-size: 200px 100%;
      animation: ${shimmer} 1.5s ease-in-out infinite;
    `,
    none: css``,
  };

  return css`
    ${variantStyles[variant]}
    ${animationStyles[animation]}
  `;
};

const StyledSkeleton = styled(motion.div)<{
  $variant: SkeletonProps['variant'];
  $animation: SkeletonProps['animation'];
  $width?: string | number;
  $height?: string | number;
}>`
  display: block;
  background-color: ${({ theme }) => theme.colors.border};
  width: ${({ $width }) => 
    typeof $width === 'number' ? `${$width}px` : $width || '100%'
  };
  height: ${({ $height }) => 
    typeof $height === 'number' ? `${$height}px` : $height || '20px'
  };
  
  ${({ $variant, $animation, theme }) => getSkeletonStyles($variant, $animation, theme)}
`;

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  className,
}) => {
  return (
    <StyledSkeleton
      $variant={variant}
      $animation={animation}
      $width={width}
      $height={height}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
};