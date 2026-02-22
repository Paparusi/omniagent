#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${OMNIAGENT_IMAGE:-${CLAWDBOT_IMAGE:-omniagent:local}}"
CONFIG_DIR="${OMNIAGENT_CONFIG_DIR:-${CLAWDBOT_CONFIG_DIR:-$HOME/.omniagent}}"
WORKSPACE_DIR="${OMNIAGENT_WORKSPACE_DIR:-${CLAWDBOT_WORKSPACE_DIR:-$HOME/.omniagent/workspace}}"
PROFILE_FILE="${OMNIAGENT_PROFILE_FILE:-${CLAWDBOT_PROFILE_FILE:-$HOME/.profile}}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e OMNIAGENT_LIVE_TEST=1 \
  -e OMNIAGENT_LIVE_MODELS="${OMNIAGENT_LIVE_MODELS:-${CLAWDBOT_LIVE_MODELS:-all}}" \
  -e OMNIAGENT_LIVE_PROVIDERS="${OMNIAGENT_LIVE_PROVIDERS:-${CLAWDBOT_LIVE_PROVIDERS:-}}" \
  -e OMNIAGENT_LIVE_MODEL_TIMEOUT_MS="${OMNIAGENT_LIVE_MODEL_TIMEOUT_MS:-${CLAWDBOT_LIVE_MODEL_TIMEOUT_MS:-}}" \
  -e OMNIAGENT_LIVE_REQUIRE_PROFILE_KEYS="${OMNIAGENT_LIVE_REQUIRE_PROFILE_KEYS:-${CLAWDBOT_LIVE_REQUIRE_PROFILE_KEYS:-}}" \
  -v "$CONFIG_DIR":/home/node/.omniagent \
  -v "$WORKSPACE_DIR":/home/node/.omniagent/workspace \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"
