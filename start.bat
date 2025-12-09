@echo off
echo Starting CollabTrack Application...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker first.
    exit /b 1
)

echo Docker is running
echo.

REM Build and start all services
echo Building and starting services...
docker compose up --build -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Run migrations
echo.
echo Running database migrations...
docker compose exec -T backend python manage.py migrate

echo.
echo All services are running!
echo.
echo Access points:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000/api
echo    Admin:    http://localhost:8000/admin
echo.
echo View logs:
echo    docker compose logs -f
echo.
echo Stop services:
echo    docker compose down
echo.
pause
