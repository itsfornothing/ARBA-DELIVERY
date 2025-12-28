'use client';

import React, { HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { ThemeConfig, getBreakpoint } from '@/lib/theme';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fluid?: boolean;
  disableGutters?: boolean;
  children: React.ReactNode;
}

const getMaxWidth = (maxWidth: ContainerProps['maxWidth'], theme: ThemeConfig) => {
  const maxWidths = {
    xs: '444px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  };

  if (maxWidth === false) return 'none';
  return maxWidths[maxWidth || 'lg'];
};

const StyledContainer = styled.div<{
  $maxWidth: ContainerProps['maxWidth'];
  $fluid: boolean;
  $disableGutters: boolean;
}>`
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  
  ${({ $maxWidth, $fluid, theme }) => !$fluid && css`
    max-width: ${getMaxWidth($maxWidth, theme)};
  `}
  
  ${({ $disableGutters, theme }) => !$disableGutters && css`
    padding-left: ${theme.spacing.scale[4] * theme.spacing.unit}px;
    padding-right: ${theme.spacing.scale[4] * theme.spacing.unit}px;
    
    ${getBreakpoint('mobile', theme)} {
      padding-left: ${theme.spacing.scale[6] * theme.spacing.unit}px;
      padding-right: ${theme.spacing.scale[6] * theme.spacing.unit}px;
    }
    
    ${getBreakpoint('tablet', theme)} {
      padding-left: ${theme.spacing.scale[8] * theme.spacing.unit}px;
      padding-right: ${theme.spacing.scale[8] * theme.spacing.unit}px;
    }
  `}
`;

export const Container: React.FC<ContainerProps> = ({
  maxWidth = 'lg',
  fluid = false,
  disableGutters = false,
  children,
  className,
  style,
  ...props
}) => {
  return (
    <StyledContainer
      $maxWidth={maxWidth}
      $fluid={fluid}
      $disableGutters={disableGutters}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </StyledContainer>
  );
};