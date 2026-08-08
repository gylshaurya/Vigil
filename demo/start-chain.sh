#!/usr/bin/env bash
# Starts the local demo chain (Anvil) in the foreground. Run this in its own
# terminal/tab and leave it running for the duration of the demo.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
say "${BOLD}${CYAN}Starting local Vigil demo chain (Anvil, chainId 31337)...${RESET}"
exec anvil --block-time 1
