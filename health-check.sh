#!/bin/bash

echo "🏥 CollabTrack Health Check"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi
echo "✅ Docker is running"

# Check if containers are running
echo ""
echo "Container Status:"
echo "-----------------"

services=("collabtrack_frontend" "collabtrack_backend" "collabtrack_celery" "collabtrack_redis")
all_running=true

for service in "${services[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
        status=$(docker inspect --format='{{.State.Status}}' $service 2>/dev/null)
        if [ "$status" = "running" ]; then
            echo "✅ $service: running"
        else
            echo "⚠️  $service: $status"
            all_running=false
        fi
    else
        echo "❌ $service: not found"
        all_running=false
    fi
done

# Check service health
echo ""
echo "Service Health:"
echo "---------------"

# Check Frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend (http://localhost:5173): reachable"
else
    echo "❌ Frontend (http://localhost:5173): unreachable"
    all_running=false
fi

# Check Backend
if curl -s http://localhost:8000/api/ > /dev/null 2>&1; then
    echo "✅ Backend (http://localhost:8000/api): reachable"
else
    echo "❌ Backend (http://localhost:8000/api): unreachable"
    all_running=false
fi

# Check Redis
if docker exec collabtrack_redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: responding"
else
    echo "❌ Redis: not responding"
    all_running=false
fi

echo ""
if [ "$all_running" = true ]; then
    echo "✅ All services are healthy!"
    exit 0
else
    echo "⚠️  Some services have issues. Check logs with: docker compose logs -f"
    exit 1
fi
