# Arba Delivery Platform API Documentation

## Overview

The Arba Delivery Platform API provides endpoints for managing a multi-sided delivery marketplace. The API supports three user roles: Customers, Couriers, and Administrators, each with specific permissions and capabilities.

**Base URL:** `http://localhost:8000/api` (development) / `https://yourdomain.com/api` (production)

**API Version:** v1

**Authentication:** JWT Bearer Token

## Authentication

### Login
```http
POST /api/auth/login/
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "CUSTOMER",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Register
```http
POST /api/auth/register/
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "+1234567890"
}
```

### Refresh Token
```http
POST /api/auth/refresh/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Profile
```http
GET /api/auth/profile/
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "CUSTOMER",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Orders

### Create Order
```http
POST /api/orders/
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "pickup_address": "123 Main Street, City, State",
  "delivery_address": "456 Oak Avenue, City, State",
  "distance_km": 5.2
}
```

**Response:**
```json
{
  "id": 1,
  "customer": {
    "id": 1,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "assigned_courier": null,
  "pickup_address": "123 Main Street, City, State",
  "delivery_address": "456 Oak Avenue, City, State",
  "distance_km": "5.20",
  "price": "154.00",
  "status": "CREATED",
  "created_at": "2024-01-01T12:00:00Z",
  "assigned_at": null,
  "picked_up_at": null,
  "in_transit_at": null,
  "delivered_at": null
}
```

### List Orders
```http
GET /api/orders/
```

**Query Parameters:**
- `status` (optional): Filter by order status
- `customer` (optional): Filter by customer ID (admin only)
- `assigned_courier` (optional): Filter by courier ID
- `page` (optional): Page number for pagination
- `page_size` (optional): Number of items per page

**Response:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/orders/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "customer": {...},
      "assigned_courier": {...},
      "pickup_address": "123 Main Street",
      "delivery_address": "456 Oak Avenue",
      "distance_km": "5.20",
      "price": "154.00",
      "status": "DELIVERED",
      "created_at": "2024-01-01T12:00:00Z",
      "delivered_at": "2024-01-01T13:30:00Z"
    }
  ]
}
```

### Get Order Details
```http
GET /api/orders/{id}/
```

**Response:**
```json
{
  "id": 1,
  "customer": {
    "id": 1,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890"
  },
  "assigned_courier": {
    "id": 2,
    "email": "courier@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone_number": "+0987654321"
  },
  "pickup_address": "123 Main Street, City, State",
  "delivery_address": "456 Oak Avenue, City, State",
  "distance_km": "5.20",
  "price": "154.00",
  "status": "IN_TRANSIT",
  "created_at": "2024-01-01T12:00:00Z",
  "assigned_at": "2024-01-01T12:05:00Z",
  "picked_up_at": "2024-01-01T12:30:00Z",
  "in_transit_at": "2024-01-01T12:35:00Z",
  "delivered_at": null
}
```

### Update Order Status
```http
PATCH /api/orders/{id}/
```

**Request Body (Courier):**
```json
{
  "status": "PICKED_UP"
}
```

**Request Body (Admin - Assignment):**
```json
{
  "assigned_courier": 2
}
```

### Cancel Order
```http
DELETE /api/orders/{id}/
```

**Note:** Only customers can cancel their own orders, and only if status is "CREATED" or "ASSIGNED".

## Notifications

### List Notifications
```http
GET /api/notifications/
```

**Query Parameters:**
- `is_read` (optional): Filter by read status (true/false)
- `page` (optional): Page number for pagination

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Order Assigned",
      "message": "Your order #123 has been assigned to courier Jane Smith",
      "is_read": false,
      "created_at": "2024-01-01T12:05:00Z",
      "related_order": {
        "id": 123,
        "status": "ASSIGNED"
      }
    }
  ]
}
```

### Mark Notification as Read
```http
PATCH /api/notifications/{id}/
```

**Request Body:**
```json
{
  "is_read": true
}
```

### Mark All Notifications as Read
```http
POST /api/notifications/mark_all_read/
```

## Analytics (Admin Only)

### Dashboard Metrics
```http
GET /api/analytics/dashboard/
```

**Response:**
```json
{
  "total_orders": 150,
  "completed_orders": 120,
  "pending_orders": 25,
  "cancelled_orders": 5,
  "total_revenue": "15750.00",
  "average_delivery_time": "45.5",
  "active_couriers": 12,
  "total_customers": 85,
  "orders_today": 8,
  "revenue_today": "890.00"
}
```

### Revenue Report
```http
GET /api/analytics/revenue/
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `period` (optional): Grouping period (day/week/month)

**Response:**
```json
{
  "total_revenue": "15750.00",
  "period_data": [
    {
      "period": "2024-01-01",
      "revenue": "1250.00",
      "orders": 15
    },
    {
      "period": "2024-01-02",
      "revenue": "980.00",
      "orders": 12
    }
  ]
}
```

### Performance Metrics
```http
GET /api/analytics/performance/
```

**Response:**
```json
{
  "average_delivery_time": "45.5",
  "courier_utilization": "78.5",
  "customer_satisfaction": "4.2",
  "order_completion_rate": "95.8",
  "peak_hours": [
    {"hour": 12, "orders": 25},
    {"hour": 18, "orders": 32}
  ]
}
```

## User Management (Admin Only)

### List Users
```http
GET /api/auth/users/
```

**Query Parameters:**
- `role` (optional): Filter by user role
- `is_active` (optional): Filter by active status
- `search` (optional): Search by email or name

**Response:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "CUSTOMER",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Create User
```http
POST /api/auth/users/
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "New",
  "last_name": "User",
  "role": "COURIER",
  "phone_number": "+1234567890"
}
```

### Update User
```http
PATCH /api/auth/users/{id}/
```

**Request Body:**
```json
{
  "is_active": false,
  "role": "ADMIN"
}
```

## Courier Management

### Courier Status
```http
GET /api/auth/courier-status/
```

**Response:**
```json
{
  "courier": 2,
  "is_available": true,
  "current_orders_count": 2,
  "last_activity": "2024-01-01T12:30:00Z",
  "location_description": "Downtown area"
}
```

### Update Availability
```http
PATCH /api/auth/courier-status/
```

**Request Body:**
```json
{
  "is_available": false,
  "location_description": "North side of city"
}
```

### Available Orders (Courier)
```http
GET /api/orders/available/
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "pickup_address": "123 Main Street",
      "delivery_address": "456 Oak Avenue",
      "distance_km": "5.20",
      "price": "154.00",
      "created_at": "2024-01-01T12:00:00Z",
      "estimated_duration": "30 minutes"
    }
  ]
}
```

## Configuration Management (Admin Only)

### Get Pricing Configuration
```http
GET /api/analytics/pricing-config/
```

**Response:**
```json
{
  "id": 1,
  "base_fee": "50.00",
  "per_km_rate": "20.00",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "created_by": {
    "id": 1,
    "email": "admin@example.com"
  }
}
```

### Update Pricing Configuration
```http
POST /api/analytics/pricing-config/
```

**Request Body:**
```json
{
  "base_fee": "55.00",
  "per_km_rate": "22.00"
}
```

## Health Checks

### Application Health
```http
GET /api/health/
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1704067200.0,
  "checks": {
    "database": {"status": "healthy"},
    "redis": {"status": "healthy"}
  }
}
```

### Readiness Check
```http
GET /api/ready/
```

### Liveness Check
```http
GET /api/live/
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["This field is required"],
      "distance_km": ["Must be greater than 0"]
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `PERMISSION_DENIED` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `BUSINESS_RULE_VIOLATION` | Business logic constraint violated |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Rate Limiting

- **Authentication endpoints:** 5 requests per minute
- **General API endpoints:** 10 requests per second
- **Bulk operations:** 2 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1704067260
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Response format:
```json
{
  "count": 100,
  "next": "http://api.example.com/endpoint/?page=3",
  "previous": "http://api.example.com/endpoint/?page=1",
  "results": [...]
}
```

## WebSocket Events

### Connection
```
ws://localhost:8000/ws/orders/
```

### Authentication
Send JWT token after connection:
```json
{
  "type": "auth",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Order Status Updates
```json
{
  "type": "order_status_update",
  "order_id": 123,
  "status": "PICKED_UP",
  "timestamp": "2024-01-01T12:30:00Z"
}
```

### Notifications
```json
{
  "type": "notification",
  "notification": {
    "id": 1,
    "title": "Order Update",
    "message": "Your order is on the way!",
    "created_at": "2024-01-01T12:30:00Z"
  }
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const API_BASE = 'http://localhost:8000/api';

// Login
const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Create Order
const createOrder = async (token, orderData) => {
  const response = await fetch(`${API_BASE}/orders/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
};
```

### Python
```python
import requests

API_BASE = 'http://localhost:8000/api'

# Login
def login(email, password):
    response = requests.post(f'{API_BASE}/auth/login/', json={
        'email': email,
        'password': password
    })
    return response.json()

# Create Order
def create_order(token, order_data):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f'{API_BASE}/orders/', 
                           json=order_data, headers=headers)
    return response.json()
```

### cURL Examples
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Create Order
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pickup_address": "123 Main St",
    "delivery_address": "456 Oak Ave",
    "distance_km": 5.2
  }'

# Get Orders
curl -X GET http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Test Accounts
Development environment includes test accounts:

- **Customer:** customer@test.com / password123
- **Courier:** courier@test.com / password123  
- **Admin:** admin@test.com / password123

### Postman Collection
Import the Postman collection from `/docs/postman_collection.json` for easy API testing.

## Support

For API support and questions:
- Documentation: This file
- Health Check: `/api/health/`
- Status Page: `/api/status/`

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Authentication and user management
- Order management and tracking
- Real-time notifications
- Analytics and reporting
- Admin configuration management