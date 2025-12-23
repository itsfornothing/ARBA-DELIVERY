-- Database initialization script for Delivery Platform
-- This script sets up the initial database configuration

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE delivery_platform'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'delivery_platform');

-- Create user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'delivery_user') THEN

      CREATE ROLE delivery_user LOGIN PASSWORD 'delivery_secure_password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE delivery_platform TO delivery_user;

-- Connect to the delivery_platform database
\c delivery_platform;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';