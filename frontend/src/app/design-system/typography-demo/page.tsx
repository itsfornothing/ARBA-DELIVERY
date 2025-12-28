'use client';

import React from 'react';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';

export default function TypographyDemoPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Typography variant="h1" color="primary" className="mb-2">
            Enhanced Typography System
          </Typography>
          <Typography variant="body1" color="muted">
            Comprehensive typography variants with proper color contrast and accessibility compliance
          </Typography>
        </div>

        <div className="grid gap-8">
          {/* Heading Variants */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Heading Variants
            </Typography>
            <div className="space-y-4">
              <div>
                <Typography variant="h1">Heading 1 - Main Page Title</Typography>
                <Typography variant="caption" color="muted">
                  text-5xl font-bold leading-tight tracking-tight
                </Typography>
              </div>
              <div>
                <Typography variant="h2">Heading 2 - Section Title</Typography>
                <Typography variant="caption" color="muted">
                  text-4xl font-bold leading-tight tracking-tight
                </Typography>
              </div>
              <div>
                <Typography variant="h3">Heading 3 - Subsection Title</Typography>
                <Typography variant="caption" color="muted">
                  text-3xl font-semibold leading-tight tracking-tight
                </Typography>
              </div>
              <div>
                <Typography variant="h4">Heading 4 - Component Title</Typography>
                <Typography variant="caption" color="muted">
                  text-2xl font-semibold leading-tight
                </Typography>
              </div>
              <div>
                <Typography variant="h5">Heading 5 - Card Title</Typography>
                <Typography variant="caption" color="muted">
                  text-xl font-medium leading-tight
                </Typography>
              </div>
              <div>
                <Typography variant="h6">Heading 6 - Small Title</Typography>
                <Typography variant="caption" color="muted">
                  text-lg font-medium leading-tight
                </Typography>
              </div>
            </div>
          </Card>

          {/* Body Text Variants */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Body Text Variants
            </Typography>
            <div className="space-y-4">
              <div>
                <Typography variant="body1">
                  Body 1 - This is the primary body text used for most content. It provides excellent readability with proper line height and spacing for comfortable reading experiences.
                </Typography>
                <Typography variant="caption" color="muted">
                  text-base leading-relaxed
                </Typography>
              </div>
              <div>
                <Typography variant="body2">
                  Body 2 - This is smaller body text used for secondary content, descriptions, and supporting information that needs to be less prominent than the main body text.
                </Typography>
                <Typography variant="caption" color="muted">
                  text-sm leading-relaxed
                </Typography>
              </div>
              <div>
                <Typography variant="caption">
                  Caption - Used for image captions, form help text, and other small supporting text
                </Typography>
                <Typography variant="caption" color="muted">
                  text-xs leading-normal
                </Typography>
              </div>
              <div>
                <Typography variant="overline">
                  Overline - Used for labels and categories
                </Typography>
                <Typography variant="caption" color="muted">
                  text-xs font-medium uppercase tracking-wide leading-normal
                </Typography>
              </div>
            </div>
          </Card>

          {/* Color Variants */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Color Variants
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="body1" color="primary">
                  Primary Color - Used for main brand elements and important actions
                </Typography>
              </div>
              <div>
                <Typography variant="body1" color="secondary">
                  Secondary Color - Used for complementary elements and success states
                </Typography>
              </div>
              <div>
                <Typography variant="body1" color="neutral">
                  Neutral Color - Default text color for body content
                </Typography>
              </div>
              <div>
                <Typography variant="body1" color="muted">
                  Muted Color - Used for less important text and descriptions
                </Typography>
              </div>
              <div>
                <Typography variant="body1" color="success">
                  Success Color - Used for positive feedback and success messages
                </Typography>
              </div>
              <div>
                <Typography variant="body1" color="warning">
                  Warning Color - Used for caution and warning messages
                </Typography>
              </div>
              <div>
                <Typography variant="body1" color="error">
                  Error Color - Used for error messages and destructive actions
                </Typography>
              </div>
              <div>
                <Typography variant="body1" color="info">
                  Info Color - Used for informational messages and neutral feedback
                </Typography>
              </div>
            </div>
          </Card>

          {/* Weight Variants */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Font Weight Variants
            </Typography>
            <div className="space-y-4">
              <Typography variant="body1" weight="normal">
                Normal Weight (400) - Standard text weight for body content
              </Typography>
              <Typography variant="body1" weight="medium">
                Medium Weight (500) - Slightly emphasized text for important content
              </Typography>
              <Typography variant="body1" weight="semibold">
                Semibold Weight (600) - Emphasized text for headings and important labels
              </Typography>
              <Typography variant="body1" weight="bold">
                Bold Weight (700) - Strong emphasis for headings and critical information
              </Typography>
            </div>
          </Card>

          {/* Alignment Variants */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Text Alignment
            </Typography>
            <div className="space-y-4">
              <Typography variant="body1" align="left">
                Left aligned text - Default alignment for most content
              </Typography>
              <Typography variant="body1" align="center">
                Center aligned text - Used for headings and special content
              </Typography>
              <Typography variant="body1" align="right">
                Right aligned text - Used for numerical data and special layouts
              </Typography>
              <Typography variant="body1" align="justify">
                Justified text - Used for formal documents and articles where even margins are important. This text will be distributed evenly across the full width of the container.
              </Typography>
            </div>
          </Card>

          {/* Custom Size Override */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Custom Size Override
            </Typography>
            <div className="space-y-4">
              <Typography variant="body1" size="xs">
                Body variant with XS size override
              </Typography>
              <Typography variant="body1" size="sm">
                Body variant with SM size override
              </Typography>
              <Typography variant="body1" size="lg">
                Body variant with LG size override
              </Typography>
              <Typography variant="body1" size="xl">
                Body variant with XL size override
              </Typography>
              <Typography variant="body1" size="2xl">
                Body variant with 2XL size override
              </Typography>
            </div>
          </Card>

          {/* Line Height Override */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Line Height Override
            </Typography>
            <div className="space-y-6">
              <div>
                <Typography variant="body1" lineHeight="tight">
                  Tight line height - This text uses tight line spacing which is useful for headings and compact layouts where space is at a premium and readability is still maintained.
                </Typography>
              </div>
              <div>
                <Typography variant="body1" lineHeight="normal">
                  Normal line height - This text uses normal line spacing which provides a good balance between readability and space efficiency for most content types.
                </Typography>
              </div>
              <div>
                <Typography variant="body1" lineHeight="relaxed">
                  Relaxed line height - This text uses relaxed line spacing which provides maximum readability and is ideal for long-form content where reading comfort is the primary concern.
                </Typography>
              </div>
            </div>
          </Card>

          {/* Semantic HTML Elements */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Semantic HTML Elements
            </Typography>
            <div className="space-y-4">
              <Typography variant="body1" as="div">
                Body text rendered as a div element
              </Typography>
              <Typography variant="body1" as="span">
                Body text rendered as a span element
              </Typography>
              <Typography variant="h3" as="p">
                H3 styling applied to a paragraph element
              </Typography>
              <Typography variant="caption" as="label">
                Caption styling applied to a label element
              </Typography>
            </div>
          </Card>

          {/* Responsive Behavior */}
          <Card className="p-6">
            <Typography variant="h2" className="mb-6">
              Responsive Typography
            </Typography>
            <Typography variant="body1" className="mb-4">
              The typography system automatically adapts to different screen sizes using the enhanced theme configuration. All variants maintain proper readability across mobile, tablet, and desktop breakpoints.
            </Typography>
            <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
              <Typography variant="h1" className="mb-2 text-2xl md:text-4xl lg:text-5xl">
                Responsive Heading
              </Typography>
              <Typography variant="body1" className="text-sm md:text-base">
                This text scales appropriately across different screen sizes
              </Typography>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}