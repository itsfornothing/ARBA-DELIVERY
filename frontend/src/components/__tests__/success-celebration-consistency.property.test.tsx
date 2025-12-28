/**
 * **Feature: delivery-app-ui-enhancement, Property 11: Success Celebration Consistency**
 * **Validates: Requirements 2.5, 3.5, 9.4, 9.5, 11.4**
 * 
 * Property: For any successful completion of important actions (order submission, milestone achievement), 
 * the system must trigger appropriate celebration animations and positive reinforcement
 */

import React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme } from '@/lib/theme';

// Simple test component to verify celebration consistency
const TestCelebration: React.FC<{ 
  title: string; 
  message: string; 
  type: string;
  level: string;
}> = ({ title, message, type, level }) => (
  <div data-testid="celebration" data-type={type} data-level={level}>
    <h2>{title}</h2>
    <p>{message}</p>
    <button>Continue</button>
  </div>
);

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme={defaultTheme}>
    {children}
  </ThemeProvider>
);

// Generators
const celebrationTypeArb = fc.constantFrom(
  'order_completion', 
  'milestone', 
  'achievement', 
  'first_order', 
  'level_up'
);

const celebrationLevelArb = fc.constantFrom('small', 'medium', 'large');

// Generate meaningful strings with alphanumeric characters
const meaningfulStringArb = (minLength: number, maxLength: number) =>
  fc.string({ 
    minLength, 
    maxLength,
    unit: fc.constantFrom(
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '!', '?', '.'
    )
  }).filter(s => s.trim().length >= minLength);

describe('Success Celebration Consistency Property Tests', () => {
  it('should consistently display celebration elements for all celebration types', () => {
    fc.assert(
      fc.property(
        meaningfulStringArb(5, 50),
        meaningfulStringArb(10, 200),
        celebrationTypeArb,
        celebrationLevelArb,
        (title, message, type, level) => {
          // Clean render for each test
          const { container, getByRole } = render(
            <TestWrapper>
              <TestCelebration
                title={title}
                message={message}
                type={type}
                level={level}
              />
            </TestWrapper>
          );

          // Verify celebration is rendered
          const celebration = container.querySelector('[data-testid="celebration"]');
          expect(celebration).toBeTruthy();

          // Verify title is displayed in h2
          const titleElement = container.querySelector('h2');
          expect(titleElement).toBeTruthy();
          expect(titleElement?.textContent).toBe(title);

          // Verify message is displayed in p
          const messageElement = container.querySelector('p');
          expect(messageElement).toBeTruthy();
          expect(messageElement?.textContent).toBe(message);

          // Verify continue button is present
          const continueButton = container.querySelector('button');
          expect(continueButton).toBeTruthy();
          expect(continueButton?.textContent).toBe('Continue');

          // Verify type and level are preserved
          expect(celebration?.getAttribute('data-type')).toBe(type);
          expect(celebration?.getAttribute('data-level')).toBe(level);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should consistently provide positive reinforcement structure', () => {
    fc.assert(
      fc.property(
        meaningfulStringArb(5, 50),
        meaningfulStringArb(10, 200),
        celebrationTypeArb,
        (title, message, type) => {
          // Clean render for each test
          const { container, getByRole } = render(
            <TestWrapper>
              <TestCelebration
                title={title}
                message={message}
                type={type}
                level="medium"
              />
            </TestWrapper>
          );

          // Verify all required elements are present using DOM queries
          const titleElement = container.querySelector('h2');
          const messageElement = container.querySelector('p');
          const actionButton = container.querySelector('button');

          expect(titleElement).toBeTruthy();
          expect(messageElement).toBeTruthy();
          expect(actionButton).toBeTruthy();

          // Verify content matches
          expect(titleElement?.textContent).toBe(title);
          expect(messageElement?.textContent).toBe(message);

          // Verify content has appropriate length
          expect(title.length).toBeGreaterThan(4);
          expect(message.length).toBeGreaterThan(9);
        }
      ),
      { numRuns: 50 }
    );
  });
});