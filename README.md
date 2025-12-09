# CollabTrack - Full Stack Web Application

A collaborative project management platform with real-time messaging, task tracking, team collaboration, and push notifications.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Running the Application

**Option 1: Using startup scripts (Recommended)**

Windows:
```bash
start.bat
```

Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

**Option 2: Manual Docker Compose**
```bash
docker compose up --build
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Admin Panel: http://localhost:8000/admin

### 📚 Documentation
- **[Quick Start Guide](QUICKSTART.md)** - Essential commands
- **[Full Docker Guide](DOCKER.md)** - Complete documentation
- See `.env.example` files for configuration

### Services Overview

The Docker setup includes:
- **Frontend** (React + Vite) - Port 5173
- **Backend** (Django) - Port 8000
- **Celery Worker** - Background task processing
- **Redis** - Message broker for Celery

### Environment Variables

#### Backend (.env in backend directory)
```bash
# Django
DEBUG=1
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Firebase (for push notifications)
FIREBASE_SERVICE_ACCOUNT_JSON_PATH=/app/backend/firebase_adminsdk.json

# SendGrid (for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
DEFAULT_FROM_EMAIL=noreply@example.com

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

#### Frontend (.env.local in frontend directory)
```bash
VITE_API_BASE_URL=http://localhost:8000/api

# Firebase Web Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### Docker Commands

```bash
# Start all services in detached mode
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery

# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Rebuild and start
docker compose up --build

# Run Django migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Access Django shell
docker compose exec backend python manage.py shell

# Access backend container shell
docker compose exec backend sh

# Access frontend container shell
docker compose exec frontend sh
```

### Development Workflow

The Docker setup includes volume mounts for hot-reloading:
- Changes to frontend code auto-reload (Vite HMR)
- Changes to backend code auto-reload (Django dev server)
- Database persists in volume

### Troubleshooting

**Port already in use:**
```bash
# Change ports in docker-compose.yml
ports:
  - "8001:8000"  # Change 8000 to 8001 for backend
  - "5174:5173"  # Change 5173 to 5174 for frontend
```

**Database issues:**
```bash
# Reset database
docker compose down -v
docker compose up --build
docker compose exec backend python manage.py migrate
```

**Celery not processing tasks:**
```bash
# Check Celery logs
docker compose logs -f celery

# Restart Celery
docker compose restart celery
```

**Frontend build errors:**
```bash
# Clear node_modules and reinstall
docker compose down
docker compose build --no-cache frontend
docker compose up
```

## 📁 Project Structure

```
FullStack-CollabTrack-WebApp/
├── backend/               # Django backend
│   ├── api/              # Main API app
│   ├── backend/          # Django project settings
│   ├── Dockerfile        # Backend Docker config
│   └── requirements.txt  # Python dependencies
├── frontend/             # React frontend
│   ├── src/             # Source code
│   ├── public/          # Static assets
│   ├── Dockerfile       # Frontend Docker config
│   └── package.json     # Node dependencies
└── docker-compose.yml   # Docker orchestration
```

## 🔧 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- Lucide Icons

**Backend:**
- Django 5.2
- Django REST Framework
- Celery (task queue)
- Redis (broker)
- Firebase Admin (push notifications)
- SendGrid (email)
- Twilio (SMS)

## 📝 Features

- ✅ Team collaboration
- ✅ Project management
- ✅ Kanban boards
- ✅ Task tracking
- ✅ Real-time messaging
- ✅ Push notifications
- ✅ Email notifications
- ✅ User profiles
- ✅ Dark mode
- ✅ Search functionality
