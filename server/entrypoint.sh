#!/bin/sh
set -e
# Apply schema to DB so tables exist when no migration files are present
npx prisma db push --skip-generate || true
exec node src/index.js
