#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/backend"
PYTHONPATH=. .venv/bin/pytest tests -v
