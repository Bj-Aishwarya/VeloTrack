#!/usr/bin/env bash
# VeloTrack Quickstart Launcher
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "======================================================="
echo "  Starting VeloTrack Fleet Optimization Platform..."
echo "  Running on Python: $(python3 --version)"
echo "  Live Server: http://localhost:8000"
echo "======================================================="

python3 app.py "$@"
