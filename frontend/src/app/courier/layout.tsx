'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface CourierLayoutProps {
  children: React.ReactNode;
}

export default function CourierLayout({ children }: CourierLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    
    if (!token || role !== 'COURIER') {
      router.push('/auth/login');
      return;
    }
    
    apiClient.setAuthToken(token);
    setUserRole(role);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'COURIER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/courier/dashboard" className="text-xl font-bold">
                Arba Delivery Courier
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/courier/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/courier/orders"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                My Orders
              </Link>
              <Link
                href="/courier/available"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Available Orders
              </Link>
              <Link
                href="/courier/profile"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}