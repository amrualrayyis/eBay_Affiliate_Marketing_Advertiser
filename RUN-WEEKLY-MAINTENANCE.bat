@echo off
cd /d "%~dp0"
echo --- 🛠️ Starting littlniss Weekly Maintenance ---

echo [1/4] Refreshing Niches with AI Trends...
node research-niches.js

echo [2/4] Analyzing Competitors...
node competitor-monitor.js

echo [3/4] Generating CEO Report...
node ceo-report.js

echo [4/4] Building Weekly Newsletter...
node build-newsletter.js

echo ✅ Maintenance Complete!
pause
exit
