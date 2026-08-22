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

  if [[ -f "$server_dir/.env" ]]; then
    upsert_env_secret "$server_dir/.env"
  else
    upsert_env_secret "$root/.env"
  fi
  echo "Set KALPANIK_ACTIVATION_SECRET"

  node "$PATCH_SCRIPT" "$index_js"

  if pm2 describe "$pm2_name" >/dev/null 2>&1; then
    pm2 restart "$pm2_name" --update-env
    echo "Restarted pm2:$pm2_name (wait ~30s for npm build if applicable)"
  else
    echo "WARN: pm2 process '$pm2_name' not found — restart manually"
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
echo "Done. After each restart shows 'API listening', test e.g.:"
echo "  curl -X POST http://localhost:3000/api/company/subscription/activate \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'X-Kalpanik-Secret: $SECRET' \\"
echo "    -d '{\"trialEndExtendTo\":\"2026-12-31\",\"invoiceNo\":\"TEST\"}'"
echo ""
echo "Then use Kalpanik admin → Save & sync to site for each invoice."
