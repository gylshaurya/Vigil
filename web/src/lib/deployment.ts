import type { Abi } from "viem";

// What the browser is allowed to know: addresses, not private keys. Signing
// happens server side, through the /api/veto, /api/execute, and
// /api/test-transfer routes.
export type PublicAccount = {
  address: `0x${string}`;
};

export type Deployment = {
  vault: `0x${string}`;
  chainId: number;
  rpcUrl: string;
  owner: PublicAccount;
  guardian: PublicAccount;
  recipient: PublicAccount;
  abi: Abi;
};
