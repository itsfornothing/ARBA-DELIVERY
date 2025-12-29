/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

import '@testing-library/jest-dom'

declare module 'jest-axe' {
  export function toHaveNoViolations(received: any): any;
  export function configureAxe(options?: any): any;
  export function axe(element: any, options?: any): Promise<any>;
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveNoViolations(): R
      toHaveAttribute(attr: string, value?: string): R
      toBeVisible(): R
      toBeDisabled(): R
      toHaveTextContent(text: string | RegExp): R
      toHaveValue(value: string | number): R
    }
  }
}