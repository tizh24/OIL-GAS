#!/bin/bash

echo "🚀 Starting Oil & Gas Microservices Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data/mongodb
mkdir -p data/redis

# Build and start services
echo "🔨 Building and starting microservices..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

services=("api-gateway:3000" "auth-service:3001" "user-service:3002" "equipment-service:3003")

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -sf "http://localhost:$port/health" > /dev/null; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
done

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📊 Service URLs:"
echo "   API Gateway:      http://localhost:3000"
echo "   Auth Service:     http://localhost:3001"
echo "   User Service:     http://localhost:3002"
echo "   Equipment Service: http://localhost:3003"
echo ""
echo "📚 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   View status:      docker-compose ps"
