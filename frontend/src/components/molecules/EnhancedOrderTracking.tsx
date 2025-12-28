'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Package, 
  CheckCircle, 
  Navigation,
  Timer
} from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';

// Animations
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const progressGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
`;

const celebrationBounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
`;

// Styled Components
const TrackingContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  gap: 2rem;
`;

const StatusHeader = styled(Card)`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: ${pulse} 3s ease-in-out infinite;
  }
`;

const StatusContent = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: center;
`;

const OrderInfo = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const StatusBadge = styled.div<{ status: string }>`
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: 600;
  text-align: center;
  background: ${props => {
    switch (props.status) {
      case 'CREATED': return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
      case 'ASSIGNED': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      case 'PICKED_UP': return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
      case 'IN_TRANSIT': return 'linear-gradient(135deg, #f97316, #ea580c)';
      case 'DELIVERED': return 'linear-gradient(135deg, #10b981, #059669)';
      default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
  }};
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${props => props.status === 'DELIVERED' ? celebrationBounce : 'none'} 2s ease-in-out;
`;

const ProgressSection = styled(Card)`
  padding: 2rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background-color: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin: 1rem 0 2rem 0;
  position: relative;
`;

const ProgressFill = styled(motion.div)<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 6px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const TimelineContainer = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
`;

const TimelineItem = styled(motion.div)<{ completed: boolean; current: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: ${props => {
    if (props.completed) return 'linear-gradient(135deg, #ecfdf5, #d1fae5)';
    if (props.current) return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
    return '#f9fafb';
  }};
  border: 2px solid ${props => {
    if (props.completed) return '#10b981';
    if (props.current) return '#3b82f6';
    return '#e5e7eb';
  }};
  position: relative;
  animation: ${slideUp} 0.5s ease-out;
  
  ${props => props.current && `
    animation: ${progressGlow} 2s infinite;
  `}
`;

const TimelineIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['completed', 'current'].includes(prop),
})<{ completed: boolean; current: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => {
    if (props.completed) return 'linear-gradient(135deg, #10b981, #059669)';
    if (props.current) return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    return '#e5e7eb';
  }};
  color: ${props => props.completed || props.current ? 'white' : '#6b7280'};
  box-shadow: ${props => props.completed || props.current ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'};
  transition: all 0.3s ease;
`;

const TimelineContent = styled.div`
  flex: 1;
`;

const TimelineTitle = styled.h4.withConfig({
  shouldForwardProp: (prop) => !['completed', 'current'].includes(prop),
})<{ completed: boolean; current: boolean }>`
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => {
    if (props.completed) return '#065f46';
    if (props.current) return '#1e40af';
    return '#6b7280';
  }};
`;

const TimelineDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  line-height: 1.5;
`;

const TimelineTimestamp = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const CourierCard = styled(Card)`
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border: 2px solid #3b82f6;
`;

const CourierInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CourierAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
`;

const CourierDetails = styled.div`
  flex: 1;
`;

const CourierActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const AddressCard = styled(Card)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AddressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AddressHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const AddressText = styled.p`
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
`;

const EstimatedTime = styled(motion.div)`
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  margin-top: 1rem;
`;

const CountdownTimer = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #d97706;
  margin-bottom: 0.5rem;
`;

// Interfaces
interface TrackingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
  icon: React.ComponentType<any>;
}

interface Order {
  id: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  price: number;
  created_at: string;
  assigned_courier_name?: string;
  estimated_delivery?: string;
}

interface EnhancedOrderTrackingProps {
  order: Order;
  progress_percentage: number;
  tracking_steps: TrackingStep[];
  onRefresh?: () => void;
  realTimeUpdates?: boolean;
}

const formatStatus = (status: string) => {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

const getStatusDescription = (status: string) => {
  switch (status) {
    case 'CREATED':
      return 'Your order has been created and is waiting for courier assignment.';
    case 'ASSIGNED':
      return 'A courier has been assigned and is heading to the pickup location.';
    case 'PICKED_UP':
      return 'Your order has been picked up and is ready for delivery.';
    case 'IN_TRANSIT':
      return 'Your order is on the way to the delivery location.';
    case 'DELIVERED':
      return 'Your order has been successfully delivered!';
    default:
      return 'Order status is being updated.';
  }
};

export const EnhancedOrderTracking: React.FC<EnhancedOrderTrackingProps> = ({
  order,
  progress_percentage,
  tracking_steps,
  onRefresh,
  realTimeUpdates = true
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Calculate time remaining for estimated delivery
  useEffect(() => {
    if (!order.estimated_delivery) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const delivery = new Date(order.estimated_delivery!).getTime();
      const difference = delivery - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining('00:00:00');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [order.estimated_delivery]);

  return (
    <TrackingContainer>
      {/* Status Header */}
      <StatusHeader>
        <StatusContent>
          <OrderInfo>
            <Typography variant="h2" style={{ margin: 0, color: 'white' }}>
              Order #{order.id}
            </Typography>
            <Typography variant="body" style={{ opacity: 0.9, color: 'white' }}>
              {getStatusDescription(order.status)}
            </Typography>
            <Typography variant="caption" style={{ opacity: 0.8, color: 'white' }}>
              Placed on {formatTime(order.created_at)}
            </Typography>
          </OrderInfo>
          
          <StatusBadge status={order.status}>
            {formatStatus(order.status)}
          </StatusBadge>
        </StatusContent>
      </StatusHeader>

      {/* Progress Section */}
      <ProgressSection>
        <ProgressLabel>
          <span>Delivery Progress</span>
          <span>{progress_percentage}% Complete</span>
        </ProgressLabel>
        
        <ProgressBar>
          <ProgressFill
            progress={progress_percentage}
            initial={{ width: 0 }}
            animate={{ width: `${progress_percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </ProgressBar>

        {order.estimated_delivery && order.status !== 'DELIVERED' && (
          <EstimatedTime
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Timer size={20} />
              <Typography variant="h4" style={{ margin: 0, color: '#d97706' }}>
                Estimated Delivery
              </Typography>
            </div>
            <CountdownTimer>{timeRemaining}</CountdownTimer>
            <Typography variant="caption" style={{ color: '#92400e', margin: 0 }}>
              {formatTime(order.estimated_delivery)}
            </Typography>
          </EstimatedTime>
        )}
      </ProgressSection>

      {/* Addresses */}
      <AddressCard>
        <AddressSection>
          <AddressHeader>
            <MapPin size={20} style={{ color: '#10b981' }} />
            Pickup Location
          </AddressHeader>
          <AddressText>{order.pickup_address}</AddressText>
        </AddressSection>
        
        <AddressSection>
          <AddressHeader>
            <MapPin size={20} style={{ color: '#ef4444' }} />
            Delivery Location
          </AddressHeader>
          <AddressText>{order.delivery_address}</AddressText>
        </AddressSection>
      </AddressCard>

      {/* Courier Information */}
      {order.assigned_courier_name && (
        <CourierCard>
          <Typography variant="h3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} />
            Your Courier
          </Typography>
          
          <CourierInfo>
            <CourierAvatar>
              {order.assigned_courier_name.split(' ').map(n => n[0]).join('')}
            </CourierAvatar>
            
            <CourierDetails>
              <Typography variant="h4" style={{ margin: '0 0 0.25rem 0' }}>
                {order.assigned_courier_name}
              </Typography>
              <Typography variant="caption" style={{ color: '#6b7280', margin: 0 }}>
                Professional Courier • ⭐ 4.9 Rating
              </Typography>
            </CourierDetails>
            
            <CourierActions>
              <Button variant="outline" size="small">
                <Phone size={16} />
              </Button>
              <Button variant="outline" size="small">
                <Navigation size={16} />
              </Button>
            </CourierActions>
          </CourierInfo>
        </CourierCard>
      )}

      {/* Tracking Timeline */}
      <Card>
        <Typography variant="h3" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={24} />
          Delivery Timeline
        </Typography>
        
        <TimelineContainer>
          <AnimatePresence>
            {tracking_steps.map((step, index) => (
              <TimelineItem
                key={`${step.id}-${index}`}
                completed={step.completed}
                current={step.current}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TimelineIcon completed={step.completed} current={step.current}>
                  {step.completed ? <CheckCircle size={24} /> : <step.icon size={24} />}
                </TimelineIcon>
                
                <TimelineContent>
                  <TimelineTitle completed={step.completed} current={step.current}>
                    {step.label}
                  </TimelineTitle>
                  <TimelineDescription>
                    {step.description}
                  </TimelineDescription>
                  {step.timestamp && (
                    <TimelineTimestamp>
                      <Clock size={16} />
                      {formatTime(step.timestamp)}
                    </TimelineTimestamp>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </AnimatePresence>
        </TimelineContainer>
      </Card>

      {/* Order Summary */}
      <Card>
        <Typography variant="h3" style={{ marginBottom: '1.5rem' }}>
          Order Summary
        </Typography>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <Typography variant="caption" style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Distance
            </Typography>
            <Typography variant="h3" style={{ color: '#3b82f6', margin: 0 }}>
              {order.distance_km} km
            </Typography>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <Typography variant="caption" style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Total Price
            </Typography>
            <Typography variant="h3" style={{ color: '#10b981', margin: 0 }}>
              ${order.price}
            </Typography>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <Typography variant="caption" style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Status
            </Typography>
            <Typography variant="h4" style={{ color: '#374151', margin: 0 }}>
              {formatStatus(order.status)}
            </Typography>
          </div>
        </div>
      </Card>

      {/* Real-time Updates Indicator */}
      {realTimeUpdates && (
        <Card style={{ backgroundColor: '#ecfdf5', border: '2px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981' 
              }}
            />
            <div>
              <Typography variant="h4" style={{ color: '#065f46', margin: '0 0 0.25rem 0' }}>
                Real-time Tracking Active
              </Typography>
              <Typography variant="caption" style={{ color: '#047857', margin: 0 }}>
                This page automatically updates to show the latest delivery status.
              </Typography>
            </div>
            {onRefresh && (
              <Button variant="outline" size="small" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </div>
        </Card>
      )}
    </TrackingContainer>
  );
};