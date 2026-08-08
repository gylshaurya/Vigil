#!/usr/bin/env bash
# The "judge's laptop" script. Run this from a SECOND terminal, using the
# attacker key (which is really the vault owner's key — the pitch is that
# whoever holds this key literally cannot walk away with the funds).
#
# Usage: demo/attack.sh [--auto-veto]
#   --auto-veto   also fires the guardian veto itself, for rehearsals when
#                 nobody is driving the frontend. In the real demo, leave
#                 this off and let the presenter hit VETO in the browser.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
need_deployment

AUTO_VETO=false
[[ "${1:-}" == "--auto-veto" ]] && AUTO_VETO=true

VAULT=$(field vault)
OWNER_KEY=$(field owner.privateKey)       # the "stolen" key
GUARDIAN_KEY=$(field guardian.privateKey)
RECIPIENT=$(field recipient.address)

say "${BOLD}You have the owner's private key. Let's see what that actually gets you.${RESET}"
say "${DIM}Vault: $VAULT${RESET}"
pause_for_effect 1

step "1. Prove it's a real wallet — send a normal \$10-ish test transfer"
BEFORE=$(cast balance "$RECIPIENT" --rpc-url "$RPC_URL")
cast send "$VAULT" "propose(address,uint256,bytes)" "$RECIPIENT" 10000000000000000 0x \
  --private-key "$OWNER_KEY" --rpc-url "$RPC_URL" >/dev/null
AFTER=$(cast balance "$RECIPIENT" --rpc-url "$RPC_URL")
good "0.01 ETH landed instantly. recipient balance: $(to_eth "$BEFORE") -> $(to_eth "$AFTER") ETH"
say "  ${DIM}Small, routine transfers are not what the guard is for.${RESET}"
pause_for_effect 2

step "2. Now take everything"
VAULT_BAL=$(cast balance "$VAULT" --rpc-url "$RPC_URL")
say "  Vault holds $(to_eth "$VAULT_BAL") ETH. Proposing a transfer of all of it..."
TX=$(cast send "$VAULT" "propose(address,uint256,bytes)" "$RECIPIENT" "$VAULT_BAL" 0x \
  --private-key "$OWNER_KEY" --rpc-url "$RPC_URL" --json)
ACTION_ID=$(cast call "$VAULT" "actionCount()(uint256)" --rpc-url "$RPC_URL")
bad "Transfer of $(to_eth "$VAULT_BAL") ETH did NOT go through — it was queued as action #$ACTION_ID"
ping_phone "\"Vigil: $(to_eth "$VAULT_BAL") ETH queued to $RECIPIENT. Delay ends in $(field policy.delaySeconds)s. [VETO]\""
say "  ${DIM}Funds are still sitting in the vault, untouched, right now.${RESET}"

step "3. While that's pending — try to just turn the guard off"
DISABLE_CALLDATA=$(cast calldata "disableGuard()")
cast send "$VAULT" "propose(address,uint256,bytes)" "$VAULT" 0 "$DISABLE_CALLDATA" \
  --private-key "$OWNER_KEY" --rpc-url "$RPC_URL" >/dev/null
DISABLE_ID=$(cast call "$VAULT" "actionCount()(uint256)" --rpc-url "$RPC_URL")
bad "disableGuard() also did NOT execute — queued as action #$DISABLE_ID, same delay, same veto"
ping_phone "\"Vigil: policy change requested — disableGuard(). [VETO]\""
say "  ${DIM}Turning off the circuit breaker is, itself, a circuit-broken action.${RESET}"

if $AUTO_VETO; then
  step "4. [--auto-veto] Guardian vetoes both queued actions"
  cast send "$VAULT" "veto(uint256)" "$ACTION_ID" --private-key "$GUARDIAN_KEY" --rpc-url "$RPC_URL" >/dev/null
  cast send "$VAULT" "veto(uint256)" "$DISABLE_ID" --private-key "$GUARDIAN_KEY" --rpc-url "$RPC_URL" >/dev/null
  good "Both vetoed. Attacker walks away with nothing but the \$10 test send."
else
  step "4. Now go to the dashboard and hit VETO on action #$ACTION_ID and #$DISABLE_ID"
  say "  ${DIM}(or run: demo/veto.sh $ACTION_ID    and    demo/veto.sh $DISABLE_ID)${RESET}"
fi

say "\n${BOLD}${GREEN}Final vault balance: $(to_eth "$(cast balance "$VAULT" --rpc-url "$RPC_URL")") ETH${RESET}"
