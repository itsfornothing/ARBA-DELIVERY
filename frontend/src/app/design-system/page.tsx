'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/atoms/Card';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { LoadingSpinner } from '@/components/molecules/LoadingSpinner';
import { useToast } from '@/components/molecules/Toast';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function DesignSystemPage() {
  const { toggleTheme, isDark } = useTheme();
  const { addToast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToastDemo = (type: 'success' | 'error' | 'warning' | 'info') => {
    addToast({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Toast`,
      message: `This is a ${type} toast notification with some example content.`,
      actions: [
        {
          label: 'Action',
          action: () => console.log(`${type} action clicked`),
        },
      ],
    });
  };

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <ResponsiveContainer size="desktop">
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-4 px-3 py-2 bg-primary-600 text-white border-none rounded-md cursor-pointer font-semibold transition-colors duration-200 hover:bg-primary-700 z-50"
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>

        <div className="text-center mb-12">
          <Typography variant="h1" className="mb-4">
            Delivery Platform Design System
          </Typography>
          <Typography variant="body1" color="muted">
            A comprehensive design system built with modern UI principles and accessibility in mind.
          </Typography>
        </div>

        <div className="space-y-12">
          <section>
            <Typography variant="h2" className="mb-6">Typography</Typography>
            <div className="space-y-2">
              <Typography variant="h1">Heading 1</Typography>
              <Typography variant="h2">Heading 2</Typography>
              <Typography variant="h3">Heading 3</Typography>
              <Typography variant="h4">Heading 4</Typography>
              <Typography variant="h5">Heading 5</Typography>
              <Typography variant="h6">Heading 6</Typography>
              <Typography variant="body1">
                Body text with proper line height and spacing for optimal readability.
              </Typography>
              <Typography variant="caption" color="muted">
                Caption text for additional information
              </Typography>
              <Typography variant="overline" color="primary">
                Overline text for labels
              </Typography>
            </div>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Buttons</Typography>
            <div className="flex gap-3 flex-wrap items-center mb-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            
            <div className="flex gap-3 flex-wrap items-center mb-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            
            <div className="flex gap-3 flex-wrap items-center">
              <Button loading={loading} onClick={handleLoadingDemo}>
                {loading ? 'Loading...' : 'Show Loading'}
              </Button>
              <Button disabled>Disabled Button</Button>
            </div>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Form Elements</Typography>
            <ResponsiveGrid columns="responsive" gap="responsive">
              <Input
                label="Default Input"
                placeholder="Enter some text..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                fullWidth
              />
              <Input
                label="Filled Input"
                variant="filled"
                placeholder="Filled variant..."
                fullWidth
              />
              <Input
                label="Outlined Input"
                variant="outlined"
                placeholder="Outlined variant..."
                fullWidth
              />
              <Input
                label="Input with Error"
                error="This field is required"
                placeholder="Error state..."
                fullWidth
              />
              <Input
                label="Input with Helper Text"
                helperText="This is some helpful information"
                placeholder="With helper text..."
                fullWidth
              />
            </ResponsiveGrid>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Cards</Typography>
            <ResponsiveGrid columns="responsive" gap="responsive">
              <Card variant="default">
                <CardContent>
                  <Typography variant="h4" className="mb-2">Default Card</Typography>
                  <Typography variant="body1">
                    This is a default card with standard styling and shadow.
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" className="mb-2">Outlined Card</Typography>
                  <Typography variant="body1">
                    This card uses an outline instead of a shadow for definition.
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-2">Elevated Card</Typography>
                  <Typography variant="body1">
                    This card has a more prominent shadow for emphasis.
                  </Typography>
                </CardContent>
              </Card>
              
              <Card 
                variant="elevated" 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => addToast({ message: 'Card clicked!' })}
              >
                <CardContent>
                  <Typography variant="h4" className="mb-2">Interactive Card</Typography>
                  <Typography variant="body1">
                    This card responds to hover and click interactions.
                  </Typography>
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Loading States</Typography>
            <div className="flex gap-3 flex-wrap items-center mb-4">
              <LoadingSpinner size="small" />
              <LoadingSpinner size="medium" />
              <LoadingSpinner size="large" />
            </div>
            
            <div className="flex gap-3 flex-wrap items-center">
              <LoadingSpinner variant="dots" color="primary" />
              <LoadingSpinner variant="pulse" color="secondary" />
              <LoadingSpinner variant="spinner" color="muted" />
            </div>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Toast Notifications</Typography>
            <div className="flex gap-3 flex-wrap items-center">
              <Button onClick={() => handleToastDemo('success')}>Success Toast</Button>
              <Button onClick={() => handleToastDemo('error')}>Error Toast</Button>
              <Button onClick={() => handleToastDemo('warning')}>Warning Toast</Button>
              <Button onClick={() => handleToastDemo('info')}>Info Toast</Button>
            </div>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Component Demos</Typography>
            <Typography variant="body1" color="muted" className="mb-6">
              Explore comprehensive component demonstrations and interactive examples.
            </Typography>
            <div className="flex gap-3 flex-wrap items-center">
              <Button 
                variant="primary" 
                onClick={() => window.open('/design-system/error-states', '_blank')}
              >
                Error States & Empty States
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/design-system/forms', '_blank')}
              >
                Enhanced Forms
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/design-system/loading', '_blank')}
              >
                Loading States
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/design-system/responsive-demo', '_blank')}
              >
                Responsive Layout
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/design-system/micro-interactions', '_blank')}
              >
                Micro-interactions
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/design-system/accessibility', '_blank')}
              >
                Accessibility Features
              </Button>
            </div>
          </section>
        </div>
      </ResponsiveContainer>
    </div>
  );
}