'use client';

import React, { useState } from 'react';
import { Input } from '@/components/atoms/Input';

// Simple icons for demo
const EmailIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
);

const PasswordIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function InputDemoPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [errorInput, setErrorInput] = useState('');

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Enhanced Input Component Demo
          </h1>
          <p className="text-lg text-neutral-600">
            Showcasing the enhanced Input component with consistent styling, proper focus states, and accessibility features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Inputs */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Basic Inputs</h2>
            <div className="space-y-6">
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<EmailIcon />}
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<PasswordIcon />}
                helperText="Must be at least 8 characters"
              />
              
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<SearchIcon />}
                variant="filled"
              />
            </div>
          </div>

          {/* Sizes */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Different Sizes</h2>
            <div className="space-y-6">
              <Input
                size="sm"
                label="Small Input"
                placeholder="Small size input"
              />
              
              <Input
                size="md"
                label="Medium Input"
                placeholder="Medium size input (default)"
              />
              
              <Input
                size="lg"
                label="Large Input"
                placeholder="Large size input"
              />
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Variants</h2>
            <div className="space-y-6">
              <Input
                variant="default"
                label="Default Variant"
                placeholder="Default styling"
              />
              
              <Input
                variant="filled"
                label="Filled Variant"
                placeholder="Filled background"
              />
              
              <Input
                variant="outlined"
                label="Outlined Variant"
                placeholder="Outlined styling"
              />
            </div>
          </div>

          {/* States */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">States</h2>
            <div className="space-y-6">
              <Input
                label="Error State"
                placeholder="This field has an error"
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                error="This field is required"
              />
              
              <Input
                label="Disabled State"
                placeholder="This field is disabled"
                disabled
                value="Disabled input"
              />
              
              <Input
                label="With Helper Text"
                placeholder="Enter your username"
                helperText="Username must be unique and contain only letters and numbers"
              />
            </div>
          </div>

          {/* Full Width */}
          <div className="bg-white rounded-xl p-6 shadow-soft lg:col-span-2">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Full Width</h2>
            <div className="space-y-6">
              <Input
                fullWidth
                label="Full Width Input"
                placeholder="This input takes the full width of its container"
                leftIcon={<EmailIcon />}
              />
              
              <Input
                fullWidth
                variant="filled"
                label="Full Width Filled"
                placeholder="Full width with filled variant"
                rightIcon={<SearchIcon />}
              />
            </div>
          </div>
        </div>

        {/* Accessibility Features */}
        <div className="mt-12 bg-white rounded-xl p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Accessibility Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Built-in Features</h3>
              <ul className="space-y-2 text-neutral-600">
                <li>• Proper ARIA labels and associations</li>
                <li>• Keyboard navigation support</li>
                <li>• Focus management with visible focus rings</li>
                <li>• Screen reader compatible</li>
                <li>• Minimum touch targets (44px) on mobile</li>
                <li>• High contrast error states</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3">WCAG Compliance</h3>
              <ul className="space-y-2 text-neutral-600">
                <li>• WCAG 2.1 AA color contrast ratios</li>
                <li>• Proper semantic HTML structure</li>
                <li>• Error messages linked to inputs</li>
                <li>• Consistent interaction patterns</li>
                <li>• Responsive design for all devices</li>
                <li>• Motion respects user preferences</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}