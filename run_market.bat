@echo off
TITLE Launching GENERATIVE MARKET
echo 🚀 Starting Generative Market...
cd /d "%~dp0"
start "" http://localhost:5173
npm run dev
pause
