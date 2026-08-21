@echo off
setlocal
cd /d "%~dp0\.."

echo === Reset completo de la BD del portal ^(Docker :5433^) ===
echo.

echo [1/6] Fijar .env a portal@localhost:5433
call node scripts\fix-db-url.mjs
rem fix-db-url sale 2 si el puerto no responde; seguimos para recrear el contenedor

echo.
echo [2/6] Borrar contenedor y VOLUMEN ^(contraseña vieja del volumen^)
call docker compose down -v
if errorlevel 1 (
  echo ERROR: Docker no responde. Abre Docker Desktop y reintenta.
  exit /b 1
)

echo.
echo [3/6] Crear Postgres limpio en :5433
call docker compose up -d db
if errorlevel 1 (
  echo ERROR: no se pudo levantar db
  exit /b 1
)

echo Esperando a que Postgres acepte conexiones...
timeout /t 10 /nobreak >nul

echo.
echo [4/6] Comprobar puerto 5433
call node scripts\fix-db-url.mjs
if errorlevel 1 (
  echo ERROR: :5433 sigue sin responder. Revisa: docker compose ps
  exit /b 1
)

echo.
echo [5/6] Migraciones + seed
call npx prisma generate
if errorlevel 1 exit /b 1
call npx prisma migrate deploy
if errorlevel 1 exit /b 1
call npm run db:seed
if errorlevel 1 exit /b 1
call node scripts\reset-dev-passwords.mjs
if errorlevel 1 exit /b 1

echo.
echo [6/6] Listo. Ahora reinicia la app:
echo   taskkill /F /IM node.exe
echo   npm run dev
echo.
echo Login: Saul@movilidadgc.org / Cambiar123!
echo        responsableom@movilidadgc.org / Cambiar123!
exit /b 0
