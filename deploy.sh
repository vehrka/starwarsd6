#!/usr/bin/env bash
# Deploy the starwarsd6 system to the remote Foundry v13 server.
# Usage: ./deploy.sh [--dry-run]

set -euo pipefail

REMOTE_HOST="vehrka"
REMOTE_BASE="share/foundrydata_13/Data/systems/starwarsd6"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RSYNC_OPTS=(
  --archive
  --compress
  --delete
  --exclude="tests/"
  --exclude="doc/"
  --exclude="PRPs/"
  --exclude="ref/"
  --exclude=".git/"
  --exclude="deploy.sh"
  --exclude="*.md"
)

if [[ "${1:-}" == "--dry-run" ]]; then
  RSYNC_OPTS+=(--dry-run --verbose)
  echo "=== DRY RUN ==="
fi

rsync "${RSYNC_OPTS[@]}" \
  "${SCRIPT_DIR}/" \
  "${REMOTE_HOST}:${REMOTE_BASE}/"

echo "Deployed to ${REMOTE_HOST}:${REMOTE_BASE}"
