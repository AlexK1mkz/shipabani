@echo off
setlocal
cd /d "%~dp0"
echo SHIPA - local development server on http://localhost:8000
where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:8000"
  py -3 -m http.server 8000 --bind 127.0.0.1
  goto end
)
where python >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:8000"
  python -m http.server 8000 --bind 127.0.0.1
  goto end
)
echo Python is not installed. Install Python 3 from python.org and check Add python.exe to PATH.
pause
:end
endlocal
