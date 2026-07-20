@echo off
rem Local run via Task Scheduler (every 12h) - replaces GitHub Action after API credit ran out.
rem Pulls latest, generates news via Claude Code CLI (subscription), pushes news.json if changed.
rem NOTE: keep this file ASCII-only - cmd.exe misparses UTF-8 Arabic comments.
cd /d "%~dp0.."
echo ==== %date% %time% news run ==== >> "%~dp0news-cron.log"
git pull --rebase --autostash >> "%~dp0news-cron.log" 2>&1
node scripts\update-news.mjs >> "%~dp0news-cron.log" 2>&1
if errorlevel 1 (
  echo update-news failed >> "%~dp0news-cron.log"
  exit /b 1
)
git diff --quiet src/data/news.json
if %errorlevel%==0 (
  echo no news changes >> "%~dp0news-cron.log"
  exit /b 0
)
git add src/data/news.json
git commit -m "chore(news): auto-update gaming news" >> "%~dp0news-cron.log" 2>&1
git push >> "%~dp0news-cron.log" 2>&1
node scripts\submit-indexnow.mjs --recent-news >> "%~dp0news-cron.log" 2>&1
echo pushed >> "%~dp0news-cron.log"
