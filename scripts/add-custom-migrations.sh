#!/bin/bash

# Script to add custom migrations after regenerating all migrations
# Usage: ./scripts/add-custom-migrations.sh

set -e

echo "🔧 Adding custom migrations..."

# Generate a new custom migration file
echo "📝 Generating custom migration file..."
npx drizzle-kit generate --custom

# Find the most recent migration file (should be the one just created)
LATEST_MIGRATION=$(ls -t src/database/migrations/*.sql | grep -v meta | head -1)

echo "📄 Found migration file: $LATEST_MIGRATION"

# Copy custom SQL into the migration file
echo "📋 Copying custom triggers..."
cat src/database/custom-migrations/relationship-triggers.sql >> "$LATEST_MIGRATION"

echo "📋 Copying FTS5 setup..."
echo "" >> "$LATEST_MIGRATION"
cat src/database/custom-migrations/fts5-posts.sql >> "$LATEST_MIGRATION"

echo "✅ Custom migrations added to: $LATEST_MIGRATION"
