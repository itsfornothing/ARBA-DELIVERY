# Delivery Platform - Production Deployment Guide

This guide covers the production deployment of the Delivery Platform using Docker containers, Nginx reverse proxy, and PostgreSQL database.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM and 20GB disk space
- Domain name configured (for production)
- SSL certificates (for HTTPS)

## Quick Start

1. **Clone and prepare the environment:**
   ```bash
   git clone <repository-url>
   cd Arba-Delivery
   cp .env.production .env.prod
   ```

2. **Configure environment variables:**
   Edit `.env.prod` with your production settings:
   ```bash
   nano .env.prod
   ```

3. **Deploy the application:**
   ```bash
   ./scripts/deploy.sh
   ```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `your-super-secret-key` |
| `POSTGRES_PASSWORD` | Database password | `secure-db-password` |
| `REDIS_PASSWORD` | Redis password | `secure-redis-password` |
| `ALLOWED_HOSTS` | Allowed hostnames | `yourdomain.com,www.yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | CORS origins | `https://yourdomain.com` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `delivery_platform` |
| `POSTGRES_USER` | Database user | `delivery_user` |
| `EMAIL_HOST` | SMTP server | `localhost` |
| `SENTRY_DSN` | Error tracking | None |

## Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Internet  │───▶│    Nginx    │───▶│  Frontend   │
└─────────────┘    │ (Port 80)   │    │ (Port 3000) │
                   └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   Backend   │───▶│ PostgreSQL  │
                   │ (Port 8000) │    │ (Port 5432) │
                   └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   Celery    │───▶│    Redis    │
                   │   Worker    │    │ (Port 6379) │
                   └─────────────┘    └─────────────┘
```

## Services

### 1. Database (PostgreSQL)
- **Container:** `delivery_db`
- **Port:** 5432
- **Data:** Persistent volume `postgres_data`
- **Health Check:** `pg_isready`

### 2. Cache & Message Broker (Redis)
- **Container:** `delivery_redis`
- **Port:** 6379
- **Data:** Persistent volume `redis_data`
- **Health Check:** `redis-cli ping`

### 3. Backend (Django)
- **Container:** `delivery_backend`
- **Port:** 8000
- **Framework:** Django + Gunicorn
- **Health Check:** `/api/health/`

### 4. Background Tasks (Celery)
- **Container:** `delivery_celery`
- **Purpose:** Async task processing
- **Depends on:** Redis, Database

### 5. Frontend (Next.js)
- **Container:** `delivery_frontend`
- **Port:** 3000
- **Framework:** Next.js (standalone)
- **Health Check:** `/api/health`

### 6. Reverse Proxy (Nginx)
- **Container:** `delivery_nginx`
- **Ports:** 80, 443
- **Purpose:** Load balancing, SSL termination
- **Health Check:** `/health`

## Deployment Commands

### Initial Deployment
```bash
./scripts/deploy.sh
```

### Update Deployment
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

## Database Management

### Run Migrations
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Create Superuser
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### Database Backup
```bash
./scripts/backup.sh
```

### Database Restore
```bash
docker-compose -f docker-compose.prod.yml exec -T db psql -U delivery_user -d delivery_platform < backups/db_backup_YYYYMMDD_HHMMSS.sql
```

## SSL/HTTPS Configuration

1. **Obtain SSL certificates:**
   ```bash
   # Using Let's Encrypt (recommended)
   certbot certonly --webroot -w /var/www/html -d yourdomain.com
   ```

2. **Copy certificates:**
   ```bash
   mkdir -p ssl
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
   ```

3. **Update Nginx configuration:**
   Edit `nginx.conf` to enable HTTPS and redirect HTTP traffic.

## Monitoring and Health Checks

### Health Check Endpoints

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Backend | `/api/health/` | Comprehensive health check |
| Backend | `/api/ready/` | Readiness probe |
| Backend | `/api/live/` | Liveness probe |
| Frontend | `/api/health` | Frontend health check |
| Nginx | `/health` | Load balancer health |

### Service Status
```bash
# Check all containers
docker-compose -f docker-compose.prod.yml ps

# Check specific service health
curl http://localhost/api/health/
```

## Performance Optimization

### Database Optimization
- Connection pooling enabled
- Query optimization with indexes
- Regular VACUUM and ANALYZE

### Caching Strategy
- Redis for session storage
- Application-level caching
- Static file caching via Nginx

### Resource Limits
- Gunicorn workers: CPU cores × 2 + 1
- PostgreSQL connections: 20 max
- Redis memory: 256MB default

## Security Considerations

### Network Security
- All services in isolated Docker network
- No direct external access to database/Redis
- Rate limiting on API endpoints

### Application Security
- HTTPS enforcement in production
- CSRF protection enabled
- XSS protection headers
- SQL injection prevention via ORM

### Data Security
- Database password encryption
- JWT token expiration
- File upload validation
- Input sanitization

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose -f docker-compose.prod.yml logs db
   
   # Verify connection
   docker-compose -f docker-compose.prod.yml exec db pg_isready -U delivery_user
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker-compose -f docker-compose.prod.yml logs redis
   
   # Test connection
   docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
   ```

3. **Frontend Build Failed**
   ```bash
   # Rebuild frontend
   docker-compose -f docker-compose.prod.yml build --no-cache frontend
   ```

4. **Static Files Not Loading**
   ```bash
   # Collect static files
   docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
   ```

### Log Analysis
```bash
# Backend application logs
docker-compose -f docker-compose.prod.yml logs backend | grep ERROR

# Nginx access logs
docker-compose -f docker-compose.prod.yml logs nginx | grep "GET\|POST"

# Database logs
docker-compose -f docker-compose.prod.yml logs db | grep ERROR
```

## Backup and Recovery

### Automated Backups
The `backup.sh` script creates:
- Database dumps (SQL format)
- Media file archives (tar.gz)
- Automatic cleanup (7-day retention)

### Recovery Process
1. Stop services
2. Restore database from backup
3. Restore media files
4. Restart services
5. Verify functionality

## Scaling Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Separate Celery workers for different task types
- Database read replicas for read-heavy workloads

### Vertical Scaling
- Increase container resource limits
- Optimize database configuration
- Add more Gunicorn workers

## Support and Maintenance

### Regular Maintenance Tasks
- Weekly database backups
- Monthly security updates
- Quarterly performance reviews
- Log rotation and cleanup

### Monitoring Recommendations
- Set up alerts for service failures
- Monitor resource usage trends
- Track application performance metrics
- Regular security audits

For additional support, refer to the application logs and health check endpoints.