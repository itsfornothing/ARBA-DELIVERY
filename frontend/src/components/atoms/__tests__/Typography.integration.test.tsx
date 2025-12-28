import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Typography } from '../Typography';
import { Card } from '../Card';

describe('Typography Integration Tests', () => {
  it('integrates well with Card component', () => {
    render(
      <Card>
        <Typography variant="h2" color="primary">
          Card Title
        </Typography>
        <Typography variant="body1" color="neutral">
          This is the card content with proper typography styling.
        </Typography>
        <Typography variant="caption" color="muted">
          Additional information
        </Typography>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('This is the card content with proper typography styling.')).toBeInTheDocument();
    expect(screen.getByText('Additional information')).toBeInTheDocument();
  });

  it('maintains proper visual hierarchy', () => {
    render(
      <div>
        <Typography variant="h1">Main Title</Typography>
        <Typography variant="h2">Section Title</Typography>
        <Typography variant="h3">Subsection Title</Typography>
        <Typography variant="body1">Body content</Typography>
        <Typography variant="caption">Caption text</Typography>
      </div>
    );

    const h1 = screen.getByText('Main Title');
    const h2 = screen.getByText('Section Title');
    const h3 = screen.getByText('Subsection Title');
    const body = screen.getByText('Body content');
    const caption = screen.getByText('Caption text');

    // Verify semantic structure
    expect(h1.tagName).toBe('H1');
    expect(h2.tagName).toBe('H2');
    expect(h3.tagName).toBe('H3');
    expect(body.tagName).toBe('P');
    expect(caption.tagName).toBe('SPAN');

    // Verify size hierarchy (responsive text sizes for headings)
    expect(h1).toHaveClass('text-3xl'); // Mobile-first: text-3xl on mobile, text-5xl on desktop
    expect(h2).toHaveClass('text-2xl'); // Mobile-first: text-2xl on mobile, text-4xl on desktop
    expect(h3).toHaveClass('text-xl'); // Mobile-first: text-xl on mobile, text-3xl on desktop
    expect(body).toHaveClass('text-sm'); // Mobile-first: text-sm on mobile, text-base on desktop
    expect(caption).toHaveClass('text-xs');
  });

  it('supports theme-aware color system', () => {
    render(
      <div>
        <Typography variant="body1" color="primary">Primary text</Typography>
        <Typography variant="body1" color="secondary">Secondary text</Typography>
        <Typography variant="body1" color="success">Success text</Typography>
        <Typography variant="body1" color="error">Error text</Typography>
      </div>
    );

    expect(screen.getByText('Primary text')).toHaveClass('text-primary-700');
    expect(screen.getByText('Secondary text')).toHaveClass('text-secondary-700');
    expect(screen.getByText('Success text')).toHaveClass('text-success-700');
    expect(screen.getByText('Error text')).toHaveClass('text-error-700');
  });

  it('works with responsive design patterns', () => {
    render(
      <Typography 
        variant="h1" 
        className="text-2xl md:text-4xl lg:text-5xl"
      >
        Responsive heading
      </Typography>
    );

    const element = screen.getByText('Responsive heading');
    expect(element).toHaveClass('text-2xl');
    expect(element).toHaveClass('md:text-4xl');
    expect(element).toHaveClass('lg:text-5xl');
  });

  it('maintains accessibility standards', () => {
    render(
      <article>
        <Typography variant="h1" id="main-title">
          Article Title
        </Typography>
        <Typography variant="body1" aria-describedby="main-title">
          Article content that is described by the title
        </Typography>
        <Typography variant="caption" role="note">
          Important note about the article
        </Typography>
      </article>
    );

    const title = screen.getByText('Article Title');
    const content = screen.getByText('Article content that is described by the title');
    const note = screen.getByText('Important note about the article');

    expect(title).toHaveAttribute('id', 'main-title');
    expect(content).toHaveAttribute('aria-describedby', 'main-title');
    expect(note).toHaveAttribute('role', 'note');
  });
});