#!/usr/bin/env bash
set -e

# Persist the SQLite DB to S3 via Litestream so it survives Render restarts.
# Falls back to running the server directly if Litestream/S3 isn't configured.

DB_PATH="${DB_PATH:-/tmp/attendance.db}"
export DB_PATH
LS=./litestream

if [ -x "$LS" ] && [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
  echo "Litestream: restoring DB from S3 (if it exists)…"
  "$LS" restore -if-replica-exists -config litestream.yml "$DB_PATH" || true
  echo "Litestream: starting replication + server"
  exec "$LS" replicate -config litestream.yml -exec "node server.js"
else
  echo "Litestream not configured — running server with ephemeral DB"
  exec node server.js
fi
