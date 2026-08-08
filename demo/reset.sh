#!/usr/bin/env bash
# Kills any local demo chain, restarts a fresh one, and redeploys — use this
# between rehearsals so every run starts from a clean slate.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

pkill -f "anvil" 2>/dev/null || true
sleep 1

step "Starting fresh Anvil chain in the background"
nohup anvil --block-time 1 > "$ROOT_DIR/.anvil.log" 2>&1 &
disown
sleep 2
good "Anvil running (log: $ROOT_DIR/.anvil.log)"

"$DEMO_DIR/deploy.sh"
