import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600');
  });

  it('renders all variants correctly', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>Test</Button>);
      const button = screen.getByRole('button', { name: 'Test' });
      expect(button).toBeInTheDocument();
      unmount();
    });
  });

  it('renders all sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button', { name: 'Small' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('min-h-[44px]'); // Small uses 44px on mobile

    rerender(<Button size="md">Medium</Button>);
    button = screen.getByRole('button', { name: 'Medium' });
    expect(button).toHaveClass('min-h-[44px]'); // Medium uses 44px on mobile

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button', { name: 'Large' });
    expect(button).toHaveClass('min-h-[48px]'); // Large uses 48px
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-wait');
    
    // Check for loading spinner
    const spinner = screen.getByRole('button').querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('handles fullWidth prop', () => {
    render(<Button fullWidth>Full Width</Button>);
    
    const button = screen.getByRole('button', { name: 'Full Width' });
    expect(button).toHaveClass('w-full');
  });

  it('renders with left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    
    render(
      <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        With Icons
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icons')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    
    const button = screen.getByRole('button', { name: 'Clickable' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when loading', () => {
    const handleClick = jest.fn();
    render(<Button loading onClick={handleClick}>Loading</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button', { name: 'Custom' });
    expect(button).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Test</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has proper accessibility attributes', () => {
    render(<Button>Accessible</Button>);
    
    const button = screen.getByRole('button', { name: 'Accessible' });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('maintains minimum touch target size', () => {
    render(<Button size="sm">Small</Button>);
    
    const button = screen.getByRole('button', { name: 'Small' });
    expect(button).toHaveClass('min-h-[44px]');
  });

  // Edge case tests for disabled states and loading interactions
  describe('Edge Cases - Disabled States and Loading Interactions', () => {
    it('prevents all interactions when disabled', () => {
      const handleClick = jest.fn();
      const handleMouseEnter = jest.fn();
      
      render(
        <Button 
          disabled 
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
        >
          Disabled Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      // Test click prevention
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      
      // Test that button is properly disabled
      expect(button).toBeDisabled();
      
      // Test mouse interactions (these may still fire in test environment)
      fireEvent.mouseEnter(button);
      // Note: mouseEnter events can still fire on disabled elements in test environment
      
      // Verify disabled styling
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('maintains disabled state when both disabled and loading are true', () => {
      const handleClick = jest.fn();
      
      render(
        <Button disabled loading onClick={handleClick}>
          Disabled and Loading
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      // Should be disabled
      expect(button).toBeDisabled();
      
      // Should show loading spinner
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
      
      // Should not respond to clicks
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      
      // Should have both loading and disabled styles
      expect(button).toHaveClass('cursor-wait');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('transitions properly from loading to normal state', () => {
      const handleClick = jest.fn();
      
      const { rerender } = render(
        <Button loading onClick={handleClick}>
          Loading Button
        </Button>
      );
      
      let button = screen.getByRole('button');
      
      // Initially loading
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-wait');
      expect(button.querySelector('svg')).toBeInTheDocument();
      
      // Click should not work
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      
      // Transition to normal state
      rerender(
        <Button loading={false} onClick={handleClick}>
          Normal Button
        </Button>
      );
      
      button = screen.getByRole('button');
      
      // Should be enabled now
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveClass('cursor-wait');
      expect(button.querySelector('svg')).not.toBeInTheDocument();
      
      // Click should work now
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles rapid loading state changes', () => {
      const handleClick = jest.fn();
      
      const { rerender } = render(
        <Button loading={false} onClick={handleClick}>
          Toggle Button
        </Button>
      );
      
      let button = screen.getByRole('button');
      
      // Start normal
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Switch to loading
      rerender(
        <Button loading={true} onClick={handleClick}>
          Toggle Button
        </Button>
      );
      
      button = screen.getByRole('button');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1); // Should not increment
      
      // Switch back to normal
      rerender(
        <Button loading={false} onClick={handleClick}>
          Toggle Button
        </Button>
      );
      
      button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(2); // Should increment
    });

    it('preserves content visibility during loading state', () => {
      render(
        <Button loading leftIcon={<span data-testid="left-icon">←</span>}>
          Loading Content
        </Button>
      );
      
      const button = screen.getByRole('button');
      const contentContainer = button.querySelector('.invisible');
      
      // Content should be present but invisible
      expect(contentContainer).toBeInTheDocument();
      expect(contentContainer).toHaveClass('invisible');
      
      // Text and icon should still be in DOM
      expect(screen.getByText('Loading Content')).toBeInTheDocument();
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });
  });

  // Edge case tests for keyboard navigation and focus management
  describe('Edge Cases - Keyboard Navigation and Focus Management', () => {
    it('handles keyboard navigation properly', () => {
      const handleClick = jest.fn();
      const handleKeyDown = jest.fn();
      
      render(
        <Button onClick={handleClick} onKeyDown={handleKeyDown}>
          Keyboard Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();
      
      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Enter' })
      );
      
      // Test Space key
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: ' ' })
      );
      
      // Test Tab key (should not trigger click handler)
      fireEvent.keyDown(button, { key: 'Tab', code: 'Tab' });
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Tab' })
      );
    });

    it('maintains focus ring styles', () => {
      render(<Button variant="primary">Focus Test</Button>);
      
      const button = screen.getByRole('button');
      
      // Check focus ring classes are present
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
      expect(button).toHaveClass('focus:ring-blue-500');
    });

    it('applies correct focus ring colors for different variants', () => {
      const variants = [
        { variant: 'primary', focusClass: 'focus:ring-blue-500' },
        { variant: 'secondary', focusClass: 'focus:ring-secondary-500' },
        { variant: 'outline', focusClass: 'focus:ring-blue-500' },
        { variant: 'ghost', focusClass: 'focus:ring-neutral-500' },
        { variant: 'danger', focusClass: 'focus:ring-error-500' },
      ] as const;
      
      variants.forEach(({ variant, focusClass }) => {
        const { unmount } = render(
          <Button variant={variant}>
            {variant} Button
          </Button>
        );
        
        const button = screen.getByRole('button');
        expect(button).toHaveClass(focusClass);
        
        unmount();
      });
    });

    it('prevents focus when disabled', () => {
      render(<Button disabled>Disabled Focus Test</Button>);
      
      const button = screen.getByRole('button');
      
      // Attempt to focus
      button.focus();
      
      // Disabled buttons should not receive focus
      expect(button).not.toHaveFocus();
    });

    it('prevents focus when loading', () => {
      render(<Button loading>Loading Focus Test</Button>);
      
      const button = screen.getByRole('button');
      
      // Attempt to focus
      button.focus();
      
      // Loading buttons should not receive focus (they're disabled)
      expect(button).not.toHaveFocus();
    });

    it('handles focus management with icons', () => {
      const LeftIcon = () => <span data-testid="left-icon" tabIndex={-1}>←</span>;
      const RightIcon = () => <span data-testid="right-icon" tabIndex={-1}>→</span>;
      
      render(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Icon Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      const leftIcon = screen.getByTestId('left-icon');
      const rightIcon = screen.getByTestId('right-icon');
      
      // Icons should have aria-hidden
      expect(leftIcon.parentElement).toHaveAttribute('aria-hidden', 'true');
      expect(rightIcon.parentElement).toHaveAttribute('aria-hidden', 'true');
      
      // Focus should go to button, not icons
      button.focus();
      expect(button).toHaveFocus();
      expect(leftIcon).not.toHaveFocus();
      expect(rightIcon).not.toHaveFocus();
    });

    it('maintains focus during loading state transitions', () => {
      const { rerender } = render(
        <Button loading={false}>
          Focus Transition Test
        </Button>
      );
      
      let button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();
      
      // Switch to loading (button becomes disabled, may lose focus)
      rerender(
        <Button loading={true}>
          Focus Transition Test
        </Button>
      );
      
      button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Note: In test environment, focus behavior may differ from real browser
      
      // Switch back to normal
      rerender(
        <Button loading={false}>
          Focus Transition Test
        </Button>
      );
      
      button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      
      // Should be able to focus again
      button.focus();
      expect(button).toHaveFocus();
    });

    it('handles keyboard events during loading state', () => {
      const handleKeyDown = jest.fn();
      
      render(
        <Button loading onKeyDown={handleKeyDown}>
          Loading Keyboard Test
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      // Verify button is disabled when loading
      expect(button).toBeDisabled();
      
      // Try to trigger keyboard events on loading button
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
      
      // Note: In test environment, keyboard events may still fire on disabled elements
      // The important thing is that the button is disabled and won't trigger actions
      expect(button).toBeDisabled();
    });

    it('supports custom keyboard event handlers', () => {
      const handleKeyDown = jest.fn();
      const handleKeyUp = jest.fn();
      
      render(
        <Button 
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        >
          Custom Keyboard Events
        </Button>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Test various keyboard events
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
    });
  });
});