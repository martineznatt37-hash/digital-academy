@echo off
chcp 65001 >nul
title Digital Academy - Publicar en internet
color 0A
echo.
echo ========================================
echo   DIGITAL ACADEMY - PUBLICAR ONLINE
echo ========================================
echo.

set GIT="C:\Program Files\Git\bin\git.exe"
cd /d "%~dp0"

echo [1/3] Subiendo codigo a GitHub...
echo       (Si se abre una ventana, inicia sesion con tu cuenta de GitHub)
echo.
%GIT% push -u origin main
if errorlevel 1 (
  echo.
  echo *** No se pudo subir a GitHub. Inicia sesion cuando te lo pida e intenta de nuevo. ***
  pause
  exit /b 1
)
echo.
echo [OK] Codigo en GitHub!
echo.

echo [2/3] Abriendo Netlify para subir la pagina...
echo       Arrastra el archivo "digital-academy-netlify.zip" a la pagina que se abre.
start https://app.netlify.com/drop
explorer /select,"%~dp0digital-academy-netlify.zip"
echo.
timeout /t 3 >nul

echo [3/3] Abriendo Render para el servidor (login, chat, cursos)...
echo       En Render: conecta el repo "digital-academy", Root Directory = server
start https://dashboard.render.com/select-repo?type=web
echo.
echo ========================================
echo   LISTO - Sigue las ventanas que se abrieron
echo ========================================
echo.
pause
