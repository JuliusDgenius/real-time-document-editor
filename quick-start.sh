#!/bin/bash

echo "🚀 Real-Time Collaborative Document Editor - Quick Start"
echo "======================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it and try again."
    exit 1
fi

echo "✅ Docker is running"
echo "✅ Docker Compose is available"
echo ""

echo "🔧 Building development images..."
docker-compose -f docker-compose.dev.yml build

if [ $? -eq 0 ]; then
    echo "✅ Images built successfully"
else
    echo "❌ Failed to build images"
    exit 1
fi

echo ""
echo "🚀 Starting development stack..."
docker-compose -f docker-compose.dev.yml up -d

if [ $? -eq 0 ]; then
    echo "✅ Development stack started successfully"
else
    echo "❌ Failed to start development stack"
    exit 1
fi

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔍 Checking service health..."
echo "Backend: http://localhost:3000/api/health"
echo "Frontend: http://localhost:3001"
echo "Database: localhost:5432"
echo ""

echo "📋 Available commands:"
echo "  make help          - Show all available commands"
echo "  make logs          - Show logs from all services"
echo "  make down          - Stop all services"
echo "  make clean-all     - Clean up everything (including data)"
echo ""

echo "🎯 Next steps:"
echo "1. Open http://localhost:3001 in your browser"
echo "2. Check the backend health at http://localhost:3000/api/health"
echo "3. Run 'make logs' to monitor the services"
echo "4. Use 'make help' to see all available commands"
echo ""

echo "✨ Happy coding!"
