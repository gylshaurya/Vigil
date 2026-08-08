"use client";

import type { Deployment } from "./deployment";
import { getPublicClient, getWalletClientFor } from "./chain";

export async function vetoAction(deployment: Deployment, actionId: number): Promise<`0x${string}`> {
  if (!deployment.guardian.privateKey) {
    throw new Error("Guardian demo key not available for this network — veto is only wired up for the local demo chain.");
  }
  const wallet = getWalletClientFor(deployment, deployment.guardian.privateKey);
  const publicClient = getPublicClient(deployment);
  const hash = await wallet.writeContract({
    address: deployment.vault,
    abi: deployment.abi,
    functionName: "veto",
    args: [BigInt(actionId)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function executeReadyAction(deployment: Deployment, actionId: number): Promise<`0x${string}`> {
  if (!deployment.guardian.privateKey) {
    throw new Error("No demo signer available for this network.");
  }
  const wallet = getWalletClientFor(deployment, deployment.guardian.privateKey);
  const publicClient = getPublicClient(deployment);
  const hash = await wallet.writeContract({
    address: deployment.vault,
    abi: deployment.abi,
    functionName: "executeAction",
    args: [BigInt(actionId)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function sendTestTransfer(deployment: Deployment, toWei: bigint): Promise<`0x${string}`> {
  if (!deployment.owner.privateKey) {
    throw new Error("Owner demo key not available for this network.");
  }
  const wallet = getWalletClientFor(deployment, deployment.owner.privateKey);
  const publicClient = getPublicClient(deployment);
  const hash = await wallet.writeContract({
    address: deployment.vault,
    abi: deployment.abi,
    functionName: "propose",
    args: [deployment.recipient.address, toWei, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
