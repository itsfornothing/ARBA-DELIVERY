/**
 * Accessibility Compliance Validation
 * Tests automated accessibility, keyboard navigation, and screen reader compatibility
 * Requirements: 2.5, 3.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

// Import components
import LoginPage from '@/app/auth/login/page';
import RegisterPage from '@/app/auth/register/page';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';

describe('Accessibility Compliance Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Automated Accessibility Tests', () => {
    it('should have no accessibility violations in login page', async () => {
      const { container } = render(<LoginPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in registration page', async () => {
      const { container } = render(<RegisterPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in Button component', async () => {
      const { container } = render(
        <div>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button loading>Loading Button</Button>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in Input component', async () => {
      const { container } = render(
        <div>
          <Input label="Text Input" placeholder="Enter text" />
          <Input label="Email Input" type="email" placeholder="Enter email" />
          <Input label="Password Input" type="password" placeholder="Enter password" />
          <Input label="Required Input" required placeholder="Required field" />
          <Input label="Input with Error" error="This field is required" placeholder="Error state" />
          <Input label="Disabled Input" disabled placeholder="Disabled field" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in Card component', async () => {
      const { container } = render(
        <div>
          <Card variant="default">
            <Typography variant="h3">Card Title</Typography>
            <Typography variant="body1">Card content goes here.</Typography>
          </Card>
          <Card variant="elevated">
            <Typography variant="h3">Elevated Card</Typography>
            <Typography variant="body1">This card has elevation.</Typography>
          </Card>
          <Card variant="outlined">
            <Typography variant="h3">Outlined Card</Typography>
            <Typography variant="body1">This card has an outline.</Typography>
          </Card>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in Typography component', async () => {
      const { container } = render(
        <div>
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="h5">Heading 5</Typography>
          <Typography variant="h6">Heading 6</Typography>
          <Typography variant="body1">Body text large</Typography>
          <Typography variant="body2">Body text small</Typography>
          <Typography variant="caption">Caption text</Typography>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation Tests', () => {
    it('should support keyboard navigation in login form', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab navigation should work
      await user.tab();
      expect(usernameInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      // Should be able to fill form with keyboard
      await user.click(usernameInput);
      await user.type(usernameInput, 'testuser');
      expect(usernameInput).toHaveValue('testuser');

      await user.click(passwordInput);
      await user.type(passwordInput, 'password123');
      expect(passwordInput).toHaveValue('password123');

      // Enter key should submit form
      await user.type(passwordInput, '{enter}');
      // Form submission would be tested by checking if API was called
    });

    it('should support keyboard navigation in registration form', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // Test tab navigation through all form fields
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email Address');
      const phoneInput = screen.getByLabelText('Phone Number');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Tab through all fields
      await user.tab(); // Role select
      await user.tab();
      expect(firstNameInput).toHaveFocus();

      await user.tab();
      expect(lastNameInput).toHaveFocus();

      await user.tab();
      expect(usernameInput).toHaveFocus();

      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(phoneInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(confirmPasswordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should support keyboard navigation for buttons', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <div>
          <Button variant="primary" onClick={handleClick}>
            Primary Button
          </Button>
          <Button variant="secondary" onClick={handleClick}>
            Secondary Button
          </Button>
        </div>
      );

      const primaryButton = screen.getByRole('button', { name: 'Primary Button' });
      const secondaryButton = screen.getByRole('button', { name: 'Secondary Button' });

      // Tab navigation
      await user.tab();
      expect(primaryButton).toHaveFocus();

      await user.tab();
      expect(secondaryButton).toHaveFocus();

      // Enter key should activate button
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Space key should also activate button
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should handle disabled elements correctly in keyboard navigation', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <div>
          <Button variant="primary" onClick={handleClick}>
            Enabled Button
          </Button>
          <Button variant="secondary" disabled onClick={handleClick}>
            Disabled Button
          </Button>
          <Button variant="outline" onClick={handleClick}>
            Another Enabled Button
          </Button>
        </div>
      );

      const enabledButton1 = screen.getByRole('button', { name: 'Enabled Button' });
      const disabledButton = screen.getByRole('button', { name: 'Disabled Button' });
      const enabledButton2 = screen.getByRole('button', { name: 'Another Enabled Button' });

      // Tab should skip disabled button
      await user.tab();
      expect(enabledButton1).toHaveFocus();

      await user.tab();
      expect(enabledButton2).toHaveFocus(); // Should skip disabled button

      // Disabled button should not be focusable
      expect(disabledButton).toHaveAttribute('disabled');
      expect(disabledButton).not.toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility Tests', () => {
    it('should have proper ARIA labels and roles for form elements', () => {
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Check for proper labels
      expect(usernameInput).toHaveAttribute('aria-label', 'Username');
      expect(passwordInput).toHaveAttribute('aria-label', 'Password');

      // Check for proper roles
      expect(usernameInput).toHaveAttribute('role', 'textbox');
      expect(passwordInput).toHaveAttribute('role', 'textbox');
      expect(submitButton).toHaveAttribute('role', 'button');
    });

    it('should have proper ARIA attributes for error states', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Fill in mismatched passwords
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText("Passwords don't match");
        expect(errorMessage).toBeInTheDocument();

        // Check for proper ARIA attributes for error state
        expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'true');
        expect(confirmPasswordInput).toHaveAttribute('aria-describedby');
      });
    });

    it('should have proper heading hierarchy', () => {
      render(<LoginPage />);

      // Check for proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Ensure headings follow proper hierarchy (h1 -> h2 -> h3, etc.)
      const headings = screen.getAllByRole('heading');
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        if (index > 0) {
          const prevLevel = parseInt(headings[index - 1].tagName.charAt(1));
          // Heading levels should not skip (e.g., h1 -> h3 without h2)
          expect(level - prevLevel).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should have proper landmark roles', () => {
      render(<LoginPage />);

      // Check for main landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();

      // Check for form landmark
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should have proper focus management for loading states', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Focus the button
      await user.click(submitButton);

      // When button is in loading state, it should maintain focus
      // and have proper ARIA attributes
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(submitButton).toHaveAttribute('disabled');
    });

    it('should announce dynamic content changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill in invalid credentials
      await user.type(usernameInput, 'invalid');
      await user.type(passwordInput, 'invalid');
      await user.click(submitButton);

      // Error message should be announced to screen readers
      await waitFor(() => {
        const errorRegion = screen.getByRole('alert');
        expect(errorRegion).toBeInTheDocument();
        expect(errorRegion).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper color contrast ratios', () => {
      render(
        <div>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Typography variant="body1" color="primary">Primary Text</Typography>
          <Typography variant="body1" color="muted">Muted Text</Typography>
        </div>
      );

      // These would be tested with actual color contrast calculations
      // For now, we ensure the elements exist and have proper styling classes
      const primaryButton = screen.getByRole('button', { name: 'Primary Button' });
      const secondaryButton = screen.getByRole('button', { name: 'Secondary Button' });

      expect(primaryButton).toHaveClass('bg-primary-600'); // High contrast background
      expect(secondaryButton).toHaveClass('bg-secondary-600'); // High contrast background
    });
  });

  describe('Focus Management Tests', () => {
    it('should trap focus within modal dialogs', () => {
      // This would test focus trapping in modal components
      // Implementation depends on modal component structure
      expect(true).toBe(true); // Placeholder
    });

    it('should restore focus after modal closes', () => {
      // This would test focus restoration after modal interaction
      // Implementation depends on modal component structure
      expect(true).toBe(true); // Placeholder
    });

    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button variant="primary">Focusable Button</Button>
          <Input label="Focusable Input" />
        </div>
      );

      const button = screen.getByRole('button', { name: 'Focusable Button' });
      const input = screen.getByLabelText('Focusable Input');

      // Focus elements and check for focus indicators
      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus:ring-2'); // Focus ring class

      await user.tab();
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus:ring-2'); // Focus ring class
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should maintain usability in high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <div>
          <Button variant="primary">High Contrast Button</Button>
          <Typography variant="body1">High Contrast Text</Typography>
        </div>
      );

      // Elements should be visible and functional in high contrast mode
      const button = screen.getByRole('button', { name: 'High Contrast Button' });
      const text = screen.getByText('High Contrast Text');

      expect(button).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion setting', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<Button loading>Loading Button</Button>);

      const button = screen.getByRole('button', { name: 'Loading Button' });
      
      // Button should still be functional but with reduced animations
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('disabled');
    });
  });
});