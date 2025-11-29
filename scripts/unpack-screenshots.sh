#!/bin/bash
# Unpack screenshots from password-protected zip archive
# Password is read from QA_PASS in .env file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load password from .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -E '^QA_PASS=' "$PROJECT_DIR/.env" | xargs)
fi

if [ -z "$QA_PASS" ]; then
  echo "Error: QA_PASS not found in .env file"
  exit 1
fi

ARCHIVE_PATH="$PROJECT_DIR/screenshots.zip"

if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "Error: screenshots.zip not found"
  exit 1
fi

# Extract archive
cd "$PROJECT_DIR"
unzip -o -P "$QA_PASS" screenshots.zip

echo "Screenshots unpacked to screenshots/ directory"
