"use client";

async function postJson(url: string, body: unknown): Promise<{ hash: `0x${string}` }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? `Request to ${url} failed`);
  }
  return json;
}

export async function vetoAction(actionId: number): Promise<`0x${string}`> {
  const { hash } = await postJson("/api/veto", { actionId });
  return hash;
}

export async function executeReadyAction(actionId: number): Promise<`0x${string}`> {
  const { hash } = await postJson("/api/execute", { actionId });
  return hash;
}

export async function sendTestTransfer(amountWei: bigint): Promise<`0x${string}`> {
  const { hash } = await postJson("/api/test-transfer", { amountWei: amountWei.toString() });
  return hash;
}
