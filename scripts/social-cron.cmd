@echo off
rem تشغيل محلي عبر Task Scheduler (يومياً 18:00) — بديل GitHub Action بعد نفاد رصيد API.
rem يولّد منشورات اليوم + مسودات الباكلينكس ويرسلها إلى تلقرام.
cd /d "%~dp0.."
echo ==== %date% %time% social run ==== >> "%~dp0social-cron.log"
git pull --rebase --autostash >> "%~dp0social-cron.log" 2>&1
node scripts\daily-social.mjs >> "%~dp0social-cron.log" 2>&1
if errorlevel 1 (
  echo daily-social failed >> "%~dp0social-cron.log"
  exit /b 1
)
echo done >> "%~dp0social-cron.log"
