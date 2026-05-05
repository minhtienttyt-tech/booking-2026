@echo off
title Netlify Auto Deployer
echo ==================================================
echo   DANG CAP NHAT WEB LEN NETLIFY
echo ==================================================
echo.

echo Dang thuc hien Build va Deploy...
call netlify deploy --prod --build

if %errorlevel% neq 0 (
    echo.
    echo [LOI] Khong the cap nhat. 
    echo Hay dam bao ban da chay 'netlify login' va co ket noi mang.
    pause
    exit /b %errorlevel%
)

echo.
echo ==================================================
echo   [THANH CONG] TRANG WEB CUA BAN DA DUOC CAP NHAT!
echo ==================================================
echo.
pause
