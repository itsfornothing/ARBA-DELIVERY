#!/usr/bin/env python3
"""
MySQL Database Setup Script for Delivery Platform

This script helps set up the MySQL database for the delivery platform.
Run this before running Django migrations.
"""

import mysql.connector
from mysql.connector import Error
import os
from decouple import config

def create_database():
    """Create the MySQL database if it doesn't exist."""
    
    # Database configuration
    db_config = {
        'host': config('DB_HOST', default='localhost'),
        'port': config('DB_PORT', default='3306'),
        'user': config('DB_USER', default='root'),
        'password': config('DB_PASSWORD', default='Haha123@&$'),
    }
    
    database_name = config('DB_NAME', default='delivery_pltform')
    
    try:
        # Connect to MySQL server
        print(f"Connecting to MySQL server at {db_config['host']}:{db_config['port']}...")
        connection = mysql.connector.connect(**db_config)
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create database if it doesn't exist
            print(f"Creating database '{database_name}' if it doesn't exist...")
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            
            # Show databases to confirm creation
            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            
            print("Available databases:")
            for db in databases:
                print(f"  - {db[0]}")
            
            if any(database_name in db for db in databases):
                print(f"✅ Database '{database_name}' is ready!")
            else:
                print(f"❌ Failed to create database '{database_name}'")
                return False
                
            return True
            
    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection closed.")

def main():
    """Main function to set up the database."""
    print("🚀 Setting up MySQL database for Delivery Platform...")
    print("=" * 50)
    
    if create_database():
        print("\n✅ Database setup completed successfully!")
        print("\nNext steps:")
        print("1. Install MySQL client: pip install mysqlclient")
        print("2. Run migrations: python manage.py migrate")
        print("3. Create superuser: python manage.py createsuperuser")
    else:
        print("\n❌ Database setup failed!")
        print("\nTroubleshooting:")
        print("1. Make sure MySQL server is running")
        print("2. Check your database credentials in .env file")
        print("3. Ensure the MySQL user has CREATE DATABASE privileges")

if __name__ == "__main__":
    main()