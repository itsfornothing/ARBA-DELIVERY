# Arba Delivery - Render Deployment Guide

This guide will help you deploy the Arba Delivery platform to Render's free tier.

## Prerequisites

1. GitHub account
2. Render account (free tier available)
3. Your project pushed to GitHub

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Arba Delivery Platform"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/arba-delivery.git

# Push to GitHub
git push -u origin main
```

### 1.2 Verify Required Files

Make sure these files are in your repository:
- ✅ `render.yaml` (deployment configuration)
- ✅ `build.sh` (build script)
- ✅ `backend/requirements.txt` (Python dependencies)
- ✅ `backend/runtime.txt` (Python version)
- ✅ `frontend/package.json` (Node.js dependencies)
- ✅ `.gitignore` (ignore sensitive files)

## Step 2: Deploy to Render

### 2.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 2.2 Deploy Using Blueprint

1. In Render dashboard, click **"New +"**
2. Select **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository containing your Arba Delivery project
5. Render will automatically detect the `render.yaml` file
6. Click **"Apply"**

### 2.3 Monitor Deployment

Render will create the following services:
- **Database**: PostgreSQL database
- **Redis**: Redis cache
- **Backend**: Django API server
- **Frontend**: Next.js application
- **Worker**: Celery background tasks

## Step 3: Configure Environment Variables

### 3.1 Backend Environment Variables

The following environment variables will be automatically configured:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - Auto-generated Django secret key

You may need to manually set:
- `ALLOWED_HOSTS` - Your Render domain
- `CORS_ALLOWED_ORIGINS` - Frontend URL

### 3.2 Frontend Environment Variables

Set these in the frontend service:
- `NEXT_PUBLIC_API_URL` - Backend service URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (same as backend but with wss://)

## Step 4: Access Your Application

After successful deployment:

1. **Frontend URL**: `https://arba-delivery-frontend.onrender.com`
2. **Backend API**: `https://arba-delivery-backend.onrender.com`
3. **Admin Panel**: `https://arba-delivery-backend.onrender.com/admin/`

### Default Admin Credentials
- **Email**: `admin@arba-delivery.com`
- **Password**: `admin123`

**⚠️ Important**: Change the admin password immediately after first login!

## Step 5: Verify Deployment

### 5.1 Health Checks

Test these endpoints to verify services are running:

```bash
# Backend health check
curl https://arba-delivery-backend.onrender.com/api/health/

# Frontend health check
curl https://arba-delivery-frontend.onrender.com/api/health
```

### 5.2 Test API Endpoints

```bash
# Test user registration
curl -X POST https://arba-delivery-backend.onrender.com/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "customer"
  }'
```

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain

1. In Render dashboard, go to your frontend service
2. Click **"Settings"**
3. Scroll to **"Custom Domains"**
4. Add your domain (e.g., `yourdomain.com`)
5. Update DNS records as instructed

### 6.2 Update Environment Variables

Update these variables with your custom domain:
- `ALLOWED_HOSTS` - Add your custom domain
- `CORS_ALLOWED_ORIGINS` - Add your custom domain

## Troubleshooting

### Common Issues

1. **Build Failed**
   - Check build logs in Render dashboard
   - Verify all dependencies in requirements.txt
   - Ensure Python version matches runtime.txt

2. **Database Connection Error**
   - Verify DATABASE_URL is set correctly
   - Check if migrations ran successfully
   - Review backend service logs

3. **Frontend Can't Connect to Backend**
   - Verify NEXT_PUBLIC_API_URL is correct
   - Check CORS settings in backend
   - Ensure both services are deployed

4. **Static Files Not Loading**
   - Check if collectstatic ran during build
   - Verify STATIC_ROOT and STATIC_URL settings
   - Review whitenoise configuration

### Debugging Commands

```bash
# View service logs
# Go to Render dashboard > Your Service > Logs

# Check database connection
# In backend service shell:
python manage.py dbshell

# Run migrations manually
python manage.py migrate --settings=delivery_platform.settings_render

# Create superuser manually
python manage.py createsuperuser --settings=delivery_platform.settings_render
```

## Render Free Tier Limitations

- **Sleep Mode**: Services sleep after 15 minutes of inactivity
- **Build Minutes**: 500 minutes per month
- **Bandwidth**: 100GB per month
- **Database**: 1GB storage, 1 month retention

## Upgrading to Paid Plans

For production use, consider upgrading:
- **Starter Plan**: $7/month per service
- **Standard Plan**: $25/month per service
- **Pro Plan**: $85/month per service

## Security Recommendations

1. **Change Default Passwords**
   - Update admin password
   - Use strong, unique passwords

2. **Environment Variables**
   - Never commit sensitive data to Git
   - Use Render's environment variable management

3. **HTTPS**
   - Render provides free SSL certificates
   - Ensure SECURE_SSL_REDIRECT is enabled

4. **Database Backups**
   - Set up regular database backups
   - Consider upgrading to paid plan for better retention

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Community Forum**: [community.render.com](https://community.render.com)
- **Status Page**: [status.render.com](https://status.render.com)

## Next Steps

1. Set up monitoring and alerts
2. Configure automated backups
3. Set up CI/CD pipeline
4. Add custom domain
5. Optimize performance
6. Set up error tracking (Sentry)

Your Arba Delivery platform is now live on Render! 🚀