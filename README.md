# Arba Delivery - Delivery Platform

A multi-sided delivery platform connecting customers, couriers, and administrators in a comprehensive delivery ecosystem.

## Project Structure

```
Arba-Delivery/
├── backend/          # Django REST API backend
│   ├── accounts/     # User management and authentication
│   ├── orders/       # Order management and tracking
│   ├── notifications/# Notification system
│   ├── analytics/    # Analytics and reporting
│   └── tests/        # Property-based and unit tests
└── frontend/         # Next.js React frontend
    ├── src/
    │   ├── app/      # Next.js app router pages
    │   ├── lib/      # Utility functions and API client
    │   └── types/    # TypeScript type definitions
    └── public/       # Static assets
```

## Features

### Stage 1 - Core Platform (Current)
- **User Management**: Customer, Courier, and Admin roles
- **Order System**: Create, assign, and track deliveries
- **Real-time Updates**: WebSocket support for live tracking
- **Pricing Engine**: Distance-based pricing calculations
- **Admin Dashboard**: User and order management
- **Analytics**: Performance metrics and reporting

### User Roles
- **Customers**: Place delivery orders with transparent pricing
- **Couriers**: Accept orders and update delivery status
- **Admins**: Manage users, orders, and system configuration

## Technology Stack

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Primary database (SQLite for development)
- **Redis** - Caching and WebSocket support
- **Channels** - WebSocket handling
- **Celery** - Background task processing
- **Hypothesis** - Property-based testing

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching
- **Socket.io** - Real-time communication
- **React Hook Form** - Form handling

## Quick Start

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd Arba-Delivery/backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```

6. Start development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd Arba-Delivery/frontend
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open browser to `http://localhost:3000`

## Development

### Running Tests

Backend tests (including property-based tests):
```bash
cd Arba-Delivery/backend
python -m pytest -v
```

Frontend tests:
```bash
cd Arba-Delivery/frontend
npm test
```

### API Endpoints

The backend provides REST API endpoints at `http://localhost:8000/`:

- `/auth/` - Authentication and user management
- `/orders/` - Order creation and management
- `/notifications/` - Notification system
- `/analytics/` - Analytics and reporting
- `/admin/` - Django admin interface

### Environment Variables

Backend (`.env`):
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Frontend (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Architecture

The platform follows a clean architecture with:

- **Separation of Concerns**: Clear boundaries between frontend, backend, and data layers
- **Role-Based Access Control**: Different interfaces for customers, couriers, and admins
- **Real-time Updates**: WebSocket connections for live order tracking
- **Property-Based Testing**: Comprehensive correctness validation
- **Scalable Design**: Prepared for production deployment

## Contributing

1. Follow the existing code style and patterns
2. Write property-based tests for new features
3. Update documentation for API changes
4. Test both frontend and backend components

## License

This project is developed for demonstration purposes.