import { decodeFunctionData, formatEther } from "viem";
import type { Deployment } from "./deployment";
import type { VaultAction } from "./useVaultState";
import { shortAddr } from "./chain";

export function describeAction(
  deployment: Deployment,
  action: Pick<VaultAction, "target" | "value" | "data">
): { title: string; detail: string; kind: "transfer" | "config" | "call" } {
  const isSelf = action.target.toLowerCase() === deployment.vault.toLowerCase();

  if (isSelf) {
    try {
      const decoded = decodeFunctionData({ abi: deployment.abi, data: action.data });
      const args = (decoded.args ?? []) as unknown[];
      switch (decoded.functionName) {
        case "disableGuard":
          return { title: "Disable the guard", detail: "Every future transfer would become instant, no delay, no veto.", kind: "config" };
        case "reenableGuard":
          return { title: "Re-enable the guard", detail: `New threshold ${formatEther(args[0] as bigint)} ETH, window limit ${formatEther(args[1] as bigint)} ETH.`, kind: "config" };
        case "setDelay":
          return { title: "Change the delay", detail: `New delay: ${String(args[0])}s.`, kind: "config" };
        case "setInstantThreshold":
          return { title: "Change the instant threshold", detail: `New threshold: ${formatEther(args[0] as bigint)} ETH.`, kind: "config" };
        case "setRollingWindow":
          return { title: "Change the rolling window", detail: `New window: ${String(args[0])}s, limit ${formatEther(args[1] as bigint)} ETH.`, kind: "config" };
        case "setAllowlisted":
          return { title: `${args[1] ? "Add to" : "Remove from"} allowlist`, detail: shortAddr(String(args[0])), kind: "config" };
        case "setOwner":
          return { title: "Change the owner key", detail: shortAddr(String(args[0])), kind: "config" };
        case "setGuardian":
          return { title: "Change the guardian key", detail: shortAddr(String(args[0])), kind: "config" };
        default:
          return { title: `Vault self-call: ${decoded.functionName}`, detail: "Policy change proposed on the vault itself.", kind: "config" };
      }
    } catch {
      return { title: "Vault policy change", detail: "Could not decode calldata.", kind: "config" };
    }
  }

  if (action.data === "0x" || action.data.length === 0) {
    return { title: `Send ${formatEther(action.value)} ETH`, detail: `to ${shortAddr(action.target)}`, kind: "transfer" };
  }

  return { title: "Contract call", detail: `to ${shortAddr(action.target)} · ${formatEther(action.value)} ETH attached`, kind: "call" };
}
