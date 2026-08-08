"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Deployment } from "./deployment";
import { getPublicClient } from "./chain";

export type VaultAction = {
  id: number;
  target: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
  readyAt: number;
  executed: boolean;
  vetoed: boolean;
  proposer: `0x${string}`;
};

export type VaultState = {
  balance: bigint;
  owner: `0x${string}`;
  guardian: `0x${string}`;
  instantThreshold: bigint;
  delay: bigint;
  rollingWindowDuration: bigint;
  rollingWindowLimit: bigint;
  rollingWindowSpent: bigint;
  rollingWindowRemaining: bigint;
  actionCount: number;
  actions: VaultAction[];
  chainTimestamp: number;
  fetchedAt: number;
};

export function useVaultState(deployment: Deployment | null, intervalMs = 1500) {
  const [state, setState] = useState<VaultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!deployment || inFlight.current) return;
    inFlight.current = true;
    try {
      const client = getPublicClient(deployment);
      const abi = deployment.abi;
      const vault = deployment.vault;

      const [
        balance,
        owner,
        guardian,
        instantThreshold,
        delay,
        rollingWindowDuration,
        rollingWindowLimit,
        rollingWindowSpent,
        rollingWindowRemaining,
        actionCount,
        block,
      ] = await Promise.all([
        client.getBalance({ address: vault }),
        client.readContract({ address: vault, abi, functionName: "owner" }) as Promise<`0x${string}`>,
        client.readContract({ address: vault, abi, functionName: "guardian" }) as Promise<`0x${string}`>,
        client.readContract({ address: vault, abi, functionName: "instantThreshold" }) as Promise<bigint>,
        client.readContract({ address: vault, abi, functionName: "delay" }) as Promise<bigint>,
        client.readContract({ address: vault, abi, functionName: "rollingWindowDuration" }) as Promise<bigint>,
        client.readContract({ address: vault, abi, functionName: "rollingWindowLimit" }) as Promise<bigint>,
        client.readContract({ address: vault, abi, functionName: "rollingWindowSpent" }) as Promise<bigint>,
        client.readContract({ address: vault, abi, functionName: "rollingWindowRemaining" }) as Promise<bigint>,
        client.readContract({ address: vault, abi, functionName: "actionCount" }) as Promise<bigint>,
        client.getBlock(),
      ]);

      const count = Number(actionCount);
      const ids = Array.from({ length: count }, (_, i) => i + 1);
      const actions: VaultAction[] = await Promise.all(
        ids.map(async (id) => {
          const [target, value, data, readyAt, executed, vetoed, proposer] = (await client.readContract({
            address: vault,
            abi,
            functionName: "getAction",
            args: [BigInt(id)],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          })) as any;
          return {
            id,
            target,
            value,
            data,
            readyAt: Number(readyAt),
            executed,
            vetoed,
            proposer,
          };
        })
      );
      actions.sort((a, b) => b.id - a.id);

      setState({
        balance,
        owner,
        guardian,
        instantThreshold,
        delay,
        rollingWindowDuration,
        rollingWindowLimit,
        rollingWindowSpent,
        rollingWindowRemaining,
        actionCount: count,
        actions,
        chainTimestamp: Number(block.timestamp),
        fetchedAt: Date.now(),
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read vault state");
    } finally {
      inFlight.current = false;
    }
  }, [deployment]);

  useEffect(() => {
    if (!deployment) return;
    // Deferred via microtask (rather than called synchronously in the effect
    // body) so the initial fetch doesn't trip the set-state-in-effect lint —
    // it still runs essentially immediately.
    queueMicrotask(refresh);
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [deployment, intervalMs, refresh]);

  return { state, error, refresh };
}
