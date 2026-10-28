#!/bin/sh
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  (sleep 1; (xdg-open 'http://localhost:8000' >/dev/null 2>&1 || true)) &
  exec python3 -m http.server 8000 --bind 127.0.0.1
else
  echo 'Python 3 required.' >&2
  exit 1
fi
