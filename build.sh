#!/usr/bin/env bash
# exit on error
set -o errexit

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput --settings=delivery_platform.settings_render

# Run migrations
python manage.py migrate --settings=delivery_platform.settings_render

# Create superuser if it doesn't exist
python manage.py shell --settings=delivery_platform.settings_render << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@arba-delivery.com').exists():
    User.objects.create_superuser(
        email='admin@arba-delivery.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    print('Superuser created successfully')
else:
    print('Superuser already exists')
EOF