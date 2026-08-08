import { createPublicClient, createWalletClient, defineChain, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Deployment } from "./deployment";

export function chainFor(d: Pick<Deployment, "chainId" | "rpcUrl">) {
  return defineChain({
    id: d.chainId,
    name: d.chainId === 31337 ? "Failsafe Local Demo" : `Chain ${d.chainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [d.rpcUrl] } },
  });
}

export function getPublicClient(d: Deployment) {
  return createPublicClient({ chain: chainFor(d), transport: http(d.rpcUrl) });
}

export function getWalletClientFor(d: Deployment, privateKey: `0x${string}`) {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: chainFor(d),
    transport: http(d.rpcUrl),
  });
}

export function formatEth(wei: bigint, maxFractionDigits = 4): string {
  const asString = formatEther(wei);
  const n = Number(asString);
  if (!Number.isFinite(n)) return asString;
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function shortHex(hex: string, len = 8): string {
  if (!hex) return hex;
  if (hex === "0x") return "0x (plain ETH send)";
  return hex.length > len + 2 ? `${hex.slice(0, len + 2)}…` : hex;
}

export const MAX_UINT256 = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export function isGuardDisabled(instantThreshold: bigint): boolean {
  return instantThreshold === MAX_UINT256;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!d && !h) parts.push(`${s}s`);
  return parts.join(" ");
}
