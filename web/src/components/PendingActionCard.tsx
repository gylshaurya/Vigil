"use client";

import { useEffect, useState } from "react";
import type { Deployment } from "@/lib/deployment";
import type { VaultAction } from "@/lib/useVaultState";
import { formatDuration, shortAddr, shortHex } from "@/lib/chain";
import { describeAction } from "@/lib/describe";

export function PendingActionCard({
  deployment,
  action,
  onVeto,
  onExecute,
  busy,
}: {
  deployment: Deployment;
  action: VaultAction;
  onVeto: (id: number) => void;
  onExecute: (id: number) => void;
  busy: boolean;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const { title, detail, kind } = describeAction(deployment, action);
  const remaining = action.readyAt - now;
  const isReady = remaining <= 0;

  let statusLabel: string;
  let statusClass: string;
  if (action.vetoed) {
    statusLabel = "Vetoed";
    statusClass = "border-critical/30 bg-critical-dim text-critical";
  } else if (action.executed) {
    statusLabel = "Executed";
    statusClass = "border-border bg-white/[0.04] text-text-secondary";
  } else if (isReady) {
    statusLabel = "Ready — awaiting execution";
    statusClass = "border-warning/30 bg-warning-dim text-warning";
  } else {
    statusLabel = `Delayed · ${formatDuration(remaining)} left`;
    statusClass = "border-warning/30 bg-warning-dim text-warning";
  }

  const isLive = !action.executed && !action.vetoed;
  const kindIcon = kind === "config" ? "⚙" : kind === "call" ? "◇" : "→";

  return (
    <div className={`card p-5 transition ${isLive && !isReady ? "ring-1 ring-warning/20" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-xs text-text-secondary">
              {kindIcon}
            </span>
            <span className="font-mono text-[11px] text-text-muted">#{action.id}</span>
            <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
          </div>
          <p className="mt-1 pl-8 text-[13px] text-text-secondary">{detail}</p>
          <p className="mt-1 pl-8 font-mono text-[11px] text-text-muted">
            proposer {shortAddr(action.proposer)} · data {shortHex(action.data)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {isLive && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
          {isReady && (
            <button
              onClick={() => onExecute(action.id)}
              disabled={busy}
              className="rounded-full border border-border px-4 py-2 text-[13px] font-medium text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:opacity-40"
            >
              Execute
            </button>
          )}
          <button
            onClick={() => onVeto(action.id)}
            disabled={busy}
            className="rounded-full bg-critical px-5 py-2 text-[13px] font-bold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          >
            VETO
          </button>
        </div>
      )}
    </div>
  );
}
