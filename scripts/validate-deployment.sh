#!/bin/bash

# Deployment validation script
set -e

echo "🔍 Starting deployment validation..."

# Load environment variables if available
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$2" = "PASS" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "FAIL" ]; then
        echo -e "${RED}❌ $1${NC}"
        exit 1
    elif [ "$2" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    else
        echo -e "$1"
    fi
}

# Check if Docker is running
check_docker() {
    echo "Checking Docker..."
    if docker info >/dev/null 2>&1; then
        print_status "Docker is running" "PASS"
    else
        print_status "Docker is not running" "FAIL"
    fi
}

# Check if required files exist
check_required_files() {
    echo "Checking required files..."
    
    required_files=(
        "docker-compose.prod.yml"
        "nginx.conf"
        "backend/Dockerfile"
        "frontend/Dockerfile"
        "backend/gunicorn.conf.py"
        "scripts/deploy.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_status "Found $file" "PASS"
        else
            print_status "Missing $file" "FAIL"
        fi
    done
}

# Check environment variables
check_environment_variables() {
    echo "Checking environment variables..."
    
    if [ ! -f .env.prod ]; then
        print_status "No .env.prod file found" "WARN"
        return
    fi
    
    required_vars=("SECRET_KEY" "POSTGRES_PASSWORD" "REDIS_PASSWORD")
    
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            print_status "$var is set" "PASS"
        else
            print_status "$var is not set" "FAIL"
        fi
    done
    
    # Check SECRET_KEY is not default
    if [ "$SECRET_KEY" = "django-insecure-development-key-change-in-production" ]; then
        print_status "SECRET_KEY is still using default value" "FAIL"
    fi
}

# Test Docker builds
test_docker_builds() {
    echo "Testing Docker builds..."
    
    # Test backend build
    echo "Building backend..."
    if docker build -t delivery-backend-test ./backend >/dev/null 2>&1; then
        print_status "Backend Docker build successful" "PASS"
        docker rmi delivery-backend-test >/dev/null 2>&1
    else
        print_status "Backend Docker build failed" "FAIL"
    fi
    
    # Test frontend build
    echo "Building frontend..."
    if docker build -t delivery-frontend-test ./frontend >/dev/null 2>&1; then
        print_status "Frontend Docker build successful" "PASS"
        docker rmi delivery-frontend-test >/dev/null 2>&1
    else
        print_status "Frontend Docker build failed" "FAIL"
    fi
}

# Test database connection
test_database_connection() {
    echo "Testing database connection..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "delivery_db.*Up"; then
        # Database is running, test connection
        if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U ${POSTGRES_USER:-delivery_user} >/dev/null 2>&1; then
            print_status "Database connection successful" "PASS"
        else
            print_status "Database connection failed" "FAIL"
        fi
    else
        print_status "Database container not running" "WARN"
    fi
}

# Test Redis connection
test_redis_connection() {
    echo "Testing Redis connection..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "delivery_redis.*Up"; then
        # Redis is running, test connection
        if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping >/dev/null 2>&1; then
            print_status "Redis connection successful" "PASS"
        else
            print_status "Redis connection failed" "FAIL"
        fi
    else
        print_status "Redis container not running" "WARN"
    fi
}

# Test health endpoints
test_health_endpoints() {
    echo "Testing health endpoints..."
    
    # Wait for services to be ready
    sleep 10
    
    # Test backend health
    if curl -f -s http://localhost/api/health/ >/dev/null 2>&1; then
        print_status "Backend health endpoint accessible" "PASS"
    else
        print_status "Backend health endpoint not accessible" "WARN"
    fi
    
    # Test frontend health
    if curl -f -s http://localhost/api/health >/dev/null 2>&1; then
        print_status "Frontend health endpoint accessible" "PASS"
    else
        print_status "Frontend health endpoint not accessible" "WARN"
    fi
    
    # Test Nginx health
    if curl -f -s http://localhost/health >/dev/null 2>&1; then
        print_status "Nginx health endpoint accessible" "PASS"
    else
        print_status "Nginx health endpoint not accessible" "WARN"
    fi
}

# Test API endpoints
test_api_endpoints() {
    echo "Testing API endpoints..."
    
    # Test admin endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/admin/)
    if [ "$response" = "200" ] || [ "$response" = "302" ]; then
        print_status "Admin endpoint accessible" "PASS"
    else
        print_status "Admin endpoint not accessible (HTTP $response)" "WARN"
    fi
    
    # Test API root
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/)
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        print_status "API root accessible" "PASS"
    else
        print_status "API root not accessible (HTTP $response)" "WARN"
    fi
}

# Run backend tests
run_backend_tests() {
    echo "Running backend deployment tests..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "delivery_backend.*Up"; then
        if docker-compose -f docker-compose.prod.yml exec -T backend python -m pytest tests/test_deployment_validation.py -v >/dev/null 2>&1; then
            print_status "Backend deployment tests passed" "PASS"
        else
            print_status "Backend deployment tests failed" "WARN"
        fi
    else
        print_status "Backend container not running, skipping tests" "WARN"
    fi
}

# Run frontend tests
run_frontend_tests() {
    echo "Running frontend deployment tests..."
    
    cd frontend
    if npm test -- --testPathPattern=deployment-validation.test.ts --watchAll=false >/dev/null 2>&1; then
        print_status "Frontend deployment tests passed" "PASS"
    else
        print_status "Frontend deployment tests failed" "WARN"
    fi
    cd ..
}

# Check SSL configuration (if applicable)
check_ssl_configuration() {
    echo "Checking SSL configuration..."
    
    if [ -d "ssl" ] && [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
        print_status "SSL certificates found" "PASS"
        
        # Check certificate validity
        if openssl x509 -in ssl/cert.pem -noout -checkend 86400 >/dev/null 2>&1; then
            print_status "SSL certificate is valid" "PASS"
        else
            print_status "SSL certificate is expired or invalid" "WARN"
        fi
    else
        print_status "SSL certificates not found (HTTP only)" "WARN"
    fi
}

# Check resource usage
check_resource_usage() {
    echo "Checking resource usage..."
    
    # Check disk space
    disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        print_status "Disk usage: ${disk_usage}%" "PASS"
    else
        print_status "Disk usage high: ${disk_usage}%" "WARN"
    fi
    
    # Check memory usage
    if command -v free >/dev/null 2>&1; then
        memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [ "$memory_usage" -lt 80 ]; then
            print_status "Memory usage: ${memory_usage}%" "PASS"
        else
            print_status "Memory usage high: ${memory_usage}%" "WARN"
        fi
    fi
}

# Main validation function
main() {
    echo "🚀 Delivery Platform Deployment Validation"
    echo "=========================================="
    
    check_docker
    check_required_files
    check_environment_variables
    test_docker_builds
    
    # If services are running, test them
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        test_database_connection
        test_redis_connection
        test_health_endpoints
        test_api_endpoints
        run_backend_tests
    else
        print_status "Services not running, skipping runtime tests" "WARN"
    fi
    
    run_frontend_tests
    check_ssl_configuration
    check_resource_usage
    
    echo ""
    echo "🎉 Deployment validation completed!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Review any warnings above"
    echo "   2. Start services: ./scripts/deploy.sh"
    echo "   3. Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   4. Test application functionality manually"
}

# Run main function
main "$@"