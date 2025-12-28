'use client';

import { createGlobalStyle } from 'styled-components';
import { enhancedTheme } from '@/lib/theme';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: ${enhancedTheme.typography.fontFamily.sans.join(', ')};
    font-size: ${enhancedTheme.typography.fontSize.base};
    line-height: ${enhancedTheme.typography.lineHeight.normal};
    color: ${enhancedTheme.colors.neutral[900]};
    background-color: ${enhancedTheme.colors.neutral[50]};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Focus styles */
  *:focus-visible {
    outline: 2px solid ${enhancedTheme.colors.primary[500]};
    outline-offset: 2px;
  }

  /* Selection styles */
  ::selection {
    background-color: ${enhancedTheme.colors.primary[500]}30;
    color: ${enhancedTheme.colors.neutral[900]};
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${enhancedTheme.colors.neutral[100]};
  }

  ::-webkit-scrollbar-thumb {
    background: ${enhancedTheme.colors.neutral[300]};
    border-radius: ${enhancedTheme.borderRadius.sm};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${enhancedTheme.colors.neutral[400]};
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    * {
      border-color: currentColor !important;
    }
  }

  /* Print styles */
  @media print {
    * {
      background: transparent !important;
      color: black !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
  }
`;