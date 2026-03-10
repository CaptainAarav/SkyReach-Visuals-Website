#!/usr/bin/env bash
# Merges deploy/env.production into Pi's .env so production URLs/config stay correct.
# Run from repo root. Uses PISERVER (e.g. aarav@PISERVER) or pass user@host as $1.
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${1:-aarav@PISERVER}"

scp "$REPO_ROOT/deploy/env.production" "$REMOTE:~/skyreach-visuals/env.production.merge"
ssh "$REMOTE" 'cd ~/skyreach-visuals && while IFS= read -r line; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  key="${line%%=*}"; val="${line#*=}"
  [[ -z "$key" ]] && continue
  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i.bak "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "$line" >> .env
  fi
done < env.production.merge; rm -f env.production.merge .env.bak; echo "Env synced."'
