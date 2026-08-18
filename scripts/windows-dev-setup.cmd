@echo off
setlocal
cd /d "%~dp0\.."

echo === Portal Empleado: setup LAN Windows ===
echo.

echo [1/5] npm install
call npm install
if errorlevel 1 goto :fail

echo [2/5] escribiendo .env para la IP LAN ^(no hace falta editarlo a mano^)
call node scripts\apply-lan-env.mjs %*
if errorlevel 1 goto :fail

echo [3/5] prisma generate
call npx prisma generate
if errorlevel 1 goto :fail

echo [4/6] reset BD + migraciones + seed
call npx prisma migrate reset --force
if errorlevel 1 goto :fail

echo [5/6] fijar contraseña Cambiar123! en todas las cuentas
call node scripts\reset-dev-passwords.mjs
if errorlevel 1 goto :fail

echo [6/6] arrancando servidor en 0.0.0.0:3000
echo.
call npm run dev
goto :eof

:fail
echo.
echo ERROR en el setup. Revisa el mensaje de arriba.
exit /b 1
