@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запускаю «Шахту Знаний» на http://127.0.0.1:8787/
start "Шахта Знаний - сервер" cmd /c "node serve.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8787/"
