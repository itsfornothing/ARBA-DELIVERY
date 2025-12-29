/**
 * Basic Cross-Browser Compatibility Tests
 * 
 * Simplified tests to verify core UI components work across different browsers.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme } from '@/lib/theme';

// Import basic components
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Browser user agents for testing
const BROWSER_USER_AGENTS = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
};

const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: userAgent,
  });
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme={defaultTheme}>
    <div style={{ padding: '16px' }}>
      {children}
    </div>
  </ThemeProvider>
);

describe('Basic Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserAgent(BROWSER_USER_AGENTS.chrome);
  });

  describe('Chrome Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.chrome);
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

    it('should handle interactions in Chrome', async () => {
      const user = userEvent.setup();
      let clicked = false;
      
      render(
        <TestWrapper>
          <Button 
            onClick={() => { clicked = true; }}
            data-testid="chrome-interactive-button"
          >
            Click Me
          </Button>
        </TestWrapper>
      );

      const button = screen.getByTestId('chrome-interactive-button');
      await user.click(button);
      expect(clicked).toBe(true);
    });
  });

  describe('Firefox Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.firefox);
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
      
      render(
        <TestWrapper>
          <div data-testid="firefox-form-test">
            <Input 
              label="Firefox Email Input"
              type="email"
              data-testid="firefox-email-input"
            />
            <Button data-testid="firefox-submit-button">Submit</Button>
          </div>
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('firefox-email-input');
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Safari Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.safari);
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

    it('should handle touch interactions in Safari', () => {
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
      fireEvent.touchStart(button, mockTouchEvent);
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSER_USER_AGENTS.edge);
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

  describe('CSS Feature Support', () => {
    it('should handle CSS Grid support detection', () => {
      // Mock CSS.supports for Grid
      if (typeof CSS !== 'undefined' && CSS.supports && typeof CSS.supports === 'function') {
        jest.spyOn(CSS, 'supports').mockImplementation((property: string, value?: string) => {
          if (property === 'display' && value === 'grid') {
            return true;
          }
          return true;
        });
      }

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
      // Mock CSS.supports for no Grid support
      if (typeof CSS !== 'undefined' && CSS.supports && typeof CSS.supports === 'function') {
        jest.spyOn(CSS, 'supports').mockImplementation((property: string, value?: string) => {
          if (property === 'display' && value === 'grid') {
            return false;
          }
          return true;
        });
      }

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
              {Array.from({ length: 10 }, (_, i) => (
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
        expect(screen.getByTestId(`${browser}-card-9`)).toBeInTheDocument();
        
        // Performance should be reasonable (less than 50ms for 10 cards)
        expect(renderTime).toBeLessThan(50);
        
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
                data-testid={`${browser}-a11y-input`}
              />
            </div>
          </TestWrapper>
        );
        
        const button = screen.getByTestId(`${browser}-a11y-button`);
        const input = screen.getByTestId(`${browser}-a11y-input`);
        
        // Verify accessibility attributes are present
        expect(button).toHaveAttribute('aria-label', `${browser} accessible button`);
        expect(button).toBeInTheDocument();
        expect(input).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle viewport changes across browsers', () => {
      const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      render(
        <TestWrapper>
          <div data-testid="responsive-test">
            <div style={{ 
              display: 'flex', 
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              gap: '16px'
            }}>
              <Card data-testid="responsive-card-1">Card 1</Card>
              <Card data-testid="responsive-card-2">Card 2</Card>
            </div>
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('responsive-test')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-card-2')).toBeInTheDocument();
    });
  });
});