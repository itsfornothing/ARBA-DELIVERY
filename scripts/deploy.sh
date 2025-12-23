#!/bin/bash

# Deployment script for Delivery Platform
set -e

echo "🚀 Starting Delivery Platform deployment..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please copy .env.production to .env.prod and configure your production settings."
    exit 1
fi

# Load environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=("SECRET_KEY" "POSTGRES_PASSWORD" "REDIS_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set!"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create necessary directories
mkdir -p logs ssl backups

# Build and start services
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🗄️ Starting database and Redis..."
docker-compose -f docker-compose.prod.yml up -d db redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}; do
    sleep 2
done

echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

echo "👤 Creating superuser (if needed)..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@delivery.com').exists():
    User.objects.create_superuser('admin@delivery.com', 'admin', 'admin123')
    print('Superuser created: admin@delivery.com / admin123')
else:
    print('Superuser already exists')
"

echo "📦 Collecting static files..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput

echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "🏥 Checking service health..."
sleep 30

# Check if services are running
services=("delivery_db" "delivery_redis" "delivery_backend" "delivery_frontend" "delivery_nginx")
for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
        docker-compose -f docker-compose.prod.yml logs $service
        exit 1
    fi
done

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost/api"
echo "   Admin Panel: http://localhost/admin"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f [service_name]"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose -f docker-compose.prod.yml down"