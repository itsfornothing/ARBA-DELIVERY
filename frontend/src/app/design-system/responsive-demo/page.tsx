'use client';

import React from 'react';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { Card, CardContent } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Typography } from '@/components/atoms/Typography';
import { 
  useResponsive,
  getResponsiveSpacing,
  TOUCH_TARGETS,
  BREAKPOINTS
} from '@/lib/responsive';

export default function ResponsiveDemoPage() {
  const { isMobile, isTablet, breakpoint } = useResponsive();
  const viewport = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 py-8 sm:py-12">
      <ResponsiveContainer size="desktop">
        {/* Hero Section */}
        <div className="text-center text-white mb-8 sm:mb-12">
          <Typography 
            variant="h1" 
            className="mb-4 text-white"
          >
            Responsive Layout System
          </Typography>
          <Typography 
            variant="h4" 
            className="opacity-90 text-white font-normal"
          >
            Mobile-first design with touch-friendly interactions
          </Typography>
        </div>

        {/* Viewport Information */}
        <Card variant="elevated" className="mb-8">
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Current Viewport: {breakpoint.toUpperCase()}
            </Typography>
            <ResponsiveGrid columns="quad" gap="responsive">
              <div>
                <Typography variant="body2" weight="semibold">Width:</Typography>
                <Typography variant="body2" color="muted">
                  {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px
                </Typography>
              </div>
              <div>
                <Typography variant="body2" weight="semibold">Height:</Typography>
                <Typography variant="body2" color="muted">
                  {typeof window !== 'undefined' ? window.innerHeight : 'N/A'}px
                </Typography>
              </div>
              <div>
                <Typography variant="body2" weight="semibold">Mobile:</Typography>
                <Typography variant="body2" color="muted">
                  {isMobile ? 'Yes' : 'No'}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" weight="semibold">Touch UI:</Typography>
                <Typography variant="body2" color="muted">
                  {isMobile ? 'Enabled' : 'Disabled'}
                </Typography>
              </div>
            </ResponsiveGrid>
          </CardContent>
        </Card>

        {/* Touch-Friendly Buttons */}
        <Card variant="elevated" className="mb-8">
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Touch-Friendly Buttons
            </Typography>
            <Typography variant="body2" color="muted" className="mb-6">
              All buttons maintain minimum {TOUCH_TARGETS.MINIMUM}px height on mobile devices for accessibility.
            </Typography>
            
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'flex-row space-x-4'}`}>
              <Button variant="primary" size="sm" fullWidth={isMobile}>
                Small Button
              </Button>
              <Button variant="secondary" size="md" fullWidth={isMobile}>
                Medium Button
              </Button>
              <Button variant="outline" size="lg" fullWidth={isMobile}>
                Large Button
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Grid */}
        <Card variant="elevated" className="mb-8">
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Responsive Grid System
            </Typography>
            <Typography variant="body2" color="muted" className="mb-6">
              Grid automatically adapts: 1 column on mobile, 2 on tablet, 3 on desktop.
            </Typography>
            
            <ResponsiveGrid columns="responsive" gap="responsive">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card 
                  key={item}
                  variant="outlined" 
                  padding="sm"
                  className="text-center bg-neutral-50 min-h-[60px] sm:min-h-[80px] flex items-center justify-center"
                >
                  <Typography variant="body2">
                    Grid Item {item}
                  </Typography>
                </Card>
              ))}
            </ResponsiveGrid>
          </CardContent>
        </Card>

        {/* Responsive Form */}
        <Card variant="elevated" className="mb-8">
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Responsive Form Elements
            </Typography>
            <Typography variant="body2" color="muted" className="mb-6">
              Form inputs stack on mobile and arrange side-by-side on larger screens.
            </Typography>
            
            <div className="space-y-4">
              <ResponsiveGrid columns="double" gap="responsive">
                <Input
                  label="First Name"
                  placeholder="Enter your first name"
                  fullWidth
                />
                <Input
                  label="Last Name"
                  placeholder="Enter your last name"
                  fullWidth
                />
              </ResponsiveGrid>
              
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                fullWidth
              />
              
              <ResponsiveGrid columns="double" gap="responsive">
                <Button variant="primary" fullWidth={isMobile}>
                  Submit Form
                </Button>
                <Button variant="outline" fullWidth={isMobile}>
                  Reset Form
                </Button>
              </ResponsiveGrid>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Images */}
        <Card variant="elevated" className="mb-8">
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Responsive Image Grid
            </Typography>
            <Typography variant="body2" color="muted" className="mb-6">
              Images automatically adjust to screen size using CSS Grid.
            </Typography>
            
            <ResponsiveGrid columns="responsive" gap="responsive">
              {[1, 2, 3, 4].map((item) => (
                <div 
                  key={item}
                  className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center text-neutral-600"
                >
                  <div className="text-center">
                    <Typography variant="body2">Image {item}</Typography>
                    <Typography variant="caption" color="muted">
                      {isMobile ? 'Full Width' : 'Grid Layout'}
                    </Typography>
                  </div>
                </div>
              ))}
            </ResponsiveGrid>
          </CardContent>
        </Card>

        {/* Typography Scale */}
        <Card variant="elevated">
          <CardContent>
            <Typography variant="h4" className="mb-4">
              Responsive Typography
            </Typography>
            <Typography variant="body2" color="muted" className="mb-6">
              Text sizes automatically adjust for optimal readability on each device.
            </Typography>
            
            <div className="space-y-4">
              <Typography variant="h1">
                Large Heading (Responsive)
              </Typography>
              <Typography variant="h3">
                Medium Heading (Responsive)
              </Typography>
              <Typography variant="body1">
                Body Text (Responsive) - This paragraph demonstrates how body text scales 
                responsively across different screen sizes. The text remains readable and comfortable 
                to read regardless of the device being used.
              </Typography>
              <Typography variant="caption" color="muted">
                Small Text (Responsive) - Used for captions, labels, and secondary information.
              </Typography>
            </div>
          </CardContent>
        </Card>
      </ResponsiveContainer>
    </div>
  );
}