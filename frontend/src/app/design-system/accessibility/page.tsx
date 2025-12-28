'use client';

import React from 'react';
import { AccessibilityProvider } from '@/components/providers/AccessibilityProvider';
import { AccessibilitySettings } from '@/components/molecules/AccessibilitySettings';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { MotionWrapper } from '@/components/molecules/MotionWrapper';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';

export default function AccessibilityPage() {
  const [demoState, setDemoState] = React.useState({
    buttonClicked: false,
    formValue: '',
    announcement: '',
  });

  const handleDemoClick = (action: string) => {
    setDemoState(prev => ({
      ...prev,
      buttonClicked: true,
      announcement: `${action} button was activated`,
    }));
    
    setTimeout(() => {
      setDemoState(prev => ({ ...prev, buttonClicked: false, announcement: '' }));
    }, 2000);
  };

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-neutral-50 py-8">
        <ResponsiveContainer size="desktop">
          {/* Skip Link for Accessibility */}
          <a 
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-600 text-white px-3 py-2 rounded-md z-50"
          >
            Skip to main content
          </a>
          
          <header className="text-center mb-8">
            <Typography variant="h1" className="mb-4">
              Accessibility Features
            </Typography>
            <Typography variant="body1" color="muted" className="max-w-2xl mx-auto">
              Our platform is designed with accessibility in mind, ensuring that all users can 
              navigate and interact with our services effectively, regardless of their abilities.
            </Typography>
          </header>

          <main id="main-content" className="space-y-12">
            {/* WCAG Compliance Features */}
            <section>
              <Typography variant="h2" className="mb-6">
                WCAG Compliance Features
              </Typography>
              
              <ResponsiveGrid columns="responsive" gap="responsive">
                <Card variant="elevated">
                  <CardContent>
                    <Typography variant="h4" className="mb-4">
                      Color Contrast
                    </Typography>
                    <Typography variant="body1" className="mb-4">
                      All text meets WCAG AA standards with a minimum 4.5:1 contrast ratio.
                    </Typography>
                    <ul className="space-y-2 text-sm text-neutral-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        High contrast text combinations
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Colorblind-safe status indicators
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Alternative visual cues beyond color
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardContent>
                    <Typography variant="h4" className="mb-4">
                      Keyboard Navigation
                    </Typography>
                    <Typography variant="body1" className="mb-4">
                      Full keyboard support for all interactive elements.
                    </Typography>
                    <ul className="space-y-2 text-sm text-neutral-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Tab navigation through all controls
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Enter and Space key activation
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Escape key for dismissing dialogs
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Arrow keys for menu navigation
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardContent>
                    <Typography variant="h4" className="mb-4">
                      Screen Reader Support
                    </Typography>
                    <Typography variant="body1" className="mb-4">
                      Comprehensive ARIA labels and semantic HTML structure.
                    </Typography>
                    <ul className="space-y-2 text-sm text-neutral-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Descriptive ARIA labels
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Live region announcements
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Proper heading hierarchy
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Form field associations
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardContent>
                    <Typography variant="h4" className="mb-4">
                      Motion Preferences
                    </Typography>
                    <Typography variant="body1" className="mb-4">
                      Respects user preferences for reduced motion.
                    </Typography>
                    <ul className="space-y-2 text-sm text-neutral-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Automatic reduced motion detection
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Alternative static presentations
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Essential motion preserved
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        User control over animations
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </ResponsiveGrid>
            </section>

            {/* Interactive Demo */}
            <section>
              <Typography variant="h2" className="mb-6">
                Interactive Demo
              </Typography>
              
              <ResponsiveGrid columns="double" gap="responsive">
                <Card variant="elevated">
                  <CardContent>
                    <Typography variant="h4" className="mb-4">
                      Accessible Buttons
                    </Typography>
                    <Typography variant="body1" className="mb-4">
                      Try navigating these buttons with your keyboard (Tab, Enter, Space).
                    </Typography>
                    
                    <div className="flex flex-wrap gap-3">
                      <AccessibleButton 
                        variant="primary"
                        onClick={() => handleDemoClick('Primary')}
                        aria-label="Primary action button demo"
                      >
                        Primary Action
                      </AccessibleButton>
                      <AccessibleButton 
                        variant="secondary"
                        onClick={() => handleDemoClick('Secondary')}
                        aria-label="Secondary action button demo"
                      >
                        Secondary
                      </AccessibleButton>
                      <AccessibleButton 
                        variant="outline"
                        onClick={() => handleDemoClick('Outline')}
                        aria-label="Outline button demo"
                      >
                        Outline
                      </AccessibleButton>
                    </div>
                    
                    {demoState.buttonClicked && (
                      <MotionWrapper>
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                          <Typography variant="body2" className="text-green-800">
                            ✓ Button interaction successful!
                          </Typography>
                        </div>
                      </MotionWrapper>
                    )}
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardContent>
                    <Typography variant="h4" className="mb-4">
                      Form Accessibility
                    </Typography>
                    <Typography variant="body1" className="mb-4">
                      Form fields with proper labels and error handling.
                    </Typography>
                    
                    <div className="space-y-4">
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="Enter your email"
                        value={demoState.formValue}
                        onChange={(e) => setDemoState(prev => ({ 
                          ...prev, 
                          formValue: e.target.value 
                        }))}
                        aria-describedby="email-help"
                        fullWidth
                      />
                      <Typography 
                        variant="caption" 
                        color="muted" 
                        id="email-help"
                        className="block"
                      >
                        We'll never share your email with anyone else.
                      </Typography>
                    </div>
                  </CardContent>
                </Card>
              </ResponsiveGrid>
            </section>

            {/* Accessibility Settings */}
            <section>
              <Typography variant="h2" className="mb-6">
                Accessibility Settings
              </Typography>
              <Card variant="elevated">
                <CardContent>
                  <AccessibilitySettings />
                </CardContent>
              </Card>
            </section>

            {/* Motion Controls Demo */}
            <section>
              <Typography variant="h2" className="mb-6">
                Motion Controls
              </Typography>
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">
                    Reduced Motion Support
                  </Typography>
                  <Typography variant="body1" color="muted" className="mb-4">
                    Animations respect user preferences for reduced motion.
                  </Typography>
                  <MotionWrapper>
                    <div className="p-6 bg-primary-100 rounded-lg text-center">
                      <Typography variant="body1">
                        Animated Content (respects prefers-reduced-motion)
                      </Typography>
                    </div>
                  </MotionWrapper>
                </CardContent>
              </Card>
            </section>

            {/* Technical Implementation */}
            <section>
              <Typography variant="h2" className="mb-6">
                Technical Implementation
              </Typography>
              
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="body1" className="mb-6">
                    Our accessibility implementation includes:
                  </Typography>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-3 text-sm text-neutral-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        WCAG 2.1 AA compliance for color contrast ratios
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Semantic HTML structure with proper heading hierarchy
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        ARIA labels, descriptions, and live regions
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Keyboard navigation with focus management
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Screen reader compatibility testing
                      </li>
                    </ul>
                    <ul className="space-y-3 text-sm text-neutral-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Reduced motion preferences detection
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        High contrast mode support
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Minimum 44px touch targets for mobile
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Alternative text for all meaningful images
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        Form validation with accessible error messages
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>
        </ResponsiveContainer>
      </div>
    </AccessibilityProvider>
  );
}