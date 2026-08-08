import { NextResponse } from "next/server";
import { getServerDeployment } from "@/lib/serverDeployment";
import { getPublicClient, getWalletClientFor } from "@/lib/chain";
import { VIGIL_VAULT_ABI } from "@/lib/vigilVaultAbi";

// Capped well above the demo's instant threshold is pointless here — this is
// meant to demonstrate the fast path, not move real value, and it protects
// the public deployment from someone hammering it into a pile of queued junk.
const MAX_TEST_TRANSFER_WEI = BigInt("50000000000000000"); // 0.05 ETH

export async function POST(req: Request) {
  try {
    const { amountWei } = await req.json();
    let amount: bigint;
    try {
      amount = BigInt(amountWei);
    } catch {
      return NextResponse.json({ error: "amountWei must be an integer string" }, { status: 400 });
    }
    if (amount <= BigInt(0) || amount > MAX_TEST_TRANSFER_WEI) {
      return NextResponse.json({ error: "amountWei out of range for the public demo" }, { status: 400 });
    }

    const d = await getServerDeployment();
    if (!d.owner.privateKey) {
      return NextResponse.json({ error: "Owner signer is not configured for this deployment" }, { status: 503 });
    }

    const wallet = getWalletClientFor(d, d.owner.privateKey);
    const publicClient = getPublicClient(d);
    const hash = await wallet.writeContract({
      address: d.vault,
      abi: VIGIL_VAULT_ABI,
      functionName: "propose",
      args: [d.recipient.address, amount, "0x"],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({ hash });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Transfer failed" }, { status: 500 });
  }
}
