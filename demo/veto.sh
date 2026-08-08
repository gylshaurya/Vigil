#!/usr/bin/env bash
# Fires the guardian veto from the command line — a fallback for when you want
# to show the veto without the frontend, or for scripting rehearsals.
# Usage: demo/veto.sh <actionId>
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
need_deployment

ID="${1:?usage: demo/veto.sh <actionId>}"
VAULT=$(field vault)
GUARDIAN_KEY=$(field guardian.privateKey)

step "Guardian vetoing action #$ID"
cast send "$VAULT" "veto(uint256)" "$ID" --private-key "$GUARDIAN_KEY" --rpc-url "$RPC_URL" >/dev/null
good "Action #$ID vetoed. It can never execute, even after the delay elapses."
