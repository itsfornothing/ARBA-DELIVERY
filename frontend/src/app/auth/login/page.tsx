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

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(data);
      
      console.log('Login response:', response); // Debug log
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data?.access) {
        // Store token and user info
        localStorage.setItem('auth_token', response.data.access);
        localStorage.setItem('user_role', response.data.user.role);
        localStorage.setItem('user_id', response.data.user.id.toString());
        
        // Set token in API client
        apiClient.setAuthToken(response.data.access);
        
        // Small delay to ensure localStorage operations complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect based on role
        console.log('User role:', response.data.user.role); // Debug log
        if (response.data.user.role === 'CUSTOMER') {
          console.log('Redirecting to customer dashboard'); // Debug log
          router.push('/customer/dashboard');
        } else if (response.data.user.role === 'COURIER') {
          console.log('Redirecting to courier dashboard'); // Debug log
          router.push('/courier/dashboard');
        } else if (response.data.user.role === 'ADMIN') {
          console.log('Redirecting to admin dashboard'); // Debug log
          router.push('/admin/dashboard');
        } else {
          console.log('Unknown role, redirecting to home'); // Debug log
          router.push('/');
        }
      } else {
        console.log('No access token in response'); // Debug log
        setError('Login successful but no access token received');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card variant="elevated" padding="lg">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <Typography variant="h3" color="primary" className="mb-2 sm:mb-3">
              Welcome to Arba Delivery
            </Typography>
            <Typography variant="body2" color="muted">
              Sign in to continue to your account
            </Typography>
          </div>
        
          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-error-50 border-l-4 border-error-500 text-error-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg">
                <Typography variant="body2" color="error" className="font-medium text-sm">
                  {error}
                </Typography>
              </div>
            )}
            
            <div className="space-y-4 sm:space-y-5">
              <Input
                {...register('username')}
                label="Username"
                placeholder="Enter your username"
                error={errors.username?.message}
                fullWidth
                size="md"
              />
              
              <Input
                {...register('password')}
                type="password"
                label="Password"
                placeholder="Enter your password"
                error={errors.password?.message}
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
              className="mt-5 sm:mt-6"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            
            <div className="flex flex-col space-y-3 pt-3 sm:pt-4 border-t border-neutral-200">
              <Link href="/auth/register" className="block">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                >
                  Don't have an account? Create one
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