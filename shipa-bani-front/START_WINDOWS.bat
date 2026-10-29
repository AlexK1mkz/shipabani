@echo off
setlocal
cd /d "%~dp0"
set "SHIPA_PAGE=index.html"
if exist "..\e-menu\index.html" (
  cd ..
  set "SHIPA_PAGE=shipa-bani-front/index.html"
) else (
  echo Note: e-menu must be placed alongside shipa-bani-front to open the full menu locally.
)
echo SHIPA - local development server on http://localhost:8000/%SHIPA_PAGE%
where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:8000/%SHIPA_PAGE%"
  py -3 -m http.server 8000 --bind 127.0.0.1
  goto end
)
where python >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:8000/%SHIPA_PAGE%"
  python -m http.server 8000 --bind 127.0.0.1
  goto end
)
echo Python is not installed. Install Python 3 from python.org and check Add python.exe to PATH.
pause
:end
endlocal
