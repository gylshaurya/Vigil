import { NextResponse } from "next/server";
import { getServerDeployment } from "@/lib/serverDeployment";
import { getPublicClient, getWalletClientFor } from "@/lib/chain";
import { VIGIL_VAULT_ABI } from "@/lib/vigilVaultAbi";

// executeAction has no access control on the contract itself, so this route
// grants no privilege beyond what anyone could already do with any funded
// account. It exists so the dashboard's Execute button doesn't need its own
// wallet connection.
export async function POST(req: Request) {
  try {
    const { actionId } = await req.json();
    if (typeof actionId !== "number" || !Number.isInteger(actionId) || actionId < 1) {
      return NextResponse.json({ error: "actionId must be a positive integer" }, { status: 400 });
    }

    const d = await getServerDeployment();
    if (!d.guardian.privateKey) {
      return NextResponse.json({ error: "No signer configured for this deployment" }, { status: 503 });
    }

    const wallet = getWalletClientFor(d, d.guardian.privateKey);
    const publicClient = getPublicClient(d);
    const hash = await wallet.writeContract({
      address: d.vault,
      abi: VIGIL_VAULT_ABI,
      functionName: "executeAction",
      args: [BigInt(actionId)],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({ hash });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Execution failed" }, { status: 500 });
  }
}
