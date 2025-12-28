'use client';

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';

export default function ButtonDemoPage() {
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const LeftIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  const RightIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-neutral-900 mb-8">Enhanced Button Component</h1>
        
        {/* Variants Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Button Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-700">Primary</h3>
              <Button variant="primary">Primary Button</Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-700">Secondary</h3>
              <Button variant="secondary">Secondary Button</Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-700">Outline</h3>
              <Button variant="outline">Outline Button</Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-700">Ghost</h3>
              <Button variant="ghost">Ghost Button</Button>
            </div>
          </div>
        </section>

        {/* Sizes Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Button Sizes</h2>
          <div className="flex flex-wrap items-end gap-4">
            <Button size="sm">Small Button</Button>
            <Button size="md">Medium Button</Button>
            <Button size="lg">Large Button</Button>
          </div>
        </section>

        {/* States Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Button States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-700">Normal</h3>
              <Button>Normal State</Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-700">Loading</h3>
              <Button loading={loading} onClick={handleLoadingDemo}>
                {loading ? 'Loading...' : 'Click for Loading'}
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-700">Disabled</h3>
              <Button disabled>Disabled State</Button>
            </div>
          </div>
        </section>

        {/* Icons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Buttons with Icons</h2>
          <div className="flex flex-wrap gap-4">
            <Button leftIcon={<LeftIcon />}>Left Icon</Button>
            <Button rightIcon={<RightIcon />}>Right Icon</Button>
            <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
              Both Icons
            </Button>
          </div>
        </section>

        {/* Full Width Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Full Width Button</h2>
          <Button fullWidth>Full Width Button</Button>
        </section>

        {/* Accessibility Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Accessibility Features</h2>
          <div className="space-y-4">
            <p className="text-neutral-600">
              All buttons maintain minimum 44px touch targets on mobile devices for accessibility compliance.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small (44px min height)</Button>
              <Button size="md">Medium (44px min height)</Button>
              <Button size="lg">Large (48px min height)</Button>
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Interactive Demo</h2>
          <div className="bg-white p-6 rounded-lg shadow-soft">
            <p className="text-neutral-600 mb-4">
              Try hovering, focusing (tab key), and clicking these buttons to see the enhanced interactions:
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="primary" 
                onClick={() => alert('Primary button clicked!')}
              >
                Hover & Click Me
              </Button>
              <Button 
                variant="outline" 
                onClick={() => alert('Outline button clicked!')}
              >
                Focus with Tab
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => alert('Ghost button clicked!')}
              >
                Try Keyboard Navigation
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}