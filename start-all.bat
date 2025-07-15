@echo off

echo Starting Reddit Stories Video Generator...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"

echo Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting...
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:3001
echo.
echo Press any key to close this window...
pause > nul 