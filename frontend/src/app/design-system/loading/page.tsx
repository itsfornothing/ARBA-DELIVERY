'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/atoms/Card';
import { Skeleton } from '@/components/atoms/Skeleton';
import { ProgressiveImage } from '@/components/atoms/ProgressiveImage';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { 
  LoadingSpinner, 
  LoadingOverlay,
  OrderCardSkeleton,
  DashboardStatsSkeleton,
  FormSkeleton,
  TableSkeleton,
  ProfileSkeleton,
  ChartSkeleton
} from '@/components/molecules';
import { useLoading, LoadingKeys } from '@/lib/loadingState';

export default function LoadingStatesPage() {
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [backdropLoading, setBackdropLoading] = useState(false);
  const { loading: demoLoading, startLoading, stopLoading } = useLoading(LoadingKeys.COMPONENT_LOAD);

  const handleDemoLoading = () => {
    startLoading();
    setTimeout(stopLoading, 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <ResponsiveContainer size="desktop">
        <div className="text-center mb-8">
          <Typography variant="h1" className="mb-4">
            Loading States & Skeleton Screens
          </Typography>
          <Typography variant="body1" color="muted">
            Comprehensive loading indicators and skeleton screens for better user experience
          </Typography>
        </div>

        <div className="space-y-12">
          <section>
            <Typography variant="h2" className="mb-6">Loading Spinners</Typography>
            <div className="flex gap-4 items-center flex-wrap mb-6">
              <LoadingSpinner size="small" />
              <LoadingSpinner size="medium" />
              <LoadingSpinner size="large" />
            </div>
            
            <div className="flex gap-4 items-center flex-wrap">
              <LoadingSpinner variant="dots" color="primary" />
              <LoadingSpinner variant="pulse" color="secondary" />
              <LoadingSpinner variant="spinner" color="muted" />
            </div>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Skeleton Components</Typography>
            <div className="flex gap-4 items-center flex-wrap">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="circular" width={48} height={48} />
              <Skeleton variant="rounded" width={120} height={60} />
            </div>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Loading Overlays</Typography>
            <ResponsiveGrid columns="double" gap="responsive">
              <Card variant="elevated" className="h-[300px] relative">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Overlay Loading</Typography>
                  <Button onClick={() => setOverlayLoading(!overlayLoading)}>
                    Toggle Overlay
                  </Button>
                  <LoadingOverlay 
                    loading={overlayLoading} 
                    message="Loading content..." 
                    variant="overlay"
                  />
                </CardContent>
              </Card>
              
              <Card variant="elevated" className="h-[300px] relative">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Inline Loading</Typography>
                  <Button onClick={handleDemoLoading}>
                    Start Demo Loading
                  </Button>
                  <LoadingOverlay 
                    loading={demoLoading} 
                    message="Processing..." 
                    variant="inline"
                  />
                </CardContent>
              </Card>
            </ResponsiveGrid>
            
            <div className="flex gap-4 items-center flex-wrap mt-6">
              <Button onClick={() => setBackdropLoading(true)}>
                Show Backdrop Loading
              </Button>
            </div>
            
            <LoadingOverlay 
              loading={backdropLoading} 
              message="Please wait..." 
              variant="backdrop"
            />
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Skeleton Screens</Typography>
            <ResponsiveGrid columns="double" gap="responsive">
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Order Card Skeleton</Typography>
                  <OrderCardSkeleton />
                </CardContent>
              </Card>
              
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Form Skeleton</Typography>
                  <FormSkeleton />
                </CardContent>
              </Card>
            </ResponsiveGrid>
            
            <Card variant="elevated" className="mt-6">
              <CardContent>
                <Typography variant="h4" className="mb-4">Dashboard Stats Skeleton</Typography>
                <DashboardStatsSkeleton />
              </CardContent>
            </Card>
            
            <ResponsiveGrid columns="double" gap="responsive" className="mt-6">
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Profile Skeleton</Typography>
                  <ProfileSkeleton />
                </CardContent>
              </Card>
              
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Chart Skeleton</Typography>
                  <ChartSkeleton />
                </CardContent>
              </Card>
            </ResponsiveGrid>
            
            <Card variant="elevated" className="mt-6">
              <CardContent>
                <Typography variant="h4" className="mb-4">Table Skeleton</Typography>
                <TableSkeleton rows={3} columns={4} />
              </CardContent>
            </Card>
          </section>

          <section>
            <Typography variant="h2" className="mb-6">Progressive Image Loading</Typography>
            <ResponsiveGrid columns="double" gap="responsive">
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Progressive Image</Typography>
                  <ProgressiveImage
                    src="https://picsum.photos/400/300"
                    alt="Demo image"
                    width="100%"
                    height="200px"
                    placeholder="https://picsum.photos/40/30"
                  />
                </CardContent>
              </Card>
              
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">Lazy Loading Image</Typography>
                  <ProgressiveImage
                    src="https://picsum.photos/400/301"
                    alt="Lazy loaded image"
                    width="100%"
                    height="200px"
                    lazy={true}
                  />
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </section>
        </div>
      </ResponsiveContainer>
    </div>
  );
}