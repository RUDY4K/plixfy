@echo off
rem Prepare local review drafts only. No pull, commit, push, or notification.
cd /d "%~dp0.."
node scripts\update-news.mjs >> "%~dp0news-cron.log" 2>&1
exit /b %errorlevel%
