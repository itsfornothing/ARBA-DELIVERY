#!/bin/bash

# Backup script for Delivery Platform
set -e

# Load environment variables
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
MEDIA_BACKUP_FILE="$BACKUP_DIR/media_backup_$TIMESTAMP.tar.gz"

echo "🔄 Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "📊 Backing up database..."
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U ${POSTGRES_USER:-delivery_user} ${POSTGRES_DB:-delivery_platform} > $DB_BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Database backup completed: $DB_BACKUP_FILE"
else
    echo "❌ Database backup failed!"
    exit 1
fi

# Media files backup
echo "📁 Backing up media files..."
docker run --rm -v delivery_platform_media_files:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/media_backup_$TIMESTAMP.tar.gz -C /data .

if [ $? -eq 0 ]; then
    echo "✅ Media backup completed: $MEDIA_BACKUP_FILE"
else
    echo "❌ Media backup failed!"
    exit 1
fi

# Cleanup old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup process completed successfully!"
echo "📋 Backup files:"
echo "   Database: $DB_BACKUP_FILE"
echo "   Media: $MEDIA_BACKUP_FILE"