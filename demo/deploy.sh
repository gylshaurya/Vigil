#!/usr/bin/env bash
# Deploys a fresh VigilVault to a local Anvil chain and writes deployment.json
# for the demo scripts and the frontend to consume. Anvil's well-known default
# test keys are used throughout — these are public dev-only keys, never fund
# them with real assets on a public network.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

if ! curl -s -o /dev/null -X POST -H 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' "$RPC_URL"; then
  bad "No chain reachable at $RPC_URL. Start one with: demo/start-chain.sh"
  exit 1
fi

OWNER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
GUARDIAN_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
ATTACKER_KEY="${ATTACKER_KEY:-0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a}"
RECIPIENT_KEY="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

OWNER_ADDR=$(cast wallet address --private-key "$OWNER_KEY")
GUARDIAN_ADDR=$(cast wallet address --private-key "$GUARDIAN_KEY")
ATTACKER_ADDR=$(cast wallet address --private-key "$ATTACKER_KEY")
RECIPIENT_ADDR=$(cast wallet address --private-key "$RECIPIENT_KEY")

INSTANT_THRESHOLD_WEI="${INSTANT_THRESHOLD_WEI:-50000000000000000}"     # 0.05 ETH
DELAY_SECONDS="${DELAY_SECONDS:-60}"
ROLLING_WINDOW_SECONDS="${ROLLING_WINDOW_SECONDS:-86400}"
ROLLING_WINDOW_LIMIT_WEI="${ROLLING_WINDOW_LIMIT_WEI:-150000000000000000}" # 0.15 ETH
FUND_WEI="${FUND_WEI:-2000000000000000000}"                              # 2 ETH

step "Deploying VigilVault to $RPC_URL"

cd "$CONTRACTS_DIR"
OUT=$(PRIVATE_KEY="$OWNER_KEY" GUARDIAN="$GUARDIAN_ADDR" \
  INSTANT_THRESHOLD_WEI="$INSTANT_THRESHOLD_WEI" DELAY_SECONDS="$DELAY_SECONDS" \
  ROLLING_WINDOW_SECONDS="$ROLLING_WINDOW_SECONDS" ROLLING_WINDOW_LIMIT_WEI="$ROLLING_WINDOW_LIMIT_WEI" \
  FUND_WEI="$FUND_WEI" \
  forge script script/Deploy.s.sol:DeployVigilVault --rpc-url "$RPC_URL" --broadcast -vv)

VAULT_ADDR=$(echo "$OUT" | grep "VigilVault deployed at:" | awk '{print $NF}')
CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL")

if [[ -z "$VAULT_ADDR" ]]; then
  bad "Deployment failed"
  echo "$OUT"
  exit 1
fi

jq -n \
  --arg vault "$VAULT_ADDR" \
  --arg chainId "$CHAIN_ID" \
  --arg rpcUrl "$RPC_URL" \
  --arg owner "$OWNER_ADDR" --arg ownerKey "$OWNER_KEY" \
  --arg guardian "$GUARDIAN_ADDR" --arg guardianKey "$GUARDIAN_KEY" \
  --arg attacker "$ATTACKER_ADDR" --arg attackerKey "$ATTACKER_KEY" \
  --arg recipient "$RECIPIENT_ADDR" --arg recipientKey "$RECIPIENT_KEY" \
  --argjson instantThreshold "$INSTANT_THRESHOLD_WEI" \
  --argjson delay "$DELAY_SECONDS" \
  --argjson rollingWindowDuration "$ROLLING_WINDOW_SECONDS" \
  --argjson rollingWindowLimit "$ROLLING_WINDOW_LIMIT_WEI" \
  '{
    vault: $vault, chainId: ($chainId | tonumber), rpcUrl: $rpcUrl,
    owner: {address: $owner, privateKey: $ownerKey},
    guardian: {address: $guardian, privateKey: $guardianKey},
    attacker: {address: $attacker, privateKey: $attackerKey},
    recipient: {address: $recipient, privateKey: $recipientKey},
    policy: {
      instantThresholdWei: $instantThreshold,
      delaySeconds: $delay,
      rollingWindowDurationSeconds: $rollingWindowDuration,
      rollingWindowLimitWei: $rollingWindowLimit
    }
  }' > "$DEPLOYMENT_FILE"

cp "$CONTRACTS_DIR/out/VigilVault.sol/VigilVault.json" "$ROOT_DIR/deployment.abi.json"

good "Vault deployed at $VAULT_ADDR (chain $CHAIN_ID)"
good "Wrote $DEPLOYMENT_FILE"
say "${DIM}  owner:     $OWNER_ADDR${RESET}"
say "${DIM}  guardian:  $GUARDIAN_ADDR${RESET}"
say "${DIM}  attacker:  $ATTACKER_ADDR (demo stand-in for 'judge with your key')${RESET}"
say "${DIM}  recipient: $RECIPIENT_ADDR${RESET}"
