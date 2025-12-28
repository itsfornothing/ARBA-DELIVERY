'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/atoms/Card';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  password_confirm: z.string(),
  phone_number: z.string().min(10, 'Please enter a valid phone number'),
  role: z.enum(['CUSTOMER', 'COURIER'], {
    required_error: 'Please select a role',
  }),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CUSTOMER',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.register(data);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card variant="elevated" padding="lg">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Typography variant="h2" color="neutral" className="mb-4">
                Welcome to Arba Delivery!
              </Typography>
              <Typography variant="body1" color="muted">
                Your account has been created successfully. Redirecting you to the login page...
              </Typography>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card variant="elevated" padding="lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <Typography variant="h2" color="primary" className="mb-3">
              Join Arba Delivery
            </Typography>
            <Typography variant="body2" color="muted">
              Create your account to get started
            </Typography>
          </div>
        
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-error-50 border-l-4 border-error-500 text-error-700 px-4 py-3 rounded-lg">
                <Typography variant="body2" color="error" className="font-medium">
                  {error}
                </Typography>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-neutral-700 mb-2">
                  I want to
                </label>
                <select
                  {...register('role')}
                  className="block w-full px-4 py-3 border-2 border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                >
                  <option value="CUSTOMER">Order deliveries (Customer)</option>
                  <option value="COURIER">Provide delivery services (Courier)</option>
                </select>
                {errors.role && (
                  <Typography variant="caption" color="error" className="mt-2">
                    {errors.role.message}
                  </Typography>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('first_name')}
                  label="First Name"
                  placeholder="First name"
                  error={errors.first_name?.message}
                  size="md"
                />
                
                <Input
                  {...register('last_name')}
                  label="Last Name"
                  placeholder="Last name"
                  error={errors.last_name?.message}
                  size="md"
                />
              </div>
              
              <Input
                {...register('username')}
                label="Username"
                placeholder="Choose a username"
                error={errors.username?.message}
                fullWidth
                size="md"
              />
              
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                error={errors.email?.message}
                fullWidth
                size="md"
              />
              
              <Input
                {...register('phone_number')}
                type="tel"
                label="Phone Number"
                placeholder="Enter your phone number"
                error={errors.phone_number?.message}
                fullWidth
                size="md"
              />
              
              <Input
                {...register('password')}
                type="password"
                label="Password"
                placeholder="Create a password"
                error={errors.password?.message}
                fullWidth
                size="md"
              />
              
              <Input
                {...register('password_confirm')}
                type="password"
                label="Confirm Password"
                placeholder="Confirm your password"
                error={errors.password_confirm?.message}
                fullWidth
                size="md"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              fullWidth
              className="mt-6"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
            
            <div className="flex flex-col space-y-3 pt-4 border-t border-neutral-200">
              <Link href="/auth/login" className="block">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                >
                  Already have an account? Sign in
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  }
                >
                  Back to home
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}