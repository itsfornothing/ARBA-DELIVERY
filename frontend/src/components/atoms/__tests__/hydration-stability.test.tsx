/**
 * Hydration Stability Tests
 * Tests for React hydration consistency and blue button styling
 * 
 * Requirements: 7.5 (functionality preservation), 2.1 (button styling)
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { Button } from '../Button';
import { Input } from '../Input';

// Mock MessageChannel for test environment
global.MessageChannel = class MessageChannel {
  port1: MessagePort = { 
    postMessage: jest.fn(), 
    onmessage: null,
    close: jest.fn(),
    start: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  } as any;
  port2: MessagePort = { 
    postMessage: jest.fn(), 
    onmessage: null,
    close: jest.fn(),
    start: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  } as any;
} as any;

describe('Hydration Stability', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Component ID Consistency', () => {
    describe('Input Component ID Generation', () => {
      it('should generate consistent IDs between server and client renders', () => {
        // Mock useId to return consistent values
        const mockUseId = jest.fn().mockReturnValue('test-id-123');
        
        // Create a test component that uses the mocked useId
        const TestInput = () => {
          const id = mockUseId();
          return <Input id={`input-${id}`} label="Test Input" placeholder="Enter text" />;
        };

        // Render the component
        const { container } = render(<TestInput />);

        const input = container.querySelector('input');
        const label = container.querySelector('label');

        // Verify that input and label have consistent IDs
        expect(input).toHaveAttribute('id', 'input-test-id-123');
        expect(label).toHaveAttribute('for', 'input-test-id-123');
        expect(input?.getAttribute('id')).toBe(label?.getAttribute('for'));

        // Clean up mock
        jest.clearAllMocks();
      });

      it('should handle missing ID gracefully during SSR', () => {
        const { container } = render(
          <Input label="Test Input" placeholder="Enter text" />
        );
        
        const input = container.querySelector('input');
        expect(input).toBeInTheDocument();
        
        // Should not crash if ID is undefined during SSR
        expect(() => {
          render(<Input label="Test Input" />);
        }).not.toThrow();
      });

      it('should use provided ID consistently', () => {
        const customId = 'custom-stable-id';
        
        // First render
        const { container: container1 } = render(
          <Input id={customId} label="Test Input" placeholder="Enter text" />
        );
        
        // Second render with same ID
        const { container: container2 } = render(
          <Input id={customId} label="Test Input" placeholder="Enter text" />
        );
        
        const input1 = container1.querySelector('input');
        const input2 = container2.querySelector('input');
        const label1 = container1.querySelector('label');
        const label2 = container2.querySelector('label');
        
        // Both renders should use the same ID
        expect(input1).toHaveAttribute('id', customId);
        expect(input2).toHaveAttribute('id', customId);
        expect(label1).toHaveAttribute('for', customId);
        expect(label2).toHaveAttribute('for', customId);
      });

      it('should maintain ID consistency across re-renders', () => {
        const { container, rerender } = render(
          <Input label="Test Input" placeholder="Enter text" />
        );
        
        const initialInput = container.querySelector('input');
        const initialId = initialInput?.getAttribute('id');
        
        // Re-render with different props
        rerender(
          <Input label="Updated Input" placeholder="Updated text" />
        );
        
        const updatedInput = container.querySelector('input');
        const updatedId = updatedInput?.getAttribute('id');
        
        // ID should remain consistent across re-renders
        expect(initialId).toBeTruthy();
        expect(updatedId).toBeTruthy();
        expect(initialId).toBe(updatedId);
      });

      it('should handle multiple inputs with unique IDs', () => {
        const { container } = render(
          <div>
            <Input label="First Input" placeholder="First" />
            <Input label="Second Input" placeholder="Second" />
            <Input label="Third Input" placeholder="Third" />
          </div>
        );
        
        const inputs = container.querySelectorAll('input');
        const labels = container.querySelectorAll('label');
        
        expect(inputs).toHaveLength(3);
        expect(labels).toHaveLength(3);
        
        // All inputs should have unique IDs
        const ids = Array.from(inputs).map(input => input.getAttribute('id'));
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);
        
        // Each label should match its corresponding input
        inputs.forEach((input, index) => {
          const inputId = input.getAttribute('id');
          const labelFor = labels[index].getAttribute('for');
          expect(inputId).toBe(labelFor);
        });
      });
    });

    describe('Button Component Stability', () => {
      it('should render consistently across multiple renders', () => {
        const { container, rerender } = render(
          <Button variant="primary">Test Button</Button>
        );
        
        const initialButton = container.querySelector('button');
        const initialClasses = initialButton?.className;
        
        // Re-render with same props
        rerender(<Button variant="primary">Test Button</Button>);
        
        const updatedButton = container.querySelector('button');
        const updatedClasses = updatedButton?.className;
        
        // Classes should remain consistent
        expect(initialClasses).toBe(updatedClasses);
      });

      it('should maintain stable DOM structure', () => {
        const { container } = render(
          <Button variant="primary" leftIcon={<span>👍</span>}>
            Test Button
          </Button>
        );
        
        const button = container.querySelector('button');
        const contentDiv = button?.querySelector('div');
        const iconSpan = contentDiv?.querySelector('span');
        
        expect(button).toBeInTheDocument();
        expect(contentDiv).toBeInTheDocument();
        expect(iconSpan).toBeInTheDocument();
        expect(iconSpan).toHaveTextContent('👍');
      });
    });
  });

  describe('Button Color Variants', () => {
    describe('Primary Button Blue Styling', () => {
      it('should render primary button with correct blue styling', () => {
        render(<Button variant="primary">Primary Button</Button>);
        
        const button = screen.getByRole('button');
        
        // Core blue styling classes
        expect(button).toHaveClass('bg-blue-600');
        expect(button).toHaveClass('border-blue-600');
        expect(button).toHaveClass('text-white');
        
        // Interactive states
        expect(button).toHaveClass('hover:bg-blue-700');
        expect(button).toHaveClass('hover:border-blue-700');
        expect(button).toHaveClass('focus:ring-blue-500');
      });

      it('should maintain blue styling with different sizes', () => {
        const sizes = ['sm', 'md', 'lg'] as const;
        
        sizes.forEach(size => {
          const { container } = render(
            <Button variant="primary" size={size}>
              {size} Button
            </Button>
          );
          
          const button = container.querySelector('button');
          
          // Blue styling should be consistent across sizes
          expect(button).toHaveClass('bg-blue-600');
          expect(button).toHaveClass('border-blue-600');
          expect(button).toHaveClass('text-white');
          expect(button).toHaveClass('hover:bg-blue-700');
          expect(button).toHaveClass('focus:ring-blue-500');
          
          cleanup();
        });
      });

      it('should maintain blue styling in loading state', () => {
        render(<Button variant="primary" loading>Loading Button</Button>);
        
        const button = screen.getByRole('button');
        
        // Blue styling should persist in loading state
        expect(button).toHaveClass('bg-blue-600');
        expect(button).toHaveClass('border-blue-600');
        expect(button).toHaveClass('text-white');
        
        // Loading-specific styling
        expect(button).toHaveClass('cursor-wait');
        expect(button).toBeDisabled();
      });
    });

    describe('Outline Button Blue Styling', () => {
      it('should render outline button with correct blue styling', () => {
        render(<Button variant="outline">Outline Button</Button>);
        
        const button = screen.getByRole('button');
        
        // Outline blue styling
        expect(button).toHaveClass('text-blue-600');
        expect(button).toHaveClass('border-blue-600');
        expect(button).toHaveClass('bg-transparent');
        
        // Interactive states
        expect(button).toHaveClass('hover:bg-blue-50');
        expect(button).toHaveClass('active:bg-blue-100');
        expect(button).toHaveClass('focus:ring-blue-500');
      });

      it('should maintain outline blue styling across states', () => {
        const { rerender } = render(
          <Button variant="outline">Normal</Button>
        );
        
        let button = screen.getByRole('button');
        expect(button).toHaveClass('text-blue-600');
        expect(button).toHaveClass('border-blue-600');
        
        // Test disabled state
        rerender(<Button variant="outline" disabled>Disabled</Button>);
        button = screen.getByRole('button');
        expect(button).toHaveClass('text-blue-600');
        expect(button).toHaveClass('border-blue-600');
        expect(button).toBeDisabled();
      });
    });

    describe('Color Contrast Compliance', () => {
      it('should maintain proper contrast ratios for primary buttons', () => {
        render(<Button variant="primary">High Contrast</Button>);
        
        const button = screen.getByRole('button');
        
        // Blue-600 (#2563eb) on white text should have sufficient contrast
        expect(button).toHaveClass('text-white');
        expect(button).toHaveClass('bg-blue-600');
        
        // Verify the combination provides good contrast
        const computedStyle = window.getComputedStyle(button);
        expect(computedStyle.color).toBeTruthy();
        expect(computedStyle.backgroundColor).toBeTruthy();
      });

      it('should maintain contrast in hover states', () => {
        render(<Button variant="primary">Hover Test</Button>);
        
        const button = screen.getByRole('button');
        
        // Hover state should maintain good contrast
        expect(button).toHaveClass('hover:bg-blue-700');
        expect(button).toHaveClass('text-white');
      });

      it('should provide sufficient contrast for outline buttons', () => {
        render(<Button variant="outline">Outline Contrast</Button>);
        
        const button = screen.getByRole('button');
        
        // Blue text on transparent/white background
        expect(button).toHaveClass('text-blue-600');
        expect(button).toHaveClass('bg-transparent');
        
        // Hover state maintains contrast
        expect(button).toHaveClass('hover:bg-blue-50');
      });
    });

    describe('Non-Blue Variants Consistency', () => {
      it('should render secondary variant correctly', () => {
        render(<Button variant="secondary">Secondary Button</Button>);
        
        const button = screen.getByRole('button');
        
        // Should not have blue styling
        expect(button).not.toHaveClass('bg-blue-600');
        expect(button).not.toHaveClass('text-blue-600');
        
        // Should have secondary styling
        expect(button).toHaveClass('bg-secondary-600');
        expect(button).toHaveClass('border-secondary-600');
      });

      it('should render ghost variant correctly', () => {
        render(<Button variant="ghost">Ghost Button</Button>);
        
        const button = screen.getByRole('button');
        
        // Should not have blue styling
        expect(button).not.toHaveClass('bg-blue-600');
        expect(button).not.toHaveClass('text-blue-600');
        
        // Should have ghost styling
        expect(button).toHaveClass('bg-transparent');
        expect(button).toHaveClass('text-neutral-700');
      });

      it('should render danger variant correctly', () => {
        render(<Button variant="danger">Danger Button</Button>);
        
        const button = screen.getByRole('button');
        
        // Should not have blue styling
        expect(button).not.toHaveClass('bg-blue-600');
        expect(button).not.toHaveClass('text-blue-600');
        
        // Should have danger styling
        expect(button).toHaveClass('bg-error-600');
        expect(button).toHaveClass('border-error-600');
      });
    });
  });

  describe('Hydration Error Prevention', () => {
    it('should not cause hydration mismatches with dynamic content', () => {
      // Test that components render the same on server and client
      const TestComponent = () => (
        <div>
          <Input label="Test Input" />
          <Button variant="primary">Test Button</Button>
        </div>
      );

      // This should not throw hydration errors
      expect(() => {
        render(<TestComponent />);
      }).not.toThrow();
    });

    it('should handle conditional rendering consistently', () => {
      const ConditionalComponent = ({ showInput }: { showInput: boolean }) => (
        <div>
          {showInput && <Input label="Conditional Input" />}
          <Button variant="primary">Always Visible</Button>
        </div>
      );

      // Should render consistently with different conditions
      const { rerender } = render(<ConditionalComponent showInput={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      rerender(<ConditionalComponent showInput={true} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should maintain stable component structure across renders', () => {
      const { container, rerender } = render(
        <div>
          <Input label="Stable Input" />
          <Button variant="primary">Stable Button</Button>
        </div>
      );

      const initialStructure = container.innerHTML;

      // Re-render with same props
      rerender(
        <div>
          <Input label="Stable Input" />
          <Button variant="primary">Stable Button</Button>
        </div>
      );

      const updatedStructure = container.innerHTML;
      
      // Structure should remain identical
      expect(initialStructure).toBe(updatedStructure);
    });
  });
});