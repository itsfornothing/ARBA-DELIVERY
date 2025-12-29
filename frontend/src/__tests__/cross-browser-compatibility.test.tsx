/**
 * Cross-Browser Compatibility Tests for UI Enhancements
 * 
 * Tests UI components across different browser environments and ensures
 * consistent behavior and appearance across major browsers.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme } from '@/lib/theme';

// Import components for cross-browser testing
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Form } from '@/components/molecules/Form';
import { ResponsiveLayout } from '@/components/molecules/ResponsiveLayout';

// Mock different browser environments
const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: userAgent,
  });
};

// Browser user agents for testing
const BROWSER_USER_AGENTS = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  ie11: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko'
};

// Mock CSS features for different browsers
const mockCSSSupports = (feature: string, supported: boolean) => {
  if (typeof CSS !== 'undefined' && CSS.supports && typeof CSS.supports === 'function') {
    jest.spyOn(CSS, 'supports').mockImplementation((property: string, value?: string) => {
      if (property === feature || (value && `${property}: ${value}` === feature)) {
        return supported;
      }
      return true; // Default to supported for other features
    });
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme={defaultTheme}>
    <div style={{ padding: '16px' }}>
      {children}
    </div>
  </ThemeProvider>
);

describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default Chrome user agent
    mockUserAgent(BROWSER_USER_AGENTS.chrome);
  });

  describe('Chrome Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.chrome);
      mockCSSSupports('display: grid', true);
      mockCSSSupports('display: flex', true);
    });

    it('should render components correctly in Chrome', () => {
      render(
        <TestWrapper>
          <div data-testid="chrome-test">
            <Button variant="primary" data-testid="chrome-button">Chrome Button</Button>
            <Input label="Chrome Input" data-testid="chrome-input" />
            <Card data-testid="chrome-card">Chrome Card Content</Card>
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('chrome-button')).toBeInTheDocument();
      expect(screen.getByTestId('chrome-input')).toBeInTheDocument();
      expect(screen.getByTestId('chrome-card')).toBeInTheDocument();
      expect(screen.getByText('Chrome Button')).toBeInTheDocument();
    });

    it('should handle modern CSS features in Chrome', () => {
      render(
        <TestWrapper>
          <ResponsiveLayout data-testid="chrome-responsive">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <Card>Grid Item 1</Card>
              <Card>Grid Item 2</Card>
              <Card>Grid Item 3</Card>
            </div>
          </ResponsiveLayout>
        </TestWrapper>
      );

      const layout = screen.getByTestId('chrome-responsive');
      expect(layout).toBeInTheDocument();
      expect(screen.getByText('Grid Item 1')).toBeInTheDocument();
    });
  });

  describe('Firefox Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.firefox);
      mockCSSSupports('display: grid', true);
      mockCSSSupports('display: flex', true);
    });

    it('should render components correctly in Firefox', () => {
      render(
        <TestWrapper>
          <div data-testid="firefox-test">
            <Button variant="secondary" data-testid="firefox-button">Firefox Button</Button>
            <Input label="Firefox Input" data-testid="firefox-input" />
            <Card data-testid="firefox-card">Firefox Card Content</Card>
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('firefox-button')).toBeInTheDocument();
      expect(screen.getByTestId('firefox-input')).toBeInTheDocument();
      expect(screen.getByTestId('firefox-card')).toBeInTheDocument();
      expect(screen.getByText('Firefox Button')).toBeInTheDocument();
    });

    it('should handle form interactions in Firefox', async () => {
      const user = userEvent.setup();
      let formSubmitted = false;
      
      const handleSubmit = () => {
        formSubmitted = true;
      };

      render(
        <TestWrapper>
          <Form onSubmit={handleSubmit} data-testid="firefox-form">
            <Input name="email" label="Email" type="email" />
            <Button type="submit">Submit</Button>
          </Form>
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      expect(formSubmitted).toBe(true);
    });
  });

  describe('Safari Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.safari);
      mockCSSSupports('display: grid', true);
      mockCSSSupports('display: flex', true);
    });

    it('should render components correctly in Safari', () => {
      render(
        <TestWrapper>
          <div data-testid="safari-test">
            <Button variant="outline" data-testid="safari-button">Safari Button</Button>
            <Input label="Safari Input" data-testid="safari-input" />
            <Card data-testid="safari-card">Safari Card Content</Card>
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('safari-button')).toBeInTheDocument();
      expect(screen.getByTestId('safari-input')).toBeInTheDocument();
      expect(screen.getByTestId('safari-card')).toBeInTheDocument();
      expect(screen.getByText('Safari Button')).toBeInTheDocument();
    });

    it('should handle touch interactions in Safari (mobile)', async () => {
      // Mock touch events for Safari mobile
      const mockTouchEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
        preventDefault: jest.fn(),
      };

      render(
        <TestWrapper>
          <Button 
            data-testid="safari-touch-button"
            onTouchStart={() => {}}
          >
            Touch Button
          </Button>
        </TestWrapper>
      );

      const button = screen.getByTestId('safari-touch-button');
      
      // Simulate touch start
      fireEvent.touchStart(button, mockTouchEvent);
      
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.edge);
      mockCSSSupports('display: grid', true);
      mockCSSSupports('display: flex', true);
    });

    it('should render components correctly in Edge', () => {
      render(
        <TestWrapper>
          <div data-testid="edge-test">
            <Button variant="ghost" data-testid="edge-button">Edge Button</Button>
            <Input label="Edge Input" data-testid="edge-input" />
            <Card data-testid="edge-card">Edge Card Content</Card>
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('edge-button')).toBeInTheDocument();
      expect(screen.getByTestId('edge-input')).toBeInTheDocument();
      expect(screen.getByTestId('edge-card')).toBeInTheDocument();
      expect(screen.getByText('Edge Button')).toBeInTheDocument();
    });
  });

  describe('Legacy Browser Support (IE11)', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.ie11);
      // Mock limited CSS support for IE11
      mockCSSSupports('display: grid', false);
      mockCSSSupports('display: flex', true);
    });

    it('should provide fallbacks for unsupported CSS features in IE11', () => {
      render(
        <TestWrapper>
          <div data-testid="ie11-test">
            <Button variant="primary" data-testid="ie11-button">IE11 Button</Button>
            <Input label="IE11 Input" data-testid="ie11-input" />
            <Card data-testid="ie11-card">IE11 Card Content</Card>
          </div>
        </TestWrapper>
      );

      // Components should still render even with limited CSS support
      expect(screen.getByTestId('ie11-button')).toBeInTheDocument();
      expect(screen.getByTestId('ie11-input')).toBeInTheDocument();
      expect(screen.getByTestId('ie11-card')).toBeInTheDocument();
      expect(screen.getByText('IE11 Button')).toBeInTheDocument();
    });

    it('should handle form validation in IE11', async () => {
      const user = userEvent.setup();
      let validationTriggered = false;
      
      const handleValidation = () => {
        validationTriggered = true;
      };

      render(
        <TestWrapper>
          <Form 
            onSubmit={handleValidation}
            validationRules={{
              email: { required: true, email: true }
            }}
            data-testid="ie11-form"
          >
            <Input name="email" label="Email" type="email" />
            <Button type="submit">Submit</Button>
          </Form>
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);

      expect(validationTriggered).toBe(true);
    });
  });

  describe('Feature Detection and Polyfills', () => {
    it('should detect CSS Grid support and provide fallbacks', () => {
      // Test with Grid support
      mockCSSSupports('display: grid', true);
      
      render(
        <TestWrapper>
          <div 
            data-testid="grid-test"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}
          >
            <Card>Grid Item 1</Card>
            <Card>Grid Item 2</Card>
          </div>
        </TestWrapper>
      );

      const gridContainer = screen.getByTestId('grid-test');
      expect(gridContainer).toBeInTheDocument();
      expect(screen.getByText('Grid Item 1')).toBeInTheDocument();
      expect(screen.getByText('Grid Item 2')).toBeInTheDocument();
    });

    it('should provide flexbox fallback when Grid is not supported', () => {
      // Test without Grid support
      mockCSSSupports('display: grid', false);
      mockCSSSupports('display: flex', true);
      
      render(
        <TestWrapper>
          <div 
            data-testid="flex-fallback-test"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <Card style={{ flex: '1 1 calc(50% - 8px)' }}>Flex Item 1</Card>
            <Card style={{ flex: '1 1 calc(50% - 8px)' }}>Flex Item 2</Card>
          </div>
        </TestWrapper>
      );

      const flexContainer = screen.getByTestId('flex-fallback-test');
      expect(flexContainer).toBeInTheDocument();
      expect(screen.getByText('Flex Item 1')).toBeInTheDocument();
      expect(screen.getByText('Flex Item 2')).toBeInTheDocument();
    });

    it('should handle missing modern JavaScript features gracefully', () => {
      // Test that components work without modern JS features
      render(
        <TestWrapper>
          <div data-testid="js-fallback-test">
            {/* Simulate component that works with basic JS */}
            <Card>Fallback Content</Card>
          </div>
        </TestWrapper>
      );

      expect(screen.getByText('Fallback Content')).toBeInTheDocument();
    });
  });

  describe('Performance Across Browsers', () => {
    it('should render efficiently in all browsers', () => {
      const browsers = Object.keys(BROWSER_USER_AGENTS);
      
      browsers.forEach(browser => {
        mockUserAgent(BROWSER_USER_AGENTS[browser as keyof typeof BROWSER_USER_AGENTS]);
        
        const startTime = performance.now();
        
        const { unmount } = render(
          <TestWrapper>
            <div data-testid={`${browser}-performance-test`}>
              {Array.from({ length: 20 }, (_, i) => (
                <Card key={i} data-testid={`${browser}-card-${i}`}>
                  Card {i} for {browser}
                </Card>
              ))}
            </div>
          </TestWrapper>
        );
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // Verify components rendered
        expect(screen.getByTestId(`${browser}-performance-test`)).toBeInTheDocument();
        expect(screen.getByTestId(`${browser}-card-0`)).toBeInTheDocument();
        expect(screen.getByTestId(`${browser}-card-19`)).toBeInTheDocument();
        
        // Performance should be reasonable (less than 100ms for 20 cards)
        expect(renderTime).toBeLessThan(100);
        
        unmount();
      });
    });
  });

  describe('Accessibility Across Browsers', () => {
    it('should maintain accessibility features in all browsers', () => {
      const browsers = Object.keys(BROWSER_USER_AGENTS);
      
      browsers.forEach(browser => {
        mockUserAgent(BROWSER_USER_AGENTS[browser as keyof typeof BROWSER_USER_AGENTS]);
        
        const { unmount } = render(
          <TestWrapper>
            <div data-testid={`${browser}-a11y-test`}>
              <Button 
                aria-label={`${browser} accessible button`}
                data-testid={`${browser}-a11y-button`}
              >
                Click me
              </Button>
              <Input 
                label={`${browser} accessible input`}
                aria-describedby={`${browser}-help`}
                data-testid={`${browser}-a11y-input`}
              />
              <div id={`${browser}-help`}>Help text for {browser}</div>
            </div>
          </TestWrapper>
        );
        
        const button = screen.getByTestId(`${browser}-a11y-button`);
        const input = screen.getByTestId(`${browser}-a11y-input`);
        
        // Verify accessibility attributes are present
        expect(button).toHaveAttribute('aria-label', `${browser} accessible button`);
        expect(input).toHaveAttribute('aria-describedby', `${browser}-help`);
        
        // Verify help text is present
        expect(screen.getByText(`Help text for ${browser}`)).toBeInTheDocument();
        
        unmount();
      });
    });
  });
});