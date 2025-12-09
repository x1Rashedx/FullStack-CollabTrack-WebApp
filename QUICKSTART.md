# CollabTrack Docker - Quick Reference

## 🚀 Start Application
```bash
# Windows
start.bat

# Linux/Mac
./start.sh

# Or manually
docker compose up --build
```

## 🔍 View Logs
```bash
docker compose logs -f              # All services
docker compose logs -f backend      # Backend only
docker compose logs -f frontend     # Frontend only
docker compose logs -f celery       # Celery worker
```

## 🛑 Stop Application
```bash
docker compose down                 # Stop services
docker compose down -v              # Stop and delete volumes
```

## 🔄 Restart Services
```bash
docker compose restart              # All services
docker compose restart backend      # Backend only
docker compose restart celery       # Celery only
```

## 📊 Service Status
```bash
docker compose ps                   # List running services
docker stats                        # Resource usage
```

## 💾 Database
```bash
# Migrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py makemigrations

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Django shell
docker compose exec backend python manage.py shell
```

## 🐚 Access Container
```bash
docker compose exec backend sh      # Backend shell
docker compose exec frontend sh     # Frontend shell
docker compose exec redis redis-cli # Redis CLI
```

## 📦 Install Packages
```bash
# Frontend
docker compose exec frontend npm install package-name

# Backend
docker compose exec backend pip install package-name
```

## 🔧 Rebuild
```bash
docker compose build                # All services
docker compose build backend        # Backend only
docker compose build frontend       # Frontend only
docker compose up --build           # Rebuild and start
```

## 🌐 Access Points
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api
- **Admin Panel:** http://localhost:8000/admin
- **Redis:** localhost:6379

## ⚠️ Troubleshooting
```bash
# Port in use - change ports in docker-compose.yml
ports:
  - "8001:8000"  # Backend
  - "5174:5173"  # Frontend

# Reset everything
docker compose down -v
docker compose up --build

# Clear Docker cache
docker system prune -a
```

## 📝 Environment Files
- Backend: `backend/.env`
- Frontend: `frontend/.env.local`
- Examples: `.env.example` files in each directory

## 🔐 Security
For production:
- Set `DEBUG=0` in backend/.env
- Change `SECRET_KEY`
- Configure proper `ALLOWED_HOSTS`
- Use PostgreSQL instead of SQLite
- Enable HTTPS with reverse proxy
