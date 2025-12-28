'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';

export default function CardDemoPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Enhanced Card Component</h1>
          <p className="text-neutral-600">
            Showcasing the enhanced Card component with all variants and sub-components
          </p>
        </div>

        {/* Card Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Card Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Default Variant */}
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>
                  Default variant with subtle shadow and border
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  This is the default card variant with a soft shadow and light border.
                  Perfect for most use cases.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" size="sm">
                  Action
                </Button>
              </CardFooter>
            </Card>

            {/* Elevated Variant */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>
                  Elevated variant with medium shadow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  This is the elevated card variant with a more prominent shadow.
                  Great for highlighting important content.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" size="sm">
                  Action
                </Button>
              </CardFooter>
            </Card>

            {/* Outlined Variant */}
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>
                  Outlined variant with prominent border
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  This is the outlined card variant with a thicker border.
                  Ideal for creating clear visual separation.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Action
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Padding Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Padding Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="default" padding="none">
              <div className="p-4 bg-primary-50 text-primary-700 text-sm font-medium">
                No Padding
              </div>
            </Card>

            <Card variant="default" padding="sm">
              <div className="bg-secondary-50 text-secondary-700 text-sm font-medium rounded">
                Small Padding
              </div>
            </Card>

            <Card variant="default" padding="md">
              <div className="bg-warning-50 text-warning-700 text-sm font-medium rounded">
                Medium Padding (Default)
              </div>
            </Card>

            <Card variant="default" padding="lg">
              <div className="bg-error-50 text-error-700 text-sm font-medium rounded">
                Large Padding
              </div>
            </Card>
          </div>
        </section>

        {/* Complex Card Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Complex Card Examples</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Status Card */}
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #12345</CardTitle>
                  <span className="px-3 py-1 bg-success-100 text-success-700 text-sm font-medium rounded-full">
                    In Transit
                  </span>
                </div>
                <CardDescription>
                  Delivery to 123 Main St, Anytown USA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Customer:</span>
                    <span className="font-medium">John Doe</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Courier:</span>
                    <span className="font-medium">Jane Smith</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Total:</span>
                    <span className="font-semibold text-lg">$24.99</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-sm text-neutral-500">75% complete - ETA: 15 minutes</p>
                </div>
              </CardContent>
              <CardFooter className="gap-3">
                <Button variant="outline" size="sm" className="flex-1">
                  Track Order
                </Button>
                <Button variant="primary" size="sm" className="flex-1">
                  Contact Courier
                </Button>
              </CardFooter>
            </Card>

            {/* Analytics Card */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Today's Performance</CardTitle>
                <CardDescription>
                  Real-time delivery metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">24</div>
                    <div className="text-sm text-primary-700">Active Orders</div>
                  </div>
                  <div className="text-center p-4 bg-secondary-50 rounded-lg">
                    <div className="text-2xl font-bold text-secondary-600">18</div>
                    <div className="text-sm text-secondary-700">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-warning-50 rounded-lg">
                    <div className="text-2xl font-bold text-warning-600">3</div>
                    <div className="text-sm text-warning-700">Pending</div>
                  </div>
                  <div className="text-center p-4 bg-info-50 rounded-lg">
                    <div className="text-2xl font-bold text-info-600">12</div>
                    <div className="text-sm text-info-700">Couriers</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">
                  View Detailed Analytics
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Sub-components Showcase */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Card Sub-components</h2>
          <Card variant="outlined" padding="lg">
            <CardHeader>
              <CardTitle>Card with All Sub-components</CardTitle>
              <CardDescription>
                This card demonstrates all available sub-components working together
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-neutral-600">
                  The Card component includes several sub-components for structured content:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-600">
                  <li><strong>CardHeader:</strong> Contains title and description</li>
                  <li><strong>CardTitle:</strong> Main heading with proper typography</li>
                  <li><strong>CardDescription:</strong> Subtitle or description text</li>
                  <li><strong>CardContent:</strong> Main content area</li>
                  <li><strong>CardFooter:</strong> Action buttons or additional info</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button variant="primary" size="sm">
                Continue
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
}