@echo off
cd /d "%~dp0"
echo --- 🐕 Starting littlniss Price Watchdog ---
node price-watchdog.js
echo ✅ Monitoring Complete!
pause
exit
