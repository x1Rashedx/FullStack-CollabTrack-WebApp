@echo off
echo CollabTrack Health Check
echo ==========================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running
    exit /b 1
)
echo Docker is running
echo.

echo Container Status:
echo -----------------

REM Check containers
for %%s in (collabtrack_frontend collabtrack_backend collabtrack_celery collabtrack_redis) do (
    docker ps --format "{{.Names}}" | findstr /C:"%%s" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ %%s: running
    ) else (
        echo ✗ %%s: not found
    )
)

echo.
echo Service Health:
echo ---------------

REM Check Frontend
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend (http://localhost:5173): reachable
) else (
    echo ✗ Frontend (http://localhost:5173): unreachable
)

REM Check Backend
curl -s http://localhost:8000/api/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend (http://localhost:8000/api): reachable
) else (
    echo ✗ Backend (http://localhost:8000/api): unreachable
)

REM Check Redis
docker exec collabtrack_redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Redis: responding
) else (
    echo ✗ Redis: not responding
)

echo.
echo Check logs with: docker compose logs -f
pause
