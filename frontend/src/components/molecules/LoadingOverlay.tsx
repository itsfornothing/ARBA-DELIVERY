'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';
import { Typography } from '@/components/atoms/Typography';

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  variant?: 'overlay' | 'inline' | 'backdrop';
  size?: 'small' | 'medium' | 'large';
  transparent?: boolean;
  children?: React.ReactNode;
}

const OverlayContainer = styled(motion.div)<{
  $variant: LoadingOverlayProps['variant'];
  $transparent: boolean;
}>`
  ${({ $variant, $transparent, theme }) => {
    if ($variant === 'overlay') {
      return css`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: ${$transparent 
          ? 'rgba(255, 255, 255, 0.8)' 
          : theme.colors.background
        };
        backdrop-filter: ${$transparent ? 'blur(4px)' : 'none'};
        z-index: 1000;
      `;
    }
    
    if ($variant === 'backdrop') {
      return css`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 9999;
      `;
    }
    
    return css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${theme.spacing.scale[8] * theme.spacing.unit}px;
      min-height: 200px;
    `;
  }}
`;

const LoadingContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  text-align: center;
  max-width: 300px;
`;

const LoadingCard = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  box-shadow: ${({ theme }) => theme.shadows.large};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const RelativeContainer = styled.div`
  position: relative;
`;

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  message,
  variant = 'overlay',
  size = 'medium',
  transparent = true,
  children,
}) => {
  const spinnerSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';
  
  const loadingContent = (
    <LoadingContent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <LoadingSpinner size={spinnerSize} variant="spinner" />
      {message && (
        <Typography 
          variant="body" 
          color="muted"
          style={{ marginTop: '8px' }}
        >
          {message}
        </Typography>
      )}
    </LoadingContent>
  );

  if (variant === 'inline') {
    return (
      <AnimatePresence>
        {loading && (
          <OverlayContainer
            $variant={variant}
            $transparent={transparent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loadingContent}
          </OverlayContainer>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'backdrop') {
    return (
      <AnimatePresence>
        {loading && (
          <OverlayContainer
            $variant={variant}
            $transparent={transparent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingCard
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {loadingContent}
            </LoadingCard>
          </OverlayContainer>
        )}
      </AnimatePresence>
    );
  }

  // Overlay variant (default)
  return (
    <RelativeContainer>
      {children}
      <AnimatePresence>
        {loading && (
          <OverlayContainer
            $variant={variant}
            $transparent={transparent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loadingContent}
          </OverlayContainer>
        )}
      </AnimatePresence>
    </RelativeContainer>
  );
};