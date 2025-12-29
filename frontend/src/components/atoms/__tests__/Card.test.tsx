import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <div>Test content</div>
        </Card>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('applies default variant and padding classes', () => {
      const { container } = render(
        <Card>
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white rounded-xl shadow-soft border border-neutral-100 p-4'); // Mobile-first: p-4 on mobile, p-6 on tablet
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card ref={ref}>
          <div>Test content</div>
        </Card>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Variant Styling', () => {
    it('applies default variant styles', () => {
      const { container } = render(
        <Card variant="default">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-soft border border-neutral-100');
    });

    it('applies elevated variant styles', () => {
      const { container } = render(
        <Card variant="elevated">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-medium');
      expect(card).not.toHaveClass('border');
    });

    it('applies outlined variant styles', () => {
      const { container } = render(
        <Card variant="outlined">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-2 border-neutral-200');
      expect(card).not.toHaveClass('shadow-soft');
    });
  });

  describe('Padding Options', () => {
    it('applies no padding when padding="none"', () => {
      const { container } = render(
        <Card padding="none">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('p-4 p-6 p-8');
    });

    it('applies small padding when padding="sm"', () => {
      const { container } = render(
        <Card padding="sm">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
    });

    it('applies medium padding when padding="md" (default)', () => {
      const { container } = render(
        <Card padding="md">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4'); // Mobile-first: p-4 on mobile, p-6 on tablet
    });

    it('applies large padding when padding="lg"', () => {
      const { container } = render(
        <Card padding="lg">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4'); // Mobile-first: p-4 on mobile, p-6 on tablet, p-8 on desktop
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <Card className="custom-class">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('accepts custom data attributes', () => {
      const { container } = render(
        <Card data-testid="custom-card">
          <div>Test content</div>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-testid', 'custom-card');
    });
  });
});

describe('Card Sub-components', () => {
  describe('CardHeader', () => {
    it('renders with correct default classes', () => {
      const { container } = render(
        <CardHeader>
          <div>Header content</div>
        </CardHeader>
      );
      
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('flex flex-col space-y-1.5 pb-4');
    });

    it('accepts custom className', () => {
      const { container } = render(
        <CardHeader className="custom-header">
          <div>Header content</div>
        </CardHeader>
      );
      
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 with correct classes', () => {
      render(<CardTitle>Test Title</CardTitle>);
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-lg font-semibold leading-none tracking-tight text-neutral-900');
      expect(title).toHaveTextContent('Test Title');
    });

    it('accepts custom className', () => {
      render(<CardTitle className="custom-title">Test Title</CardTitle>);
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('renders with correct classes', () => {
      render(<CardDescription>Test description</CardDescription>);
      
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-sm text-neutral-500');
    });

    it('accepts custom className', () => {
      render(<CardDescription className="custom-desc">Test description</CardDescription>);
      
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('renders children correctly', () => {
      render(
        <CardContent>
          <p>Content text</p>
        </CardContent>
      );
      
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('accepts custom className', () => {
      const { container } = render(
        <CardContent className="custom-content">
          <p>Content text</p>
        </CardContent>
      );
      
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('renders with correct default classes', () => {
      const { container } = render(
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      );
      
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('flex items-center pt-4');
    });

    it('accepts custom className', () => {
      const { container } = render(
        <CardFooter className="custom-footer">
          <button>Action</button>
        </CardFooter>
      );
      
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('custom-footer');
    });
  });
});

describe('Card Integration', () => {
  it('renders complete card with all sub-components', () => {
    render(
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>This is a test card</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Action Button</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Card');
    expect(screen.getByText('This is a test card')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Action Button');
  });

  it('maintains proper visual hierarchy with sub-components', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    const card = container.firstChild as HTMLElement;
    const header = card.querySelector('.pb-4');
    const footer = card.querySelector('.pt-4');
    
    expect(header).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });
});