@echo off
setlocal
cd /d "%~dp0\.."

echo === Portal Empleado: setup LAN Windows ===
echo.

echo [1/7] npm install
call npm install
if errorlevel 1 goto :fail

echo [2/7] escribiendo .env para LAN
call node scripts\apply-lan-env.mjs %*
if errorlevel 1 goto :fail

echo [3/7] DATABASE_URL -^> localhost:5433 ^(portal^)
call node scripts\fix-db-url.mjs
if errorlevel 1 (
  echo.
  echo Intentando docker compose up -d db ...
  call docker compose up -d db
  if errorlevel 1 (
    echo.
    echo Docker no esta disponible. ABRE Docker Desktop, espera a que este listo,
    echo y vuelve a ejecutar:  scripts\windows-dev-setup.cmd
    goto :fail
  )
  echo Esperando a Postgres...
  timeout /t 8 /nobreak >nul
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

echo [7/7] arrancando servidor en 0.0.0.0:3000
echo.
echo Abre en el navegador: http://192.168.12.45:3000
echo ^(NO uses localhost^)
echo.
call npm run dev
goto :eof

:fail
echo.
echo ERROR. Pasos minimos:
echo   1. Abre Docker Desktop ^(icono de ballena en la bandeja^)
echo   2. docker compose up -d db
echo   3. node scripts\fix-db-url.mjs
echo   4. npx prisma migrate deploy ^&^& npm run db:seed
echo   5. npm run dev
exit /b 1
