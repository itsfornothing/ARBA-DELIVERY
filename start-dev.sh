#!/bin/bash

# Development startup script for Arba Delivery Platform

echo "🚀 Starting Arba Delivery Platform Development Environment"
echo "============================================================"

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the Arba Delivery project root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command_exists python; then
    echo "❌ Python is not installed"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ All dependencies found"

# Start backend
echo ""
echo "🐍 Starting Django backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update requirements
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py migrate > /dev/null 2>&1

# Start Django server in background
echo "🚀 Starting Django server on http://localhost:8000"
python manage.py runserver > /dev/null 2>&1 &
DJANGO_PID=$!

# Go back to root and start frontend
cd ..
echo ""
echo "⚛️  Starting Next.js frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install --legacy-peer-deps > /dev/null 2>&1
fi

# Start Next.js server in background
echo "🚀 Starting Next.js server on http://localhost:3000"
npm run dev > /dev/null 2>&1 &
NEXTJS_PID=$!

# Wait a moment for servers to start
sleep 3

echo ""
echo "🎉 Development environment is ready!"
echo "============================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "👨‍💼 Admin Panel: http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $DJANGO_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait