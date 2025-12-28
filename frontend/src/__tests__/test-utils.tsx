import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { enhancedTheme } from '../lib/theme';

// Create a comprehensive test wrapper with theme provider
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={enhancedTheme}>
      {children}
    </ThemeProvider>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock theme for tests that need direct theme access
export const mockTheme = enhancedTheme;

// Mock generators for property-based tests
export const mockGenerators = {
  buttonSize: () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    return sizes[Math.floor(Math.random() * sizes.length)];
  },
  buttonVariant: () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
    return variants[Math.floor(Math.random() * variants.length)];
  },
  inputSize: () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    return sizes[Math.floor(Math.random() * sizes.length)];
  },
  typographyVariant: () => {
    const variants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption'] as const;
    return variants[Math.floor(Math.random() * variants.length)];
  },
  cardVariant: () => {
    const variants = ['default', 'elevated', 'outlined'] as const;
    return variants[Math.floor(Math.random() * variants.length)];
  },
  cardSize: () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    return sizes[Math.floor(Math.random() * sizes.length)];
  },
};

// Mock responsive utilities
export const mockResponsive = {
  getButtonSizeConfig: (size: string) => {
    const config = {
      sm: { mobile: 'px-3 py-1.5 text-sm min-h-[44px]', desktop: 'px-3 py-1.5 text-sm min-h-[44px]' },
      md: { mobile: 'px-4 py-2 text-base min-h-[44px]', desktop: 'px-6 py-2 text-base min-h-[44px]' },
      lg: { mobile: 'px-8 py-3 text-lg min-h-[48px]', desktop: 'px-8 py-3 text-xl min-h-[48px]' },
    };
    return config[size as keyof typeof config] || config.md;
  },
  getInputSizeConfig: (size: string) => {
    const config = {
      sm: { mobile: 'h-11 px-3 text-sm', desktop: 'h-9 px-3 text-sm' },
      md: { mobile: 'h-12 px-4 text-base', desktop: 'h-11 px-4 text-base' },
      lg: { mobile: 'h-14 px-4 text-lg', desktop: 'h-12 px-4 text-lg' },
    };
    return config[size as keyof typeof config] || config.md;
  },
  getCardSizeConfig: (size: string) => {
    const config = {
      sm: { mobile: 'p-3', tablet: 'p-4', desktop: 'p-4' },
      md: { mobile: 'p-4', tablet: 'p-6', desktop: 'p-6' },
      lg: { mobile: 'p-4', tablet: 'p-6', desktop: 'p-8' },
    };
    return config[size as keyof typeof config] || config.md;
  },
};