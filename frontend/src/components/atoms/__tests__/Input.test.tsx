import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Enhanced Input Component', () => {
  it('renders with basic props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('shows helper text when provided', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('renders with left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">@</span>;
    render(<Input leftIcon={<LeftIcon />} placeholder="Username" />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const RightIcon = () => <span data-testid="right-icon">👁</span>;
    render(<Input rightIcon={<RightIcon />} placeholder="Password" />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Input size="sm" data-testid="input-sm" />);
    expect(screen.getByTestId('input-sm')).toHaveClass('h-11'); // Mobile-first: h-11 on mobile, h-9 on desktop

    rerender(<Input size="md" data-testid="input-md" />);
    expect(screen.getByTestId('input-md')).toHaveClass('h-12'); // Mobile-first: h-12 on mobile, h-11 on desktop

    rerender(<Input size="lg" data-testid="input-lg" />);
    expect(screen.getByTestId('input-lg')).toHaveClass('h-14'); // Mobile-first: h-14 on mobile, h-12 on desktop
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<Input variant="default" data-testid="input-default" />);
    expect(screen.getByTestId('input-default')).toHaveClass('bg-white');

    rerender(<Input variant="filled" data-testid="input-filled" />);
    expect(screen.getByTestId('input-filled')).toHaveClass('bg-neutral-100');

    rerender(<Input variant="outlined" data-testid="input-outlined" />);
    expect(screen.getByTestId('input-outlined')).toHaveClass('bg-transparent');
  });

  it('handles focus and blur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    render(<Input onFocus={onFocus} onBlur={onBlur} placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input');
    
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('applies fullWidth prop correctly', () => {
    const { container } = render(<Input fullWidth data-testid="full-width-input" />);
    const inputContainer = container.firstChild;
    expect(inputContainer).toHaveClass('w-full');
  });

  it('shows error styling when error is present', () => {
    render(<Input error="Invalid input" data-testid="error-input" />);
    const input = screen.getByTestId('error-input');
    expect(input).toHaveClass('border-error-500');
  });

  it('is accessible with proper ARIA attributes', () => {
    render(<Input label="Email" error="Email is required" id="email-input" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email-input');
  });

  it('handles controlled input correctly', () => {
    const onChange = jest.fn();
    render(<Input value="test value" onChange={onChange} data-testid="controlled-input" />);
    
    const input = screen.getByTestId('controlled-input') as HTMLInputElement;
    expect(input.value).toBe('test value');
    
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(onChange).toHaveBeenCalled();
  });

  // Task 3.2 specific tests: Error state handling and validation display
  describe('Error State Handling and Validation Display', () => {
    it('displays error message with proper styling', () => {
      render(<Input label="Email" error="Please enter a valid email address" />);
      
      const errorMessage = screen.getByText('Please enter a valid email address');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-error-500');
    });

    it('prioritizes error message over helper text', () => {
      render(
        <Input 
          label="Email" 
          error="Email is required" 
          helperText="Enter your email address" 
        />
      );
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();
    });

    it('applies error styling to input field when error is present', () => {
      render(<Input label="Email" error="Invalid email" data-testid="error-input" />);
      
      const input = screen.getByTestId('error-input');
      expect(input).toHaveClass('border-error-500');
      expect(input).toHaveClass('focus:border-error-500');
      expect(input).toHaveClass('focus:ring-error-500/20');
    });

    it('applies error styling to floating label when error is present', async () => {
      render(<Input label="Email" error="Invalid email" />);
      
      const input = screen.getByLabelText('Email');
      fireEvent.focus(input);
      
      await waitFor(() => {
        const label = screen.getByText('Email');
        expect(label).toHaveClass('text-error-500');
      });
    });

    it('removes error styling when error is cleared', () => {
      const { rerender } = render(<Input label="Email" error="Invalid email" data-testid="input" />);
      
      let input = screen.getByTestId('input');
      expect(input).toHaveClass('border-error-500');
      
      rerender(<Input label="Email" data-testid="input" />);
      
      input = screen.getByTestId('input');
      expect(input).not.toHaveClass('border-error-500');
      expect(input).toHaveClass('border-neutral-300');
    });

    it('shows validation error with animation', async () => {
      const { rerender } = render(<Input label="Email" />);
      
      rerender(<Input label="Email" error="Email is required" />);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Email is required');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('handles multiple validation states correctly', () => {
      const { rerender } = render(<Input label="Password" helperText="Enter password" />);
      
      // Helper text initially
      expect(screen.getByText('Enter password')).toBeInTheDocument();
      expect(screen.getByText('Enter password')).toHaveClass('text-neutral-500');
      
      // Error state
      rerender(<Input label="Password" error="Password too short" />);
      expect(screen.getByText('Password too short')).toBeInTheDocument();
      expect(screen.getByText('Password too short')).toHaveClass('text-error-500');
      expect(screen.queryByText('Enter password')).not.toBeInTheDocument();
      
      // Back to helper text
      rerender(<Input label="Password" helperText="Enter password" />);
      expect(screen.getByText('Enter password')).toBeInTheDocument();
      expect(screen.getByText('Enter password')).toHaveClass('text-neutral-500');
    });
  });

  // Task 3.2 specific tests: Accessibility attributes and keyboard navigation
  describe('Accessibility Attributes and Keyboard Navigation', () => {
    it('generates unique IDs when not provided', () => {
      render(
        <div>
          <Input label="First Name" data-testid="input1" />
          <Input label="Last Name" data-testid="input2" />
        </div>
      );
      
      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');
      
      expect(input1).toHaveAttribute('id');
      expect(input2).toHaveAttribute('id');
      expect(input1.getAttribute('id')).not.toBe(input2.getAttribute('id'));
    });

    it('uses provided ID when specified', () => {
      render(<Input label="Email" id="custom-email-input" />);
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'custom-email-input');
    });

    it('associates label with input using htmlFor', () => {
      render(<Input label="Email Address" id="email-field" />);
      
      const label = screen.getByText('Email Address');
      const input = screen.getByLabelText('Email Address');
      
      expect(label).toHaveAttribute('for', 'email-field');
      expect(input).toHaveAttribute('id', 'email-field');
    });

    it('supports keyboard navigation with Tab key', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Input label="First Name" data-testid="input1" />
          <Input label="Last Name" data-testid="input2" />
        </div>
      );
      
      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');
      
      // Focus first input
      await user.click(input1);
      expect(input1).toHaveFocus();
      
      // Tab to second input
      await user.tab();
      expect(input2).toHaveFocus();
      
      // Shift+Tab back to first input
      await user.tab({ shift: true });
      expect(input1).toHaveFocus();
    });

    it('supports keyboard input and maintains focus', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<Input label="Search" onChange={onChange} data-testid="search-input" />);
      
      const input = screen.getByTestId('search-input');
      
      await user.click(input);
      expect(input).toHaveFocus();
      
      await user.type(input, 'test query');
      expect(onChange).toHaveBeenCalled();
      expect(input).toHaveFocus();
    });

    it('handles Enter key press', async () => {
      const user = userEvent.setup();
      const onKeyDown = jest.fn();
      
      render(<Input label="Search" onKeyDown={onKeyDown} data-testid="search-input" />);
      
      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{Enter}');
      
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter'
        })
      );
    });

    it('handles Escape key press', async () => {
      const user = userEvent.setup();
      const onKeyDown = jest.fn();
      
      render(<Input label="Search" onKeyDown={onKeyDown} data-testid="search-input" />);
      
      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{Escape}');
      
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Escape'
        })
      );
    });

    it('maintains focus state correctly during interactions', async () => {
      const user = userEvent.setup();
      
      render(<Input label="Email" data-testid="email-input" />);
      
      const input = screen.getByTestId('email-input');
      
      // Focus input
      await user.click(input);
      expect(input).toHaveFocus();
      
      // Type some text
      await user.type(input, 'test@example.com');
      expect(input).toHaveFocus();
      
      // Blur input
      await user.tab();
      expect(input).not.toHaveFocus();
    });

    it('supports disabled state and prevents keyboard interaction', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<Input label="Disabled Input" disabled onChange={onChange} data-testid="disabled-input" />);
      
      const input = screen.getByTestId('disabled-input');
      
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:bg-neutral-50');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      
      // Try to interact with disabled input
      await user.click(input);
      expect(input).not.toHaveFocus();
      
      // Try to type in disabled input
      await user.type(input, 'should not work');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('provides proper focus indicators for accessibility', async () => {
      const user = userEvent.setup();
      
      render(<Input label="Focus Test" data-testid="focus-input" />);
      
      const input = screen.getByTestId('focus-input');
      
      // Focus input
      await user.click(input);
      
      expect(input).toHaveClass('focus:outline-none');
      expect(input).toHaveClass('focus:ring-2');
    });

    it('handles floating label accessibility correctly', async () => {
      const user = userEvent.setup();
      
      render(<Input label="Floating Label" data-testid="floating-input" />);
      
      const input = screen.getByTestId('floating-input');
      const label = screen.getByText('Floating Label');
      
      // Initially label should be in placeholder position
      expect(label).toBeInTheDocument();
      
      // Focus input - label should float
      await user.click(input);
      await waitFor(() => {
        expect(label).toHaveClass('-top-2');
      });
      
      // Type text - label should stay floated
      await user.type(input, 'test');
      expect(label).toHaveClass('-top-2');
      
      // Clear text and blur - label should return to placeholder position
      await user.clear(input);
      await user.tab();
      
      await waitFor(() => {
        expect(label).toHaveClass('top-1/2');
      });
    });

    it('supports screen reader accessibility with proper labeling', () => {
      render(
        <Input 
          label="Email Address" 
          helperText="We'll never share your email" 
          error="Please enter a valid email"
          id="email-input"
        />
      );
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('id', 'email-input');
      
      // Error message should be visible to screen readers
      const errorMessage = screen.getByText('Please enter a valid email');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});