'use client';

import { ResponsiveLayout } from '@/components/molecules/ResponsiveLayout';
import { Grid } from '@/components/atoms/Grid';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { useBreakpoint } from '@/lib/useBreakpoint';

export default function ResponsiveSystemPage() {
  const { isMobile, isTablet, breakpoint, windowSize } = useBreakpoint();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <ResponsiveLayout>
        <div style={{ marginTop: '32px' }}>
          <Typography variant="h2" style={{ marginBottom: '16px' }}>
            Responsive Layout System Demo
          </Typography>
          
          <Typography variant="body1" style={{ marginBottom: '32px', color: '#666' }}>
            This page demonstrates the responsive layout system with mobile-first design,
            touch-friendly interactions, and adaptive spacing.
          </Typography>

          {/* Breakpoint Information */}
          <Card padding="md" style={{ marginBottom: '32px' }}>
            <Typography variant="h3" style={{ marginBottom: '16px' }}>
              Current Viewport Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" style={{ color: '#666' }}>
                  <strong>Breakpoint:</strong> {breakpoint}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" style={{ color: '#666' }}>
                  <strong>Size:</strong> {windowSize.width} × {windowSize.height}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" style={{ color: '#666' }}>
                  <strong>Mobile:</strong> {isMobile ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" style={{ color: '#666' }}>
                  <strong>Tablet:</strong> {isTablet ? 'Yes' : 'No'}
                </Typography>
              </Grid>
            </Grid>
          </Card>

          {/* Button Size Demo */}
          <Card padding="md" style={{ marginBottom: '32px' }}>
            <Typography variant="h3" style={{ marginBottom: '16px' }}>
              Touch-Friendly Button Sizes
            </Typography>
            <Typography variant="caption" style={{ marginBottom: '16px', color: '#666' }}>
              All buttons maintain minimum 44px height on mobile for accessibility.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button size="sm" fullWidth={isMobile}>
                  Small Button
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button size="md" fullWidth={isMobile}>
                  Medium Button
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button size="lg" fullWidth={isMobile}>
                  Large Button
                </Button>
              </Grid>
            </Grid>
          </Card>

          {/* Grid System Demo */}
          <Card padding="md" style={{ marginBottom: '32px' }}>
            <Typography variant="h3" style={{ marginBottom: '16px' }}>
              Responsive Grid System
            </Typography>
            <Typography variant="caption" style={{ marginBottom: '16px', color: '#666' }}>
              Grid items automatically adjust based on screen size using breakpoints.
            </Typography>
            
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid key={item} item xs={12} sm={6} md={4} lg={2}>
                  <Card 
                    variant="elevated" 
                    padding="sm"
                    style={{ 
                      textAlign: 'center',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption">
                      Item {item}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>

          {/* Spacing Demo */}
          <Card padding="md" style={{ marginBottom: '32px' }}>
            <Typography variant="h3" style={{ marginBottom: '16px' }}>
              Responsive Spacing
            </Typography>
            <Typography variant="caption" style={{ marginBottom: '16px', color: '#666' }}>
              Spacing scales down on smaller screens to optimize space usage.
            </Typography>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '12px' : '24px',
              padding: isMobile ? '12px' : '24px',
              backgroundColor: '#e2e8f0',
              borderRadius: '8px'
            }}>
              <div style={{ 
                padding: isMobile ? '8px' : '16px',
                backgroundColor: 'white',
                borderRadius: '4px',
                flex: 1
              }}>
                <Typography variant="caption">
                  Spacing: {isMobile ? 'Compact' : 'Comfortable'}
                </Typography>
              </div>
              <div style={{ 
                padding: isMobile ? '8px' : '16px',
                backgroundColor: 'white',
                borderRadius: '4px',
                flex: 1
              }}>
                <Typography variant="caption">
                  Layout: {isMobile ? 'Stacked' : 'Side-by-side'}
                </Typography>
              </div>
            </div>
          </Card>

          {/* Text Readability Demo */}
          <Card padding="md">
            <Typography variant="h3" style={{ marginBottom: '16px' }}>
              Responsive Typography
            </Typography>
            <Typography variant="caption" style={{ marginBottom: '16px', color: '#666' }}>
              Text size and line height adjust for optimal readability across devices.
            </Typography>
            
            <div style={{
              fontSize: isMobile ? '14px' : '16px',
              lineHeight: 1.6,
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}>
              <p>
                This paragraph demonstrates responsive typography. The font size is {isMobile ? '14px' : '16px'} 
                on {isMobile ? 'mobile' : 'desktop'} devices. The text automatically wraps and maintains 
                proper line height for readability. Long words will break appropriately to prevent 
                horizontal scrolling: supercalifragilisticexpialidocious.
              </p>
              <p>
                The responsive design ensures that content remains accessible and readable across 
                all device sizes, from mobile phones to large desktop screens.
              </p>
            </div>
          </Card>
        </div>
      </ResponsiveLayout>
    </div>
  );
}