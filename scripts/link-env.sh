#!/usr/bin/env bash
# Ensure apps/api/.env exists (as a symlink to the root .env) so the Prisma
# CLI — which loads dotenv relative to its own package — can resolve
# DATABASE_URL when invoked from the repo root.
#
# Called by the root `db:*` scripts in package.json before any prisma command.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

if [[ ! -f .env ]]; then
  echo "✗ Root .env not found. Run 'pnpm bootstrap' first, or copy .env.example to .env." >&2
  exit 1
fi

if [[ -e apps/api/.env ]] && [[ ! -L apps/api/.env ]]; then
  # Real file exists — leave it alone, assume user knows what they're doing.
  exit 0
fi

ln -sfn ../../.env apps/api/.env
