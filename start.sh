#!/bin/bash

echo "🚀 Starting CollabTrack Application..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Build and start all services
echo "📦 Building and starting services..."
docker compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo ""
echo "🔧 Running database migrations..."
docker compose exec -T backend python manage.py migrate

echo ""
echo "✅ All services are running!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000/api"
echo "   Admin:    http://localhost:8000/admin"
echo ""
echo "📊 View logs:"
echo "   docker compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker compose down"
echo ""
