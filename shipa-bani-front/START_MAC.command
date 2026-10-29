#!/bin/bash
cd "$(dirname "$0")" || exit 1
PAGE='index.html'
if [ -f '../e-menu/index.html' ]; then
  cd .. || exit 1
  PAGE='shipa-bani-front/index.html'
else
  echo 'Note: for local full menu, put e-menu alongside shipa-bani-front.'
fi
if command -v python3 >/dev/null 2>&1; then
  (sleep 1; open "http://localhost:8000/$PAGE") &
  python3 -m http.server 8000 --bind 127.0.0.1
else
  echo 'Python 3 is required. Install python3 and run this script again.'
  read -r -p 'Press Enter to exit.'
fi
