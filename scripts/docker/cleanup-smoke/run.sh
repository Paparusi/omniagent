#!/usr/bin/env bash
set -euo pipefail

cd /repo

export OMNIAGENT_STATE_DIR="/tmp/omniagent-test"
export OMNIAGENT_CONFIG_PATH="${OMNIAGENT_STATE_DIR}/omniagent.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${OMNIAGENT_STATE_DIR}/credentials"
mkdir -p "${OMNIAGENT_STATE_DIR}/agents/main/sessions"
echo '{}' >"${OMNIAGENT_CONFIG_PATH}"
echo 'creds' >"${OMNIAGENT_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${OMNIAGENT_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm omniagent reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${OMNIAGENT_CONFIG_PATH}"
test ! -d "${OMNIAGENT_STATE_DIR}/credentials"
test ! -d "${OMNIAGENT_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${OMNIAGENT_STATE_DIR}/credentials"
echo '{}' >"${OMNIAGENT_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm omniagent uninstall --state --yes --non-interactive

test ! -d "${OMNIAGENT_STATE_DIR}"

echo "OK"
