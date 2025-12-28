'use client';

import { useState } from 'react';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { Select } from '@/components/atoms/Select';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { Form } from '@/components/molecules/Form';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/atoms/Card';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { commonValidationRules } from '@/lib/validation';
import { Mail, User, Phone } from 'lucide-react';

export default function FormsPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    message: '',
    newsletter: 'false',
    country: '',
  });

  const handleFormSubmit = (values: Record<string, string>, isValid: boolean) => {
    console.log('Form submitted:', { values, isValid });
    if (isValid) {
      alert('Form submitted successfully!');
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
  ];

  const validationRules = {
    email: commonValidationRules.email,
    name: commonValidationRules.name,
    phone: commonValidationRules.phone,
    address: commonValidationRules.address,
    message: { required: true, minLength: 10 },
    country: { required: true },
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <ResponsiveContainer size="desktop">
        <div className="space-y-12">
          <section className="text-center">
            <Typography variant="h1" className="mb-4">
              Enhanced Form Components
            </Typography>
            <Typography variant="body1" color="muted">
              Demonstration of the enhanced form components with visual feedback, validation, and smooth animations.
            </Typography>
          </section>

          <ResponsiveGrid columns="double" gap="responsive">
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h3" className="mb-6">
                  Basic Form Elements
                </Typography>
                
                <div className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    leftIcon={<Mail size={20} />}
                    variant="outlined"
                    fullWidth
                  />
                  
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    leftIcon={<User size={20} />}
                    variant="filled"
                    fullWidth
                  />
                  
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="Enter your phone"
                    leftIcon={<Phone size={20} />}
                    error="Please enter a valid phone number"
                    fullWidth
                  />
                  
                  <Textarea
                    label="Message"
                    placeholder="Enter your message here..."
                    variant="outlined"
                    rows={4}
                    fullWidth
                  />
                  
                  <Select
                    label="Country"
                    placeholder="Select your country"
                    options={countryOptions}
                    variant="outlined"
                    fullWidth
                  />
                  
                  <Checkbox
                    label="Subscribe to newsletter"
                    size="medium"
                  />
                  
                  <Button variant="primary" size="md" fullWidth>
                    Submit Form
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h3" className="mb-6">
                  Form with Validation
                </Typography>
                
                <Form
                  initialValues={formData}
                  validationRules={validationRules}
                  onSubmit={handleFormSubmit}
                  showSuccessMessage={true}
                  successMessage="Your information has been saved successfully!"
                >
                  <div className="space-y-4">
                    <FormField
                      name="email"
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      leftIcon={<Mail size={20} />}
                      variant="outlined"
                      value={formData.email}
                      onChange={handleFieldChange}
                      validationRules={validationRules.email}
                      fullWidth
                    />
                    
                    <FormField
                      name="name"
                      label="Full Name"
                      placeholder="Enter your full name"
                      leftIcon={<User size={20} />}
                      variant="filled"
                      value={formData.name}
                      onChange={handleFieldChange}
                      validationRules={validationRules.name}
                      fullWidth
                    />
                    
                    <Input
                      name="phone"
                      label="Phone Number"
                      type="tel"
                      placeholder="Enter your phone"
                      leftIcon={<Phone size={20} />}
                      fullWidth
                    />
                    
                    <Textarea
                      name="address"
                      label="Address"
                      placeholder="Enter your address"
                      variant="outlined"
                      rows={3}
                      fullWidth
                    />
                    
                    <Select
                      name="country"
                      label="Country"
                      placeholder="Select your country"
                      options={countryOptions}
                      variant="outlined"
                      fullWidth
                    />
                    
                    <Textarea
                      name="message"
                      label="Message"
                      placeholder="Tell us about your delivery needs..."
                      variant="outlined"
                      rows={4}
                      fullWidth
                    />
                    
                    <Checkbox
                      name="newsletter"
                      label="I want to receive updates about new features and promotions"
                      size="medium"
                      checked={formData.newsletter === 'true'}
                      onChange={(e) => handleFieldChange('newsletter', e.target.checked.toString())}
                    />
                    
                    <Button type="submit" variant="primary" size="lg" fullWidth>
                      Submit Application
                    </Button>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </ResponsiveGrid>

          <section>
            <Typography variant="h3" className="mb-6">
              Component Variants
            </Typography>
            
            <ResponsiveGrid columns="responsive" gap="responsive">
              <Card variant="default">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Input Variants</Typography>
                  <div className="space-y-4">
                    <Input label="Default Variant" variant="default" placeholder="Default style" fullWidth />
                    <Input label="Filled Variant" variant="filled" placeholder="Filled style" fullWidth />
                    <Input label="Outlined Variant" variant="outlined" placeholder="Outlined style" fullWidth />
                  </div>
                </CardContent>
              </Card>
              
              <Card variant="default">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Input Sizes</Typography>
                  <div className="space-y-4">
                    <Input label="Small Size" size="sm" placeholder="Small input" fullWidth />
                    <Input label="Medium Size" size="md" placeholder="Medium input" fullWidth />
                    <Input label="Large Size" size="lg" placeholder="Large input" fullWidth />
                  </div>
                </CardContent>
              </Card>
              
              <Card variant="default">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Checkbox Variants</Typography>
                  <div className="space-y-4">
                    <Checkbox label="Default checkbox" size="small" />
                    <Checkbox label="Medium checkbox" size="medium" checked />
                    <Checkbox label="Large checkbox" size="large" />
                    <Checkbox label="Indeterminate state" size="medium" indeterminate />
                  </div>
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </section>
        </div>
      </ResponsiveContainer>
    </div>
  );
}