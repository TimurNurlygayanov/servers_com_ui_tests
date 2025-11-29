#!/bin/bash
# Pack screenshots into a password-protected zip archive
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

SCREENSHOTS_DIR="$PROJECT_DIR/screenshots"
ARCHIVE_PATH="$PROJECT_DIR/screenshots.zip"

if [ ! -d "$SCREENSHOTS_DIR" ]; then
  echo "Error: screenshots/ directory not found"
  exit 1
fi

# Remove old archive if exists
rm -f "$ARCHIVE_PATH"

# Create password-protected zip archive
cd "$PROJECT_DIR"
zip -r -P "$QA_PASS" screenshots.zip screenshots/

echo "Screenshots packed to screenshots.zip (password-protected)"
