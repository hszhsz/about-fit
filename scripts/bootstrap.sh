#!/usr/bin/env bash
# AboutFit — one-key bootstrap
#
# What it does:
#   1. Verifies prerequisites (node, pnpm, docker, docker compose)
#   2. Creates .env from .env.example if missing
#   3. Boots Postgres + Redis + MinIO via docker compose, waits for healthy
#   4. pnpm install (workspaces)
#   5. prisma generate + prisma migrate dev (idempotent)
#   6. Optionally starts api / web / worker via turbo (--dev flag)
#
# Usage:
#   ./scripts/bootstrap.sh            # provision only (infra + deps + db)
#   ./scripts/bootstrap.sh --dev      # provision, then `pnpm dev`
#   ./scripts/bootstrap.sh --reset    # docker down -v before bringing up
#   ./scripts/bootstrap.sh --help

set -euo pipefail

# ─── colors ──────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_RESET='\033[0m'; C_BOLD='\033[1m'; C_DIM='\033[2m'
  C_RED='\033[31m'; C_GREEN='\033[32m'; C_YELLOW='\033[33m'; C_CYAN='\033[36m'
else
  C_RESET=''; C_BOLD=''; C_DIM=''; C_RED=''; C_GREEN=''; C_YELLOW=''; C_CYAN=''
fi

log()   { printf "${C_CYAN}▸${C_RESET} %s\n" "$*"; }
ok()    { printf "${C_GREEN}✓${C_RESET} %s\n" "$*"; }
warn()  { printf "${C_YELLOW}!${C_RESET} %s\n" "$*"; }
fail()  { printf "${C_RED}✗${C_RESET} %s\n" "$*" >&2; exit 1; }
step()  { printf "\n${C_BOLD}== %s ==${C_RESET}\n" "$*"; }

# ─── locate repo root ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

COMPOSE_FILE="infra/docker-compose.yml"
DEV_MODE=0
RESET=0

# ─── arg parsing ─────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --dev)    DEV_MODE=1 ;;
    --reset)  RESET=1 ;;
    -h|--help)
      cat <<EOF
${C_BOLD}AboutFit bootstrap${C_RESET}

Usage:
  ./scripts/bootstrap.sh            Provision infra + deps + db (no servers)
  ./scripts/bootstrap.sh --dev      Provision then start api/web/worker
  ./scripts/bootstrap.sh --reset    Wipe docker volumes before provisioning
  ./scripts/bootstrap.sh --help     Show this message

After provisioning, in three terminals run:
  pnpm --filter @about-fit/api dev      # http://localhost:4000
  pnpm --filter @about-fit/web dev      # http://localhost:3000
  pnpm --filter @about-fit/worker dev

MinIO console:  http://localhost:9001  (aboutfit / aboutfit-dev-secret)
EOF
      exit 0
      ;;
    *) fail "Unknown arg: $arg (try --help)" ;;
  esac
done

# ─── 1. prerequisites ────────────────────────────────────────────────────────
step "1/6  Checking prerequisites"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 not found. $2"
}
require_cmd node   "Install Node.js >= 20.11 (https://nodejs.org)."
require_cmd pnpm   "Install pnpm: 'npm i -g pnpm@9' or https://pnpm.io/installation"
require_cmd docker "Install Docker Desktop or Docker Engine."

# Node version >= 20.11
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
NODE_MINOR="$(node -p 'process.versions.node.split(".")[1]')"
if (( NODE_MAJOR < 20 )) || { (( NODE_MAJOR == 20 )) && (( NODE_MINOR < 11 )); }; then
  fail "Node $(node -v) too old. Need >= 20.11."
fi

# docker compose v2
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  fail "docker compose plugin not found. Install Docker Desktop or 'docker-compose-plugin'."
fi

ok "node $(node -v) · pnpm $(pnpm -v) · ${COMPOSE}"

# ─── 2. .env ─────────────────────────────────────────────────────────────────
step "2/6  Environment file"

if [[ ! -f .env ]]; then
  cp .env.example .env
  ok "Created .env from .env.example"
  warn "Open .env and fill in DASHSCOPE_API_KEY before generating renders/copy."
else
  ok ".env already exists (left untouched)"
fi

# Prisma CLI loads .env relative to the package it runs in (apps/api/),
# not the monorepo root. Mirror the root .env into apps/api/ via a symlink
# so 'prisma migrate' / 'prisma generate' see DATABASE_URL regardless of cwd.
bash scripts/link-env.sh
ok "Linked apps/api/.env -> ../../.env (for Prisma CLI)"

# ─── 3. docker compose ───────────────────────────────────────────────────────
step "3/6  Infra (Postgres + Redis + MinIO)"

if [[ $RESET -eq 1 ]]; then
  warn "--reset: tearing down volumes"
  $COMPOSE -f "$COMPOSE_FILE" down -v
fi

$COMPOSE -f "$COMPOSE_FILE" up -d

# wait for healthy. The compose has healthchecks for postgres + redis + minio.
log "Waiting for services to become healthy (max 90s)…"
DEADLINE=$(( $(date +%s) + 90 ))
SERVICES=(about-fit-postgres about-fit-redis about-fit-minio)
while :; do
  ALL_OK=1
  for svc in "${SERVICES[@]}"; do
    STATE="$(docker inspect -f '{{.State.Health.Status}}' "$svc" 2>/dev/null || echo 'missing')"
    if [[ "$STATE" != "healthy" ]]; then
      ALL_OK=0
      break
    fi
  done
  [[ $ALL_OK -eq 1 ]] && break
  if (( $(date +%s) > DEADLINE )); then
    fail "Services not healthy after 90s. Run: $COMPOSE -f $COMPOSE_FILE logs"
  fi
  sleep 2
done
ok "Postgres + Redis + MinIO healthy"

# minio-init is a one-shot job; let it finish (it self-exits)
log "Bootstrapping MinIO buckets…"
$COMPOSE -f "$COMPOSE_FILE" up minio-init >/dev/null 2>&1 || true
ok "Buckets: about-fit-uploads / about-fit-renders / about-fit-exports"

# ─── 4. dependencies ────────────────────────────────────────────────────────
step "4/6  Installing workspace dependencies (pnpm install)"
pnpm install
ok "Dependencies installed"

# ─── 5. prisma ──────────────────────────────────────────────────────────────
step "5/6  Database (prisma generate + migrate)"
pnpm --filter @about-fit/api exec prisma generate
# `migrate dev` is idempotent: applies pending migrations and creates the DB
# schema if empty. For CI / fresh-clone scenarios it doubles as init.
pnpm --filter @about-fit/api exec prisma migrate dev --name init --skip-seed || \
  pnpm --filter @about-fit/api exec prisma migrate dev
ok "Schema applied"

# ─── 6. summary or dev ──────────────────────────────────────────────────────
step "6/6  Ready"

cat <<EOF

${C_GREEN}${C_BOLD}AboutFit is provisioned.${C_RESET}

  ${C_DIM}Web${C_RESET}     http://localhost:3000
  ${C_DIM}API${C_RESET}     http://localhost:4000/api
  ${C_DIM}MinIO${C_RESET}   http://localhost:9001  (aboutfit / aboutfit-dev-secret)

Next:
  ${C_BOLD}pnpm dev${C_RESET}                              # start everything via turbo
  ${C_BOLD}pnpm --filter @about-fit/api dev${C_RESET}      # API only
  ${C_BOLD}pnpm --filter @about-fit/web dev${C_RESET}      # Web only
  ${C_BOLD}pnpm --filter @about-fit/worker dev${C_RESET}   # Worker only

Tear down:  ${C_BOLD}pnpm docker:down${C_RESET}
EOF

if [[ $DEV_MODE -eq 1 ]]; then
  step "Starting dev servers (Ctrl-C to stop)"
  exec pnpm dev
fi
