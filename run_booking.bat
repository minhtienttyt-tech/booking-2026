@echo off
title Booking Webapp 2026 - Memory System
echo Dang khoi dong he thong Booking 2026...
echo.
echo 1. Kiem tra Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Vui long cai dat Node.js de chay ung dung nay!
    pause
    exit
)

echo 2. Dang mo trinh duyet...
start http://localhost:3001

echo 3. He thong dang chay tai http://localhost:3001
echo Nhan Ctrl+C de dung he thong.
echo.
node server.js
pause

