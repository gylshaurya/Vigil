#!/usr/bin/env bash
# Shared helpers for the Vigil demo scripts.
set -euo pipefail

export PATH="$HOME/.foundry/bin:$PATH"

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DEMO_DIR/.." && pwd)"
CONTRACTS_DIR="$ROOT_DIR/contracts"
DEPLOYMENT_FILE="$ROOT_DIR/deployment.json"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

BOLD="\033[1m"; DIM="\033[2m"; RED="\033[31m"; GREEN="\033[32m"
YELLOW="\033[33m"; CYAN="\033[36m"; MAGENTA="\033[35m"; RESET="\033[0m"

say()      { echo -e "${1}"; }
step()     { echo -e "\n${BOLD}${CYAN}▶ ${1}${RESET}"; }
good()     { echo -e "  ${GREEN}✔ ${1}${RESET}"; }
bad()      { echo -e "  ${RED}✘ ${1}${RESET}"; }
ping_phone() {
  echo -e "  ${MAGENTA}📱 GUARDIAN PHONE: ${1}${RESET}"
}
pause_for_effect() { sleep "${1:-1}"; }

need_deployment() {
  if [[ ! -f "$DEPLOYMENT_FILE" ]]; then
    bad "No deployment.json found. Run demo/deploy.sh first."
    exit 1
  fi
}

field() { jq -r ".$1" "$DEPLOYMENT_FILE"; }

to_eth() { cast --to-unit "$1" ether; }
