export type DemoAccount = {
  address: `0x${string}`;
  privateKey: `0x${string}`;
};

export type Deployment = {
  vault: `0x${string}`;
  chainId: number;
  rpcUrl: string;
  owner: DemoAccount;
  guardian: DemoAccount;
  attacker: DemoAccount;
  recipient: DemoAccount;
  policy: {
    instantThresholdWei: string;
    delaySeconds: number;
    rollingWindowDurationSeconds: number;
    rollingWindowLimitWei: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any[];
};
