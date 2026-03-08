#!/bin/sh
# Apply schema to DB so tables exist when no migration files are present
if npx prisma db push --skip-generate 2>&1; then
  echo "Prisma db push OK"
else
  echo "Prisma db push failed (continuing anyway)"
fi
exec node src/index.js
