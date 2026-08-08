import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Server only: this is the one place private keys are allowed to exist. On a
// hosted deployment (Vercel) these come from environment variables set in the
// project settings. For local development, when VAULT_ADDRESS isn't set, it
// falls back to reading deployment.json, the file demo/deploy.sh writes.
export type ServerAccount = {
  address: `0x${string}`;
  privateKey?: `0x${string}`;
};

export type ServerDeployment = {
  vault: `0x${string}`;
  chainId: number;
  rpcUrl: string;
  owner: ServerAccount;
  guardian: ServerAccount;
  recipient: ServerAccount;
};

export async function getServerDeployment(): Promise<ServerDeployment> {
  if (process.env.VAULT_ADDRESS) {
    return {
      vault: process.env.VAULT_ADDRESS as `0x${string}`,
      chainId: Number(process.env.CHAIN_ID ?? "11155111"),
      rpcUrl: process.env.RPC_URL ?? "",
      owner: {
        address: process.env.OWNER_ADDRESS as `0x${string}`,
        privateKey: process.env.OWNER_PRIVATE_KEY as `0x${string}` | undefined,
      },
      guardian: {
        address: process.env.GUARDIAN_ADDRESS as `0x${string}`,
        privateKey: process.env.GUARDIAN_PRIVATE_KEY as `0x${string}` | undefined,
      },
      recipient: {
        address: process.env.RECIPIENT_ADDRESS as `0x${string}`,
      },
    };
  }

  const rootDir = path.join(process.cwd(), "..");
  const raw = await readFile(path.join(rootDir, "deployment.json"), "utf-8");
  const d = JSON.parse(raw);
  return {
    vault: d.vault,
    chainId: d.chainId,
    rpcUrl: d.rpcUrl,
    owner: d.owner,
    guardian: d.guardian,
    recipient: d.recipient,
  };
}
