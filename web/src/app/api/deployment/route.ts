import { NextResponse } from "next/server";
import { getServerDeployment } from "@/lib/serverDeployment";
import { VIGIL_VAULT_ABI } from "@/lib/vigilVaultAbi";

export async function GET() {
  try {
    const d = await getServerDeployment();

    return NextResponse.json(
      {
        vault: d.vault,
        chainId: d.chainId,
        rpcUrl: d.rpcUrl,
        owner: { address: d.owner.address },
        guardian: { address: d.guardian.address },
        recipient: { address: d.recipient.address },
        abi: VIGIL_VAULT_ABI,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "No deployment found. Run demo/reset.sh (or demo/deploy.sh with a chain already running) from the vigil/ project root.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
