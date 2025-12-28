'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './Skeleton';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  blurDataURL?: string;
}

interface ImageState {
  loaded: boolean;
  error: boolean;
  inView: boolean;
}

const ImageContainer = styled.div<{
  $width?: string | number;
  $height?: string | number;
}>`
  position: relative;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  width: ${({ $width }) => 
    typeof $width === 'number' ? `${$width}px` : $width || '100%'
  };
  height: ${({ $height }) => 
    typeof $height === 'number' ? `${$height}px` : $height || 'auto'
  };
`;

const Image = styled(motion.img)<{
  $loaded: boolean;
}>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all ${({ theme }) => theme.animations.duration.normal}ms ${({ theme }) => theme.animations.easing.easeOut};
  
  ${({ $loaded }) => !$loaded && css`
    opacity: 0;
  `}
`;

const PlaceholderImage = styled(motion.img)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(10px);
  transform: scale(1.1);
`;

const LoadingSkeleton = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.surface};
`;

const ErrorState = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ErrorIcon = styled.div`
  width: 48px;
  height: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  opacity: 0.5;
  
  &::before {
    content: '🖼️';
    font-size: 48px;
  }
`;

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  width,
  height,
  className,
  onLoad,
  onError,
  lazy = true,
  blurDataURL,
}) => {
  const [state, setState] = useState<ImageState>({
    loaded: false,
    error: false,
    inView: false,
  });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) {
      setState(prev => ({ ...prev, inView: true }));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, inView: true }));
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  // Handle image loading
  useEffect(() => {
    if (!state.inView) return;

    const img = new window.Image();
    
    img.onload = () => {
      setState(prev => ({ ...prev, loaded: true, error: false }));
      onLoad?.();
    };
    
    img.onerror = () => {
      setState(prev => ({ ...prev, error: true, loaded: false }));
      onError?.();
    };
    
    img.src = src;
  }, [src, state.inView, onLoad, onError]);

  return (
    <ImageContainer
      ref={containerRef}
      $width={width}
      $height={height}
      className={className}
    >
      <AnimatePresence mode="wait">
        {!state.inView || (!state.loaded && !state.error) ? (
          <LoadingSkeleton
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height="100%" 
              animation="wave"
            />
          </LoadingSkeleton>
        ) : state.error ? (
          <ErrorState
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ErrorIcon />
            <div>Failed to load image</div>
          </ErrorState>
        ) : (
          <motion.div
            key="loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Blur placeholder if provided */}
            {(placeholder || blurDataURL) && (
              <AnimatePresence>
                {!state.loaded && (
                  <PlaceholderImage
                    src={placeholder || blurDataURL}
                    alt=""
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>
            )}
            
            {/* Main image */}
            <Image
              ref={imgRef}
              src={src}
              alt={alt}
              $loaded={state.loaded}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ 
                opacity: state.loaded ? 1 : 0,
                scale: state.loaded ? 1 : 1.05
              }}
              transition={{ 
                duration: 0.5,
                ease: 'easeOut'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ImageContainer>
  );
};