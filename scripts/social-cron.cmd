@echo off
rem Local run via Task Scheduler (daily 18:00 Riyadh) - replaces GitHub Action after API credit ran out.
rem Generates daily posts + backlink drafts via Claude Code CLI (subscription), sends to Telegram.
rem NOTE: keep this file ASCII-only - cmd.exe misparses UTF-8 Arabic comments.
cd /d "%~dp0.."
echo ==== %date% %time% social run ==== >> "%~dp0social-cron.log"
git pull --rebase --autostash >> "%~dp0social-cron.log" 2>&1
node scripts\daily-social.mjs >> "%~dp0social-cron.log" 2>&1
if errorlevel 1 (
  echo daily-social failed >> "%~dp0social-cron.log"
  exit /b 1
)
echo done >> "%~dp0social-cron.log"
