@echo off
setlocal
cd /d "%~dp0\.."

echo === Portal Empleado: setup local Windows ===
echo.

if not exist ".env" (
  echo [!] No hay .env — copiando desde .env.example
  copy /Y ".env.example" ".env" >nul
  echo     Edita .env: AUTH_URL debe ser la URL del navegador ^(localhost o IP LAN^).
  echo.
)

echo [1/4] npm install
call npm install
if errorlevel 1 goto :fail

echo [2/4] prisma generate
call npx prisma generate
if errorlevel 1 goto :fail

echo [3/4] reset BD + migraciones + seed ^(borra datos locales^)
call npx prisma migrate reset --force
if errorlevel 1 goto :fail

echo [4/4] arrancando next en 0.0.0.0:3000
echo.
echo Abre en el navegador la MISMA URL que AUTH_URL en .env
echo   http://192.168.12.45:3000   o   http://localhost:3000
echo.
call npm run dev
goto :eof

:fail
echo.
echo ERROR en el setup. Revisa el mensaje de arriba.
exit /b 1
