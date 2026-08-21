@echo off
setlocal
cd /d "%~dp0\.."

echo === Portal Empleado: setup LAN Windows ===
echo.

echo [1/5] npm install
call npm install
if errorlevel 1 goto :fail

echo [2/7] escribiendo .env para LAN ^(sin tocar AUTH_URL^)
call node scripts\apply-lan-env.mjs %*
if errorlevel 1 goto :fail

echo [3/7] comprobar Postgres / puerto DATABASE_URL
call node scripts\fix-db-url.mjs
if errorlevel 1 (
  echo Intentando docker compose up -d db ...
  call docker compose up -d db
  timeout /t 5 /nobreak >nul
  call node scripts\fix-db-url.mjs
  if errorlevel 1 goto :fail
)

echo [4/7] prisma generate
call npx prisma generate
if errorlevel 1 goto :fail

echo [5/7] migraciones
call npx prisma migrate deploy
if errorlevel 1 goto :fail

echo [6/7] seed + passwords
call npm run db:seed
if errorlevel 1 goto :fail
call node scripts\reset-dev-passwords.mjs
if errorlevel 1 goto :fail

echo [7/7] arrancando servidor
echo.
call npm run dev
goto :eof

:fail
echo.
echo ERROR: Postgres no esta disponible. Arranca Docker Desktop y:
echo   docker compose up -d db
echo Luego vuelve a ejecutar este script.
exit /b 1
