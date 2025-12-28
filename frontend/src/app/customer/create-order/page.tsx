'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { OrderCreationWizard } from '@/components/molecules/OrderCreationWizard';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';

interface OrderData {
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  special_instructions?: string;
}

export default function CreateOrderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingConfig] = useState({ base_fee: 50, per_km_rate: 20 });
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    
    if (!token || userRole !== 'CUSTOMER') {
      router.push('/auth/login');
      return;
    }
    
    apiClient.setAuthToken(token);
  }, [router]);

  const handleOrderSubmit = async (data: OrderData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Client-side validation
      const pickup = data.pickup_address.trim().toLowerCase();
      const delivery = data.delivery_address.trim().toLowerCase();
      
      if (pickup === delivery) {
        setError('Pickup and delivery addresses cannot be the same');
        throw new Error('Pickup and delivery addresses cannot be the same');
      }

      const response = await apiClient.createOrder(data);
      
      if (response.error) {
        setError(response.error);
        throw new Error(response.error);
      }

      // Redirect to order tracking page after a brief delay to show success animation
      setTimeout(() => {
        if (response.data?.id) {
          router.push(`/customer/orders/${response.data.id}`);
        } else {
          router.push('/customer/dashboard');
        }
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create order. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white shadow-soft border-b border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Button
                as={Link}
                href="/customer/dashboard"
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="h-5 w-5" />}
                className="mr-4"
              >
                Back to Dashboard
              </Button>
              <Typography variant="h4" className="mb-0">
                Create New Order
              </Typography>
            </div>
          </div>
        </header>

        <main className="py-6">
          {error && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <Card variant="outlined" className="border-error-200 bg-error-50">
                <Typography variant="body2" color="error" className="mb-0">
                  {error}
                </Typography>
              </Card>
            </div>
          )}

          <OrderCreationWizard
            onSubmit={handleOrderSubmit}
            pricingConfig={pricingConfig}
            isLoading={isLoading}
          />
        </main>
      </div>
    </ThemeProvider>
  );
}