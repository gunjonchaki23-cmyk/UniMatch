@echo off
echo Starting UniMatch...

:: Start the backend in a new command prompt window
start "UniMatch Backend" cmd /c "cd backend && node server.js"

:: Start the frontend in a new command prompt window
start "UniMatch Frontend" cmd /c "cd frontend && npm run dev"

echo Both servers are starting up!
echo ------------------------------------------
echo 1. Your Backend will run on http://localhost:5000
echo 2. Your Frontend will open at http://localhost:5173
echo ------------------------------------------
echo NOTE: Make sure MongoDB is running locally, otherwise the backend will crash!
pause
