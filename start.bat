@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запускаю «Шахту Знаний» на http://127.0.0.1:8787/

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
  start "Шахта Знаний - сервер" cmd /c "node serve.js"
) else (
  start "Шахта Знаний - сервер" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
)

timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8787/menu.html"
