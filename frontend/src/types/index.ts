export interface User {
  id: number;
  username: string;
  email: string;
  role: 'CUSTOMER' | 'COURIER' | 'ADMIN';
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  customer: User;
  assigned_courier?: User;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  price: number;
  status: 'CREATED' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  created_at: string;
  assigned_at?: string;
  picked_up_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
}

export interface PricingConfig {
  id: number;
  base_fee: number;
  per_km_rate: number;
  is_active: boolean;
  created_at: string;
  created_by: User;
}

export interface CourierStatus {
  id: number;
  courier: User;
  is_available: boolean;
  current_orders_count: number;
  last_activity: string;
  location_description: string;
}

export interface Notification {
  id: number;
  user: User;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_order?: Order;
}

export interface AnalyticsMetric {
  id: number;
  metric_type: 'DAILY_ORDERS' | 'DAILY_REVENUE' | 'COURIER_PERFORMANCE' | 'CUSTOMER_ACTIVITY';
  metric_value: number;
  date: string;
  related_user?: User;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateOrderRequest {
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone_number: string;
  role?: 'CUSTOMER' | 'COURIER';
}