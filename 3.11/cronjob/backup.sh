#!/bin/bash
set -euo pipefail

BACKUP_FILE="/tmp/todo-db-$(date +%Y-%m-%d_%H-%M-%S).sql.gz"

echo "Starting PostgreSQL backup"
echo "Host: $PGHOST"
echo "Database: $PGDATABASE"

pg_dump -h "$PGHOST" -U "$PGUSER" "$PGDATABASE" | gzip > "$BACKUP_FILE"

echo "Uploading backup to Google Cloud Storage: gs://$BUCKET_NAME/"
gsutil cp "$BACKUP_FILE" "gs://$BUCKET_NAME/"

echo "Backup uploaded successfully: $(basename $BACKUP_FILE)"