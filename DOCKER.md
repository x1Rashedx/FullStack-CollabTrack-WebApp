# Docker Setup Guide for CollabTrack

## 🐳 Complete Docker Configuration

This guide explains how to run the entire CollabTrack application stack using Docker.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                       │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Frontend   │───▶│   Backend    │                  │
│  │  (React)     │    │  (Django)    │                  │
│  │  Port 5173   │    │  Port 8000   │                  │
│  └──────────────┘    └──────┬───────┘                  │
│                             │                           │
│                             ▼                           │
│                      ┌──────────────┐                   │
│                      │    Redis     │                   │
│                      │  Port 6379   │                   │
│                      └──────┬───────┘                   │
│                             │                           │
│                             ▼                           │
│                      ┌──────────────┐                   │
│                      │    Celery    │                   │
│                      │   Worker     │                   │
│                      └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Using startup scripts (Recommended)

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual Docker Compose

```bash
# Build and start all services
docker compose up --build

# Or in detached mode
docker compose up --build -d
```

## Services

### 1. Frontend (React + Vite)
- **Port:** 5173
- **Technology:** React 18, TypeScript, Vite
- **Hot Reload:** ✅ Enabled
- **URL:** http://localhost:5173

### 2. Backend (Django)
- **Port:** 8000
- **Technology:** Django 5.2, DRF
- **API Base:** http://localhost:8000/api
- **Admin Panel:** http://localhost:8000/admin
- **Auto Migrations:** ✅ On startup

### 3. Redis
- **Port:** 6379
- **Purpose:** Celery message broker
- **Persistence:** Volume mounted

### 4. Celery Worker
- **Purpose:** Background task processing
- **Tasks:** Email, SMS, Push notifications
- **Concurrency:** 1 (can be adjusted)

## Configuration

### Environment Variables

Create these files before running:

**backend/.env:**
```bash
DEBUG=1
SECRET_KEY=your-django-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Firebase (Optional)
FIREBASE_SERVICE_ACCOUNT_JSON_PATH=/app/backend/firebase_adminsdk.json

# SendGrid (Optional)
SENDGRID_API_KEY=your_key
DEFAULT_FROM_EMAIL=noreply@example.com

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1234567890
```

**frontend/.env.local:**
```bash
VITE_API_BASE_URL=http://localhost:8000/api

# Firebase Web Config (Optional)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## Docker Commands Reference

### Basic Operations

```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v

# Rebuild images
docker compose build

# Rebuild and start
docker compose up --build
```

### Logs and Monitoring

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery
docker compose logs -f redis

# View last 100 lines
docker compose logs --tail=100 backend
```

### Database Operations

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create migrations
docker compose exec backend python manage.py makemigrations

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Django shell
docker compose exec backend python manage.py shell

# Flush database (⚠️ deletes all data)
docker compose exec backend python manage.py flush
```

### Container Access

```bash
# Access backend shell
docker compose exec backend sh
docker compose exec backend bash  # if bash is installed

# Access frontend shell
docker compose exec frontend sh

# Access Redis CLI
docker compose exec redis redis-cli

# List running containers
docker compose ps

# View container stats
docker stats
```

### Troubleshooting Commands

```bash
# Restart specific service
docker compose restart backend
docker compose restart celery

# Rebuild specific service
docker compose build backend
docker compose up -d backend

# Remove all stopped containers
docker compose rm

# Prune Docker system
docker system prune -a
```

## Development Workflow

### Making Code Changes

**Frontend:**
1. Edit files in `frontend/src/`
2. Vite will auto-reload (Hot Module Replacement)
3. Changes appear instantly in browser

**Backend:**
1. Edit files in `backend/`
2. Django dev server auto-reloads
3. API changes available immediately

**Database Schema:**
```bash
# After modifying models.py
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

### Installing Dependencies

**Frontend:**
```bash
# Add package
docker compose exec frontend npm install package-name

# Or rebuild
# 1. Add to package.json
# 2. docker compose build frontend
# 3. docker compose up -d frontend
```

**Backend:**
```bash
# Add package
docker compose exec backend pip install package-name

# Or rebuild
# 1. Add to requirements.txt
# 2. docker compose build backend
# 3. docker compose up -d backend
```

## Common Issues

### Port Already in Use

**Error:** `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Solution:**
```yaml
# Edit docker-compose.yml
services:
  backend:
    ports:
      - "8001:8000"  # Change external port
```

### Permission Denied on Linux/Mac

**Error:** `permission denied while trying to connect to Docker daemon`

**Solution:**
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

### Container Keeps Restarting

**Check logs:**
```bash
docker compose logs backend
```

**Common causes:**
- Missing environment variables
- Database migration errors
- Port conflicts

### Database Migration Errors

**Reset database:**
```bash
docker compose down -v
docker compose up --build
docker compose exec backend python manage.py migrate
```

### Celery Not Processing Tasks

**Check status:**
```bash
docker compose logs -f celery
```

**Restart worker:**
```bash
docker compose restart celery
```

### Frontend Build Errors

**Clear cache:**
```bash
docker compose down
docker compose build --no-cache frontend
docker compose up
```

## Performance Optimization

### Increase Celery Workers

```yaml
# docker-compose.yml
celery:
  command: celery -A backend.celery:app worker -l info --concurrency=4
```

### Use PostgreSQL Instead of SQLite

```yaml
# Uncomment in docker-compose.yml
db:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: collabtrack
    POSTGRES_USER: collabtrack
    POSTGRES_PASSWORD: your_password
```

```python
# backend/backend/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'collabtrack',
        'USER': 'collabtrack',
        'PASSWORD': 'your_password',
        'HOST': 'db',
        'PORT': '5432',
    }
}
```

### Production Deployment

For production, modify:

1. **Security:**
   - Set `DEBUG=0`
   - Use strong `SECRET_KEY`
   - Configure proper `ALLOWED_HOSTS`

2. **Database:**
   - Use PostgreSQL or MySQL
   - Enable backups

3. **Static Files:**
   - Configure static file serving
   - Use CDN for assets

4. **HTTPS:**
   - Add reverse proxy (nginx)
   - Configure SSL certificates

5. **Scaling:**
   - Increase Celery workers
   - Use load balancer
   - Enable caching (Redis)

## Useful Docker Commands

```bash
# View Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes

# Export container as image
docker commit container_name new_image_name

# Save image to file
docker save -o image.tar image_name

# Load image from file
docker load -i image.tar

# Inspect container
docker inspect container_name

# View container processes
docker top container_name
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Django in Docker](https://docs.docker.com/samples/django/)
- [React in Docker](https://docs.docker.com/samples/react/)

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Verify configuration files
3. Review this documentation
4. Open an issue on GitHub
