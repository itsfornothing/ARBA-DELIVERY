/**
 * Basic UI Integration Tests
 * 
 * Simplified integration tests to verify core UI functionality works together.
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
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
  useInView: () => true,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme={defaultTheme}>
    <div style={{ padding: '16px' }}>
      {children}
    </div>
  </ThemeProvider>
);

describe('Basic UI Integration Tests', () => {
  it('should render basic components together', () => {
    render(
      <TestWrapper>
        <div data-testid="basic-integration">
          <Typography variant="h1" data-testid="title">Test Page</Typography>
          <Card data-testid="test-card">
            <Typography variant="h3">Card Title</Typography>
            <Typography variant="body1">Card content goes here.</Typography>
            <Button variant="primary" data-testid="card-button">
              Action Button
            </Button>
          </Card>
          <Input 
            label="Test Input" 
            placeholder="Enter text"
            data-testid="test-input"
          />
        </div>
      </TestWrapper>
    );

    // Verify all components are rendered
    expect(screen.getByTestId('basic-integration')).toBeInTheDocument();
    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
    expect(screen.getByTestId('card-button')).toBeInTheDocument();
    expect(screen.getByTestId('test-input')).toBeInTheDocument();

    // Verify content
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    let buttonClicked = false;
    
    const handleClick = () => {
      buttonClicked = true;
    };

    render(
      <TestWrapper>
        <div data-testid="interaction-test">
          <Button 
            onClick={handleClick}
            data-testid="interactive-button"
          >
            Click Me
          </Button>
          <Input 
            label="Interactive Input"
            data-testid="interactive-input"
          />
        </div>
      </TestWrapper>
    );

    // Test button interaction
    const button = screen.getByTestId('interactive-button');
    await user.click(button);
    expect(buttonClicked).toBe(true);

    // Test input interaction
    const input = screen.getByTestId('interactive-input');
    await user.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('should maintain theme consistency', () => {
    render(
      <TestWrapper>
        <div data-testid="theme-test">
          <Button variant="primary" data-testid="themed-button">
            Primary Button
          </Button>
          <Card data-testid="themed-card">
            <Typography variant="h3" data-testid="themed-text">
              Themed Content
            </Typography>
          </Card>
        </div>
      </TestWrapper>
    );

    // Verify components are rendered with theme
    const button = screen.getByTestId('themed-button');
    const card = screen.getByTestId('themed-card');
    const text = screen.getByTestId('themed-text');

    expect(button).toBeInTheDocument();
    expect(card).toBeInTheDocument();
    expect(text).toBeInTheDocument();

    // Verify theme is applied (check for styled-components classes)
    expect(button.className).toContain('sc-');
    expect(card.className).toContain('sc-');
  });

  it('should handle responsive behavior', () => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width: 768px'),
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

    // Verify responsive layout is rendered
    expect(screen.getByTestId('responsive-test')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-card-2')).toBeInTheDocument();
  });

  it('should provide accessibility features', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <div data-testid="accessibility-test">
          <Button 
            aria-label="Accessible button"
            data-testid="accessible-button"
          >
            Submit
          </Button>
          <Input 
            label="Accessible Input"
            aria-describedby="input-help"
            data-testid="accessible-input"
          />
          <div id="input-help">Help text for the input</div>
        </div>
      </TestWrapper>
    );

    // Verify accessibility attributes
    const button = screen.getByTestId('accessible-button');
    const input = screen.getByTestId('accessible-input');

    expect(button).toHaveAttribute('aria-label', 'Accessible button');
    expect(input).toHaveAttribute('aria-describedby', 'input-help');

    // Test keyboard navigation
    await user.tab();
    expect(button).toHaveFocus();

    await user.tab();
    expect(input).toHaveFocus();
  });
});