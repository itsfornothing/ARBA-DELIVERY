#!/usr/bin/env python3
"""
MySQL Connection Test Script

This script tests the MySQL database connection using Django settings.
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delivery_platform.settings')
django.setup()

from django.db import connection
from django.core.management.color import make_style

style = make_style()

def test_database_connection():
    """Test the database connection and display information."""
    
    print(style.HTTP_INFO("🔍 Testing MySQL Database Connection..."))
    print("=" * 50)
    
    try:
        # Test basic connection
        with connection.cursor() as cursor:
            # Get database information
            cursor.execute("SELECT DATABASE();")
            current_db = cursor.fetchone()[0]
            
            cursor.execute("SELECT VERSION();")
            mysql_version = cursor.fetchone()[0]
            
            cursor.execute("SELECT USER();")
            current_user = cursor.fetchone()[0]
            
            cursor.execute("SHOW VARIABLES LIKE 'character_set_database';")
            charset_result = cursor.fetchone()
            charset = charset_result[1] if charset_result else 'Unknown'
            
            cursor.execute("SHOW VARIABLES LIKE 'collation_database';")
            collation_result = cursor.fetchone()
            collation = collation_result[1] if collation_result else 'Unknown'
            
            # Display connection information
            print(style.SUCCESS("✅ Database connection successful!"))
            print(f"📊 Database: {current_db}")
            print(f"🔧 MySQL Version: {mysql_version}")
            print(f"👤 Connected as: {current_user}")
            print(f"🔤 Character Set: {charset}")
            print(f"🔀 Collation: {collation}")
            
            # Test table creation (if no tables exist)
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            
            if tables:
                print(f"📋 Found {len(tables)} tables:")
                for table in tables[:5]:  # Show first 5 tables
                    print(f"   - {table[0]}")
                if len(tables) > 5:
                    print(f"   ... and {len(tables) - 5} more")
            else:
                print("📋 No tables found (run migrations to create them)")
            
            return True
            
    except Exception as e:
        print(style.ERROR(f"❌ Database connection failed: {e}"))
        print("\n🔧 Troubleshooting tips:")
        print("1. Make sure MySQL server is running")
        print("2. Check database credentials in .env file")
        print("3. Verify database exists: CREATE DATABASE delivery_pltform;")
        print("4. Install MySQL client: pip install mysqlclient")
        return False

def test_django_models():
    """Test Django model operations."""
    
    print(style.HTTP_INFO("\n🧪 Testing Django Models..."))
    print("=" * 50)
    
    try:
        from django.contrib.auth.models import User
        
        # Test model query
        user_count = User.objects.count()
        print(style.SUCCESS(f"✅ User model accessible - {user_count} users found"))
        
        # Test if migrations are needed
        from django.core.management import execute_from_command_line
        from io import StringIO
        import sys
        
        # Capture output
        old_stdout = sys.stdout
        sys.stdout = captured_output = StringIO()
        
        try:
            execute_from_command_line(['manage.py', 'showmigrations', '--plan'])
            migration_output = captured_output.getvalue()
        finally:
            sys.stdout = old_stdout
        
        if '[X]' in migration_output:
            print(style.SUCCESS("✅ Migrations are up to date"))
        else:
            print(style.WARNING("⚠️  Some migrations may be pending"))
            print("   Run: python manage.py migrate")
        
        return True
        
    except Exception as e:
        print(style.ERROR(f"❌ Django model test failed: {e}"))
        print("   This is normal if migrations haven't been run yet")
        return False

def main():
    """Main test function."""
    
    print(style.HTTP_INFO("🚀 MySQL Database Connection Test"))
    print(style.HTTP_INFO("Delivery Platform Backend"))
    print("=" * 50)
    
    # Test database connection
    db_success = test_database_connection()
    
    if db_success:
        # Test Django models
        model_success = test_django_models()
        
        print(style.HTTP_INFO("\n📋 Summary:"))
        print("=" * 50)
        
        if db_success and model_success:
            print(style.SUCCESS("🎉 All tests passed! Your MySQL setup is working correctly."))
            print("\n📝 Next steps:")
            print("1. Run migrations: python manage.py migrate")
            print("2. Create superuser: python manage.py createsuperuser")
            print("3. Start development server: python manage.py runserver")
        else:
            print(style.WARNING("⚠️  Some tests failed, but basic connection works."))
            print("   Run migrations to complete the setup.")
    else:
        print(style.ERROR("❌ Database connection failed. Please check your configuration."))

if __name__ == "__main__":
    main()