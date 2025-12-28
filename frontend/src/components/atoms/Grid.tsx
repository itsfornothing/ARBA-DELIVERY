'use client';

import React, { HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { ThemeConfig, getBreakpoint } from '@/lib/theme';

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  container?: boolean;
  item?: boolean;
  spacing?: number;
  xs?: number | 'auto';
  sm?: number | 'auto';
  md?: number | 'auto';
  lg?: number | 'auto';
  xl?: number | 'auto';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  children: React.ReactNode;
}

const getGridItemStyles = (
  xs?: number | 'auto',
  sm?: number | 'auto',
  md?: number | 'auto',
  lg?: number | 'auto',
  xl?: number | 'auto',
  theme?: ThemeConfig
) => {
  const getFlexBasis = (size?: number | 'auto') => {
    if (size === 'auto') return 'auto';
    if (typeof size === 'number') return `${(size / 12) * 100}%`;
    return 'auto';
  };

  return css`
    flex: 0 0 ${getFlexBasis(xs)};
    max-width: ${getFlexBasis(xs)};

    ${theme && getBreakpoint('mobile', theme)} {
      flex: 0 0 ${getFlexBasis(sm || xs)};
      max-width: ${getFlexBasis(sm || xs)};
    }

    ${theme && getBreakpoint('tablet', theme)} {
      flex: 0 0 ${getFlexBasis(md || sm || xs)};
      max-width: ${getFlexBasis(md || sm || xs)};
    }

    ${theme && getBreakpoint('desktop', theme)} {
      flex: 0 0 ${getFlexBasis(lg || md || sm || xs)};
      max-width: ${getFlexBasis(lg || md || sm || xs)};
    }

    ${theme && getBreakpoint('wide', theme)} {
      flex: 0 0 ${getFlexBasis(xl || lg || md || sm || xs)};
      max-width: ${getFlexBasis(xl || lg || md || sm || xs)};
    }
  `;
};

const StyledGrid = styled.div<{
  $container: boolean;
  $item: boolean;
  $spacing: number;
  $direction: GridProps['direction'];
  $justify: GridProps['justify'];
  $align: GridProps['align'];
  $wrap: GridProps['wrap'];
  $xs?: number | 'auto';
  $sm?: number | 'auto';
  $md?: number | 'auto';
  $lg?: number | 'auto';
  $xl?: number | 'auto';
}>`
  ${({ $container, $item, $spacing, $direction, $justify, $align, $wrap, theme }) => {
    if ($container) {
      return css`
        display: flex;
        flex-direction: ${$direction};
        justify-content: ${$justify};
        align-items: ${$align};
        flex-wrap: ${$wrap};
        margin: -${($spacing * theme.spacing.unit) / 2}px;
        width: calc(100% + ${$spacing * theme.spacing.unit}px);
      `;
    }

    if ($item) {
      return css`
        padding: ${($spacing * theme.spacing.unit) / 2}px;
      `;
    }

    return '';
  }}

  ${({ $item, $xs, $sm, $md, $lg, $xl, theme }) =>
    $item && getGridItemStyles($xs, $sm, $md, $lg, $xl, theme)}
`;

export const Grid: React.FC<GridProps> = ({
  container = false,
  item = false,
  spacing = 2,
  xs,
  sm,
  md,
  lg,
  xl,
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'wrap',
  children,
  className,
  style,
  ...props
}) => {
  return (
    <StyledGrid
      $container={container}
      $item={item}
      $spacing={spacing}
      $direction={direction}
      $justify={justify}
      $align={align}
      $wrap={wrap}
      $xs={xs}
      $sm={sm}
      $md={md}
      $lg={lg}
      $xl={xl}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </StyledGrid>
  );
};