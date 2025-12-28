/**
 * Visual Regression Tests for UI Enhancements
 * 
 * Tests visual consistency and design system compliance across components.
 * These tests ensure that UI changes don't break the visual design.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme, darkTheme } from '@/lib/theme';

// Import all UI components for visual testing
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { LoadingSpinner } from '@/components/molecules/LoadingSpinner';
import { Toast } from '@/components/molecules/Toast';
import { Form } from '@/components/molecules/Form';
import { ResponsiveLayout } from '@/components/molecules/ResponsiveLayout';

// Mock framer-motion for consistent snapshots
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
  useInView: () => true,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}));

const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  theme?: any;
}> = ({ children, theme = defaultTheme }) => (
  <ThemeProvider defaultTheme={theme}>
    <div style={{ padding: '24px', backgroundColor: theme.colors.background }}>
      {children}
    </div>
  </ThemeProvider>
);

describe('Visual Regression Tests', () => {
  describe('Button Component Visual Tests', () => {
    it('should render all button variants consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Button variant="primary" size="small">Primary Small</Button>
            <Button variant="primary" size="medium">Primary Medium</Button>
            <Button variant="primary" size="large">Primary Large</Button>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Button variant="secondary" size="small">Secondary Small</Button>
            <Button variant="secondary" size="medium">Secondary Medium</Button>
            <Button variant="secondary" size="large">Secondary Large</Button>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Button variant="outline" size="small">Outline Small</Button>
            <Button variant="outline" size="medium">Outline Medium</Button>
            <Button variant="outline" size="large">Outline Large</Button>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Button variant="ghost" size="small">Ghost Small</Button>
            <Button variant="ghost" size="medium">Ghost Medium</Button>
            <Button variant="ghost" size="large">Ghost Large</Button>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Button variant="danger" size="small">Danger Small</Button>
            <Button variant="danger" size="medium">Danger Medium</Button>
            <Button variant="danger" size="large">Danger Large</Button>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('button-variants-light-theme');
    });

    it('should render button states consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Button variant="primary">Normal</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" loading>Loading</Button>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Button variant="outline">Normal</Button>
            <Button variant="outline" disabled>Disabled</Button>
            <Button variant="outline" loading>Loading</Button>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('button-states-light-theme');
    });

    it('should render buttons consistently in dark theme', () => {
      const { container } = render(
        <TestWrapper theme={darkTheme}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('button-variants-dark-theme');
    });
  });

  describe('Input Component Visual Tests', () => {
    it('should render all input variants consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <Input variant="default" label="Default Input" placeholder="Enter text" />
            </div>
            <div>
              <Input variant="filled" label="Filled Input" placeholder="Enter text" />
            </div>
            <div>
              <Input variant="outlined" label="Outlined Input" placeholder="Enter text" />
            </div>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('input-variants-light-theme');
    });

    it('should render input sizes consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Input size="small" label="Small Input" placeholder="Small size" />
            <Input size="medium" label="Medium Input" placeholder="Medium size" />
            <Input size="large" label="Large Input" placeholder="Large size" />
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('input-sizes-light-theme');
    });

    it('should render input states consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Input label="Normal Input" placeholder="Normal state" />
            <Input label="Disabled Input" placeholder="Disabled state" disabled />
            <Input label="Error Input" placeholder="Error state" error="This field is required" />
            <Input label="Success Input" placeholder="Success state" value="Valid input" />
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('input-states-light-theme');
    });
  });

  describe('Card Component Visual Tests', () => {
    it('should render all card variants consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <Card variant="default" padding="medium">
              <Typography variant="h3">Default Card</Typography>
              <Typography variant="body">This is a default card with medium padding.</Typography>
            </Card>
            <Card variant="outlined" padding="medium">
              <Typography variant="h3">Outlined Card</Typography>
              <Typography variant="body">This is an outlined card with medium padding.</Typography>
            </Card>
            <Card variant="elevated" padding="medium">
              <Typography variant="h3">Elevated Card</Typography>
              <Typography variant="body">This is an elevated card with medium padding.</Typography>
            </Card>
            <Card variant="filled" padding="medium">
              <Typography variant="h3">Filled Card</Typography>
              <Typography variant="body">This is a filled card with medium padding.</Typography>
            </Card>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('card-variants-light-theme');
    });

    it('should render interactive cards consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card interactive padding="medium">
              <Typography variant="h4">Interactive Card</Typography>
              <Typography variant="body">This card responds to hover and click.</Typography>
            </Card>
            <Card padding="medium">
              <Typography variant="h4">Static Card</Typography>
              <Typography variant="body">This card does not respond to interactions.</Typography>
            </Card>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('card-interactive-light-theme');
    });
  });

  describe('Typography Component Visual Tests', () => {
    it('should render all typography variants consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Typography variant="h1">Heading 1 - Main Title</Typography>
            <Typography variant="h2">Heading 2 - Section Title</Typography>
            <Typography variant="h3">Heading 3 - Subsection Title</Typography>
            <Typography variant="h4">Heading 4 - Component Title</Typography>
            <Typography variant="h5">Heading 5 - Small Title</Typography>
            <Typography variant="h6">Heading 6 - Smallest Title</Typography>
            <Typography variant="body">
              Body text - This is the standard body text used for paragraphs and general content.
              It should be readable and comfortable for extended reading.
            </Typography>
            <Typography variant="caption">
              Caption text - This is smaller text used for captions, labels, and secondary information.
            </Typography>
            <Typography variant="overline">
              OVERLINE TEXT - THIS IS USED FOR LABELS AND CATEGORIES
            </Typography>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('typography-variants-light-theme');
    });

    it('should render typography colors consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Typography variant="h3" color="primary">Primary Color Text</Typography>
            <Typography variant="h3" color="secondary">Secondary Color Text</Typography>
            <Typography variant="h3" color="text">Default Text Color</Typography>
            <Typography variant="h3" color="muted">Muted Text Color</Typography>
            <Typography variant="h3" color="error">Error Text Color</Typography>
            <Typography variant="h3" color="success">Success Text Color</Typography>
            <Typography variant="h3" color="warning">Warning Text Color</Typography>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('typography-colors-light-theme');
    });
  });

  describe('Form Component Visual Tests', () => {
    it('should render complete form layout consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Form onSubmit={() => {}} data-testid="visual-form">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <Input name="firstName" label="First Name" placeholder="Enter first name" />
              <Input name="lastName" label="Last Name" placeholder="Enter last name" />
            </div>
            <Input name="email" label="Email Address" type="email" placeholder="Enter email" />
            <Textarea name="message" label="Message" placeholder="Enter your message" />
            <div style={{ display: 'flex', gap: '16px' }}>
              <Checkbox name="newsletter" label="Subscribe to newsletter" />
              <Checkbox name="terms" label="I agree to the terms and conditions" />
            </div>
            <Select 
              name="country" 
              label="Country" 
              options={[
                { value: 'us', label: 'United States' },
                { value: 'ca', label: 'Canada' },
                { value: 'uk', label: 'United Kingdom' }
              ]}
            />
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button">Cancel</Button>
              <Button variant="primary" type="submit">Submit</Button>
            </div>
          </Form>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('form-layout-light-theme');
    });
  });

  describe('Loading Component Visual Tests', () => {
    it('should render loading spinners consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner size="small" />
              <Typography variant="caption" style={{ marginTop: '8px' }}>Small</Typography>
            </div>
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner size="medium" />
              <Typography variant="caption" style={{ marginTop: '8px' }}>Medium</Typography>
            </div>
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner size="large" />
              <Typography variant="caption" style={{ marginTop: '8px' }}>Large</Typography>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginTop: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner color="primary" />
              <Typography variant="caption" style={{ marginTop: '8px' }}>Primary</Typography>
            </div>
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner color="secondary" />
              <Typography variant="caption" style={{ marginTop: '8px' }}>Secondary</Typography>
            </div>
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner color="muted" />
              <Typography variant="caption" style={{ marginTop: '8px' }}>Muted</Typography>
            </div>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('loading-spinners-light-theme');
    });
  });

  describe('Toast Component Visual Tests', () => {
    it('should render toast notifications consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Toast
              type="success"
              title="Success"
              message="Your action was completed successfully."
              onClose={() => {}}
            />
            <Toast
              type="error"
              title="Error"
              message="Something went wrong. Please try again."
              onClose={() => {}}
            />
            <Toast
              type="warning"
              title="Warning"
              message="Please review your input before continuing."
              onClose={() => {}}
            />
            <Toast
              type="info"
              title="Information"
              message="Here's some helpful information for you."
              onClose={() => {}}
            />
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('toast-notifications-light-theme');
    });
  });

  describe('Responsive Layout Visual Tests', () => {
    it('should render responsive layout consistently', () => {
      const { container } = render(
        <TestWrapper>
          <ResponsiveLayout>
            <Typography variant="h2">Responsive Layout Demo</Typography>
            <Typography variant="body">
              This layout adapts to different screen sizes and maintains proper spacing and alignment.
            </Typography>
          </ResponsiveLayout>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('responsive-layout-light-theme');
    });
  });

  describe('Dark Theme Visual Tests', () => {
    it('should render all components consistently in dark theme', () => {
      const { container } = render(
        <TestWrapper theme={darkTheme}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Typography variant="h2">Dark Theme Components</Typography>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <Input label="Dark Theme Input" placeholder="Enter text" />
              <Input label="Error Input" placeholder="Error state" error="Error message" />
            </div>
            
            <Card padding="medium">
              <Typography variant="h4">Dark Theme Card</Typography>
              <Typography variant="body">
                This card demonstrates how components look in dark theme.
              </Typography>
            </Card>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LoadingSpinner />
              <Typography variant="body">Loading in dark theme</Typography>
            </div>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('all-components-dark-theme');
    });
  });

  describe('Component Combinations Visual Tests', () => {
    it('should render complex component combinations consistently', () => {
      const { container } = render(
        <TestWrapper>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <Card padding="medium">
              <Typography variant="h4">Order Summary</Typography>
              <div style={{ marginTop: '16px' }}>
                <Typography variant="body">Pickup: 123 Main St</Typography>
                <Typography variant="body">Delivery: 456 Oak Ave</Typography>
                <Typography variant="body" color="primary">Total: $25.50</Typography>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Button variant="primary" fullWidth>Place Order</Button>
              </div>
            </Card>
            
            <Card padding="medium">
              <Typography variant="h4">Quick Actions</Typography>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <Button variant="outline" size="small">View Orders</Button>
                <Button variant="outline" size="small">Track Delivery</Button>
                <Button variant="outline" size="small">Contact Support</Button>
              </div>
            </Card>
            
            <Card padding="medium">
              <Typography variant="h4">Status</Typography>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <LoadingSpinner size="small" />
                <Typography variant="body">Processing...</Typography>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Typography variant="caption" color="muted">
                  Estimated completion: 5 minutes
                </Typography>
              </div>
            </Card>
          </div>
        </TestWrapper>
      );

      expect(container).toMatchSnapshot('component-combinations-light-theme');
    });
  });
});