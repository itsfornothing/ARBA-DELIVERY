'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { Container } from '@/components/atoms/Container';
import { Grid } from '@/components/atoms/Grid';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useBreakpoint } from '@/lib/useBreakpoint';
import { ThemeConfig } from '@/lib/theme';

interface ResponsiveLayoutProps {
  children?: React.ReactNode;
}

const ResponsiveSection = styled.section<{ $isMobile: boolean }>`
  padding: ${({ theme, $isMobile }) => 
    $isMobile 
      ? `${theme.spacing.scale[4] * theme.spacing.unit}px 0`
      : `${theme.spacing.scale[8] * theme.spacing.unit}px 0`
  };
  
  ${({ $isMobile, theme }) => $isMobile && css`
    /* Mobile-specific optimizations */
    touch-action: manipulation; /* Improve touch responsiveness */
    -webkit-tap-highlight-color: transparent; /* Remove tap highlight on iOS */
  `}
`;

const ResponsiveGrid = styled(Grid)<{ $isMobile: boolean }>`
  ${({ $isMobile }) => $isMobile && css`
    /* Ensure proper spacing on mobile */
    margin: 0 -8px;
    width: calc(100% + 16px);
  `}
`;

const TouchOptimizedCard = styled(Card)<{ $isMobile: boolean }>`
  ${({ $isMobile, theme }) => $isMobile && css`
    /* Optimize for touch interaction */
    min-height: 44px;
    cursor: pointer;
    
    &:active {
      transform: scale(0.98);
      transition: transform ${theme.animations.duration.fast}ms ${theme.animations.easing.easeOut};
    }
  `}
`;

const ResponsiveText = styled.div<{ $isMobile: boolean }>`
  font-size: ${({ $isMobile }) => $isMobile ? '14px' : '16px'};
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  
  ${({ $isMobile, theme }) => $isMobile && css`
    /* Improve readability on mobile */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-size-adjust: 100%; /* Prevent text scaling on iOS */
  `}
`;

const MobileOptimizedForm = styled.form<{ $isMobile: boolean }>`
  ${({ $isMobile, theme }) => $isMobile && css`
    /* Mobile form optimizations */
    .input-group {
      margin-bottom: ${theme.spacing.scale[4] * theme.spacing.unit}px;
    }
    
    /* Ensure form elements are touch-friendly */
    input, button, select, textarea {
      min-height: 44px;
      font-size: 16px; /* Prevent zoom on iOS */
    }
  `}
`;

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const { isMobile, isTablet, breakpoint, windowSize } = useBreakpoint();

  return (
    <Container maxWidth="lg">
      <ResponsiveSection $isMobile={isMobile}>
        {/* Responsive Grid Demo */}
        <ResponsiveGrid container spacing={isMobile ? 1 : 2} $isMobile={isMobile}>
          <Grid item xs={12} md={6} lg={4}>
            <TouchOptimizedCard 
              interactive 
              $isMobile={isMobile}
              padding={isMobile ? 'small' : 'medium'}
            >
              <ResponsiveText $isMobile={isMobile}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '18px' : '20px' }}>
                  Responsive Card 1
                </h3>
                <p style={{ margin: 0, color: '#666' }}>
                  This card adapts to different screen sizes. On mobile, it takes full width,
                  on tablet it takes half width, and on desktop it takes one-third width.
                </p>
              </ResponsiveText>
            </TouchOptimizedCard>
          </Grid>
          
          <Grid item xs={12} md={6} lg={4}>
            <TouchOptimizedCard 
              interactive 
              $isMobile={isMobile}
              padding={isMobile ? 'small' : 'medium'}
            >
              <ResponsiveText $isMobile={isMobile}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '18px' : '20px' }}>
                  Responsive Card 2
                </h3>
                <p style={{ margin: 0, color: '#666' }}>
                  Touch targets are optimized for mobile devices with minimum 44px height.
                  Text size and spacing adjust based on screen size.
                </p>
              </ResponsiveText>
            </TouchOptimizedCard>
          </Grid>
          
          <Grid item xs={12} md={12} lg={4}>
            <TouchOptimizedCard 
              interactive 
              $isMobile={isMobile}
              padding={isMobile ? 'small' : 'medium'}
            >
              <ResponsiveText $isMobile={isMobile}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '18px' : '20px' }}>
                  Responsive Card 3
                </h3>
                <p style={{ margin: 0, color: '#666' }}>
                  Current breakpoint: {breakpoint} ({windowSize.width}x{windowSize.height})
                </p>
              </ResponsiveText>
            </TouchOptimizedCard>
          </Grid>
        </ResponsiveGrid>

        {/* Responsive Form Demo */}
        <div style={{ marginTop: isMobile ? '24px' : '48px' }}>
          <ResponsiveText $isMobile={isMobile}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: isMobile ? '20px' : '24px' }}>
              Responsive Form Elements
            </h2>
          </ResponsiveText>
          
          <MobileOptimizedForm $isMobile={isMobile}>
            <ResponsiveGrid container spacing={isMobile ? 1 : 2} $isMobile={isMobile}>
              <Grid item xs={12} sm={6}>
                <div className="input-group">
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    size={isMobile ? 'medium' : 'medium'}
                    fullWidth
                  />
                </div>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <div className="input-group">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    size={isMobile ? 'medium' : 'medium'}
                    fullWidth
                  />
                </div>
              </Grid>
              
              <Grid item xs={12}>
                <div className="input-group">
                  <Input
                    label="Message"
                    placeholder="Enter your message"
                    size={isMobile ? 'medium' : 'medium'}
                    fullWidth
                  />
                </div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="primary"
                  size={isMobile ? 'medium' : 'medium'}
                  fullWidth={isMobile}
                >
                  Submit Form
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outline"
                  size={isMobile ? 'medium' : 'medium'}
                  fullWidth={isMobile}
                >
                  Cancel
                </Button>
              </Grid>
            </ResponsiveGrid>
          </MobileOptimizedForm>
        </div>

        {/* Custom content */}
        {children}
      </ResponsiveSection>
    </Container>
  );
};