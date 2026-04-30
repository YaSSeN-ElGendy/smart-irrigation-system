@echo off
echo ========================================================
echo Starting Smart Irrigation System (Backend and Frontend)
echo ========================================================

echo.
echo [1/3] Installing and starting Backend...
start "Backend Server" cmd /k "cd backend && npm install && npx prisma db push && npm run dev"

echo.
echo [2/3] Installing and starting Frontend...
start "Frontend Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo [3/3] Opening your browser...
echo Waiting a few seconds for servers to start...
timeout /t 5 /nobreak
start http://localhost:5173

echo.
echo All processes have been launched in separate windows! 
echo Remember your password is: irrigation2024
pause
