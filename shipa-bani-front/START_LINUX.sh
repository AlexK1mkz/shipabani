#!/bin/sh
cd "$(dirname "$0")" || exit 1
PAGE='index.html'
if [ -f '../e-menu/index.html' ]; then
  cd .. || exit 1
  PAGE='shipa-bani-front/index.html'
else
  echo 'Note: for local full menu, put e-menu alongside shipa-bani-front.'
fi
if command -v python3 >/dev/null 2>&1; then
  (sleep 1; (xdg-open "http://localhost:8000/$PAGE" >/dev/null 2>&1 || true)) &
  exec python3 -m http.server 8000 --bind 127.0.0.1
else
  echo 'Python 3 required.' >&2
  exit 1
fi
