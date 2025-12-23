# MySQL Setup Guide for Delivery Platform

This guide will help you migrate from SQLite/PostgreSQL to MySQL for the delivery platform backend.

## Prerequisites

1. **MySQL Server**: Make sure MySQL server is installed and running on your system
2. **Python MySQL Client**: Install the MySQL client library

## Step 1: Install MySQL Client

```bash
# Install MySQL client library
pip install mysqlclient

# If you encounter issues on macOS, you might need:
brew install mysql
export PATH="/usr/local/mysql/bin:$PATH"
pip install mysqlclient

# If you encounter issues on Ubuntu/Debian:
sudo apt-get install python3-dev default-libmysqlclient-dev build-essential
pip install mysqlclient
```

## Step 2: Database Configuration

The database configuration has been updated in your `.env` file:

```env
# MySQL Database Configuration
DB_NAME=delivery_pltform
DB_USER=root
DB_PASSWORD=Haha123@&$
DB_HOST=localhost
DB_PORT=3306
```

## Step 3: Create MySQL Database

### Option A: Using the Setup Script (Recommended)

```bash
cd Mohamedo/backend
python setup_mysql.py
```

### Option B: Manual Setup

1. Connect to MySQL as root:
```bash
mysql -u root -p
```

2. Create the database:
```sql
CREATE DATABASE delivery_pltform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. (Optional) Create a dedicated user:
```sql
CREATE USER 'delivery_user'@'localhost' IDENTIFIED BY 'Haha123@&$';
GRANT ALL PRIVILEGES ON delivery_pltform.* TO 'delivery_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 4: Run Django Migrations

```bash
cd Mohamedo/backend

# Make migrations (if needed)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

## Step 5: Test the Setup

```bash
# Run the development server
python manage.py runserver

# In another terminal, test the database connection
python manage.py shell
```

In the Django shell:
```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT DATABASE();")
print(cursor.fetchone())  # Should show: ('delivery_pltform',)
```

## Configuration Details

### Database Settings

The MySQL configuration in `settings.py` includes:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME', default='delivery_pltform'),
        'USER': config('DB_USER', default='root'),
        'PASSWORD': config('DB_PASSWORD', default='Haha123@&$'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}
```

### Key Features

- **UTF8MB4 Charset**: Supports full Unicode including emojis
- **Strict Mode**: Ensures data integrity
- **Connection Pooling**: Optimized for production use

## Troubleshooting

### Common Issues

1. **MySQL Client Installation Issues**:
   ```bash
   # On macOS with Homebrew
   brew install mysql-client
   export PATH="/usr/local/opt/mysql-client/bin:$PATH"
   
   # On Ubuntu/Debian
   sudo apt-get install default-libmysqlclient-dev
   ```

2. **Connection Refused**:
   - Check if MySQL server is running: `sudo systemctl status mysql`
   - Verify MySQL is listening on port 3306: `netstat -tlnp | grep 3306`

3. **Authentication Issues**:
   - Verify credentials in `.env` file
   - Check MySQL user permissions
   - Try connecting manually: `mysql -u root -p`

4. **Character Set Issues**:
   - Ensure database uses utf8mb4 charset
   - Check MySQL configuration for character set settings

### Performance Optimization

For production environments, consider these MySQL optimizations:

```sql
-- Increase connection limits
SET GLOBAL max_connections = 200;

-- Optimize buffer sizes
SET GLOBAL innodb_buffer_pool_size = 1G;

-- Enable query cache (if using MySQL < 8.0)
SET GLOBAL query_cache_size = 64M;
```

## Migration from Existing Data

If you have existing data in SQLite/PostgreSQL:

1. **Export existing data**:
   ```bash
   python manage.py dumpdata > backup.json
   ```

2. **Set up MySQL** (follow steps above)

3. **Import data**:
   ```bash
   python manage.py loaddata backup.json
   ```

## Security Considerations

1. **Change default passwords** in production
2. **Use dedicated database user** instead of root
3. **Enable SSL connections** for production
4. **Regular backups**:
   ```bash
   mysqldump -u root -p delivery_pltform > backup_$(date +%Y%m%d).sql
   ```

## Next Steps

After successful setup:

1. Update your deployment scripts to use MySQL
2. Configure backup procedures
3. Set up monitoring for database performance
4. Consider setting up read replicas for scaling

## Support

If you encounter issues:

1. Check Django logs for database errors
2. Verify MySQL error logs: `/var/log/mysql/error.log`
3. Test database connectivity independently of Django
4. Ensure all required Python packages are installed