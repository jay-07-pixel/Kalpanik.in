#!/usr/bin/env bash
# Install Kalpanik subscription activate webhook on ALL Task Manager VPS instances.
#
# Run on VPS as root:
#   cd ~/Kalpanik && git pull
#   bash integrations/install-kalpanik-activate-all.sh
#
# Optional: install one instance only:
#   bash integrations/install-kalpanik-activate-all.sh acs

set -euo pipefail

KALPANIK_ROOT="${KALPANIK_ROOT:-$HOME/Kalpanik}"
HOME_ROOT="${HOME_ROOT:-$HOME}"
ONLY="${1:-}"

if [[ ! -f "$KALPANIK_ROOT/.env" ]]; then
  echo "Missing $KALPANIK_ROOT/.env"
  exit 1
fi

SECRET="$(grep -E '^KALPANIK_ACTIVATION_SECRET=' "$KALPANIK_ROOT/.env" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
if [[ -z "$SECRET" ]]; then
  echo "KALPANIK_ACTIVATION_SECRET not set in $KALPANIK_ROOT/.env"
  exit 1
fi

ACTIVATE_SRC="$KALPANIK_ROOT/integrations/kalpanikActivate.js"
PATCH_SCRIPT="$KALPANIK_ROOT/integrations/patch-task-manager-index.mjs"
if [[ ! -f "$ACTIVATE_SRC" ]]; then
  echo "Missing $ACTIVATE_SRC — run git pull in ~/Kalpanik"
  exit 1
fi

# PM2 name → folder under $HOME
declare -A INSTANCES=(
  [taskmanager]="Task_manager"
  [acs]="Task_manager_acs"
  [safari]="Task_manager_safari"
  [ss2n]="Task_manager_ss2n"
  [tacs]="Task_manager_tacs"
  [ensens]="Task_manager_ensens"
  [edunest]="Task_manager_edunest"
)

upsert_env_secret() {
  local env_file="$1"
  touch "$env_file"
  if grep -q '^KALPANIK_ACTIVATION_SECRET=' "$env_file"; then
    sed -i "s|^KALPANIK_ACTIVATION_SECRET=.*|KALPANIK_ACTIVATION_SECRET=$SECRET|" "$env_file"
  else
    echo "KALPANIK_ACTIVATION_SECRET=$SECRET" >> "$env_file"
  fi
}

install_instance() {
  local pm2_name="$1"
  local folder="$2"
  local root="$HOME_ROOT/$folder"
  local server_dir="$root/server"
  local index_js="$server_dir/src/index.js"

  echo ""
  echo "========== $pm2_name ($folder) =========="

  if [[ ! -d "$server_dir" ]]; then
    echo "SKIP: $server_dir not found"
    return 0
  fi
  if [[ ! -f "$index_js" ]]; then
    echo "SKIP: $index_js not found"
    return 0
  fi

  cp "$ACTIVATE_SRC" "$server_dir/kalpanikActivate.js"
  echo "Copied kalpanikActivate.js"

  local env_file="$server_dir/.env"
  if [[ ! -f "$env_file" ]]; then
    env_file="$root/.env"
  fi
  upsert_env_secret "$env_file"
  echo "Set KALPANIK_ACTIVATION_SECRET in $env_file"

  node "$PATCH_SCRIPT" "$index_js"

  if ! pm2 describe "$pm2_name" >/dev/null 2>&1; then
    echo "WARN: pm2 process '$pm2_name' not found — restart manually"
    return 0
  fi

  pm2 restart "$pm2_name" --update-env
  echo "Restarted pm2:$pm2_name — waiting for API (up to 90s)..."

  local port="3000"
  if [[ -f "$env_file" ]]; then
    port="$(grep -E '^PORT=' "$env_file" | head -1 | cut -d= -f2- | tr -d ' "' || true)"
    port="${port:-3000}"
  fi

  local ready=0
  for _ in $(seq 1 18); do
    sleep 5
    if pm2 logs "$pm2_name" --lines 40 --nostream 2>/dev/null | grep -q "API listening"; then
      ready=1
      break
    fi
  done

  if [[ "$ready" -eq 1 ]]; then
    echo "API up on port $port"
    local test_body='{"trialEndExtendTo":"2026-12-31","invoiceNo":"INSTALL-TEST"}'
    local test_res
    test_res="$(curl -sS -m 10 -X POST "http://127.0.0.1:${port}/api/company/subscription/activate" \
      -H "Content-Type: application/json" \
      -H "X-Kalpanik-Secret: $SECRET" \
      -d "$test_body" 2>&1 || true)"
    if echo "$test_res" | grep -q '"ok":true'; then
      echo "OK: localhost activate test passed"
    else
      echo "WARN: localhost test on :$port returned: $test_res"
      echo "      Check registerKalpanikSubscriptionActivate is AFTER express.json() in index.js"
    fi
  else
    echo "WARN: timed out waiting for 'API listening' — check: pm2 logs $pm2_name --lines 40"
  fi
}

if [[ -n "$ONLY" ]]; then
  if [[ -z "${INSTANCES[$ONLY]+x}" ]]; then
    echo "Unknown instance '$ONLY'. Valid: ${!INSTANCES[*]}"
    exit 1
  fi
  install_instance "$ONLY" "${INSTANCES[$ONLY]}"
else
  for pm2_name in taskmanager acs safari ss2n tacs ensens edunest; do
    install_instance "$pm2_name" "${INSTANCES[$pm2_name]}"
  done
fi

echo ""
echo "Done. Test via domain only after localhost OK."
echo "Find each instance port: grep ^PORT= ~/Task_manager_*/server/.env"
echo "Then Kalpanik admin → Save & sync to site for each invoice."
