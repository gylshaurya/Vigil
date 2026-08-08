import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Repo root is one level above the `web` app.
const ROOT_DIR = path.join(process.cwd(), "..");

export async function GET() {
  try {
    const [deploymentRaw, artifactRaw] = await Promise.all([
      readFile(path.join(ROOT_DIR, "deployment.json"), "utf-8"),
      readFile(path.join(ROOT_DIR, "deployment.abi.json"), "utf-8"),
    ]);

    const deployment = JSON.parse(deploymentRaw);
    const artifact = JSON.parse(artifactRaw);

    // Demo private keys are Anvil's universally-known, publicly documented
    // local test keys — they hold no value and are never valid off a local
    // chain. As a guardrail against pointing this UI at a real network, only
    // serve them when the deployment is on the local Anvil chain id.
    const isLocalDemoChain = deployment.chainId === 31337;
    if (!isLocalDemoChain) {
      delete deployment.owner.privateKey;
      delete deployment.guardian.privateKey;
      delete deployment.attacker.privateKey;
      delete deployment.recipient.privateKey;
    }

    return NextResponse.json(
      { ...deployment, abi: artifact.abi },
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
