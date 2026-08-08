"use client";

import { useEffect, useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { GuardBanner } from "@/components/GuardBanner";
import { StatTile, ProgressBar } from "@/components/StatTile";
import { PendingActionCard } from "@/components/PendingActionCard";
import { PhoneToastStack, type PhoneAlert } from "@/components/PhoneToast";
import { useDeployment } from "@/lib/useDeployment";
import { useVaultState } from "@/lib/useVaultState";
import { formatEth, formatDuration, shortAddr, isGuardDisabled } from "@/lib/chain";
import { vetoAction, executeReadyAction, sendTestTransfer } from "@/lib/actions";
import { describeAction } from "@/lib/describe";

export default function Dashboard() {
  const { deployment, error: deploymentError, loading } = useDeployment();
  const { state, error: stateError, refresh } = useVaultState(deployment);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PhoneAlert[]>([]);
  const seenIds = useRef<Set<number>>(new Set());
  const [testAmount, setTestAmount] = useState("0.01");

  useEffect(() => {
    if (!state || !deployment) return;
    const pending = state.actions.filter((a) => !a.executed && !a.vetoed);
    for (const a of pending) {
      if (seenIds.current.has(a.id)) continue;
      seenIds.current.add(a.id);
      const { title, detail } = describeAction(deployment, a);
      setAlerts((prev) => [
        ...prev,
        {
          id: `${a.id}-${Date.now()}`,
          title: `Vigil: action #${a.id} queued`,
          body: `${title} — ${detail}. Ready in ${formatDuration(a.readyAt - Math.floor(Date.now() / 1000))}.`,
        },
      ]);
    }
  }, [state, deployment]);

  // Prime seenIds on first successful load so we don't alert on history.
  const primed = useRef(false);
  useEffect(() => {
    if (state && !primed.current) {
      primed.current = true;
      seenIds.current = new Set(state.actions.filter((a) => !a.executed && !a.vetoed).map((a) => a.id));
    }
  }, [state]);

  async function handleVeto(id: number) {
    if (!deployment) return;
    setBusyId(id);
    setActionError(null);
    try {
      await vetoAction(deployment, id);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Veto failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleExecute(id: number) {
    if (!deployment) return;
    setBusyId(id);
    setActionError(null);
    try {
      await executeReadyAction(deployment, id);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleTestTransfer() {
    if (!deployment) return;
    setBusyId(-1);
    setActionError(null);
    try {
      const wei = BigInt(Math.round(Number(testAmount) * 1e18));
      await sendTestTransfer(deployment, wei);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setBusyId(null);
    }
  }

  const pendingActions = state?.actions.filter((a) => !a.executed && !a.vetoed) ?? [];
  const resolvedActions = state?.actions.filter((a) => a.executed || a.vetoed) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <PhoneToastStack alerts={alerts} onDismiss={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Live vault dashboard</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {deployment ? (
                <>
                  Vault <span className="font-mono text-text-primary">{shortAddr(deployment.vault)}</span> on{" "}
                  {deployment.chainId === 31337 ? "the local demo chain" : `chain ${deployment.chainId}`}
                </>
              ) : (
                "Connecting…"
              )}
            </p>
          </div>
        </div>

        {loading && <p className="text-sm text-text-secondary">Loading deployment…</p>}
        {deploymentError && (
          <div className="card border-critical/30 p-5 text-sm text-critical">{deploymentError}</div>
        )}
        {stateError && !deploymentError && (
          <div className="card border-critical/30 p-5 text-sm text-critical">{stateError}</div>
        )}

        {deployment && state && (
          <div className="flex flex-col gap-8">
            <GuardBanner disabled={isGuardDisabled(state.instantThreshold)} />

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile label="Vault balance" value={formatEth(state.balance)} unit="ETH" accent="good" />
              <StatTile
                label="Instant threshold"
                value={isGuardDisabled(state.instantThreshold) ? "∞" : formatEth(state.instantThreshold)}
                unit={isGuardDisabled(state.instantThreshold) ? undefined : "ETH"}
                sub="below this + plain ETH = instant"
              />
              <StatTile label="Delay" value={formatDuration(Number(state.delay))} sub="for anything queued" />
              <StatTile
                label="Rolling window"
                value={formatEth(state.rollingWindowRemaining)}
                unit="ETH left"
                sub={
                  <div className="mt-1">
                    <ProgressBar
                      fraction={
                        Number(state.rollingWindowLimit) === 0
                          ? 0
                          : Number(state.rollingWindowSpent) / Number(state.rollingWindowLimit)
                      }
                      accent="warning"
                    />
                    <span className="mt-1.5 block">
                      {formatEth(state.rollingWindowSpent)} / {formatEth(state.rollingWindowLimit)} ETH ·{" "}
                      {formatDuration(Number(state.rollingWindowDuration))} window
                    </span>
                  </div>
                }
              />
            </section>

            {actionError && (
              <div className="rounded-xl border border-critical/30 bg-critical-dim px-4 py-3 text-sm text-critical">
                {actionError}
              </div>
            )}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Pending actions {pendingActions.length > 0 && `(${pendingActions.length})`}
                </h2>
              </div>
              {pendingActions.length === 0 ? (
                <div className="card border-dashed p-8 text-center text-sm text-text-secondary">
                  Nothing queued. Run <code className="font-mono text-text-primary">demo/attack.sh</code> from a
                  terminal to see the circuit breaker in action.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingActions.map((a) => (
                    <PendingActionCard
                      key={a.id}
                      deployment={deployment}
                      action={a}
                      onVeto={handleVeto}
                      onExecute={handleExecute}
                      busy={busyId === a.id}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-text-primary">Send a test transfer</h2>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Signs with the owner&rsquo;s demo key — proves the wallet still works for routine use.
                </p>
                <div className="mt-3 flex gap-2">
                  <div className="flex flex-1 items-center rounded-lg border border-border bg-white/[0.03] px-3">
                    <input
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full bg-transparent py-2.5 text-sm text-text-primary outline-none"
                      inputMode="decimal"
                    />
                    <span className="text-xs text-text-muted">ETH</span>
                  </div>
                  <button
                    onClick={handleTestTransfer}
                    disabled={busyId === -1}
                    className="rounded-lg bg-text-primary px-4 py-2.5 text-[13px] font-semibold text-bg transition hover:opacity-85 disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-text-muted">
                  to {deployment.recipient.address ? shortAddr(deployment.recipient.address) : "recipient"} · instant if under the threshold and inside the window
                </p>
              </div>

              <div className="card p-5">
                <h2 className="text-sm font-semibold text-text-primary">Run the attack</h2>
                <p className="mt-1 text-[13px] text-text-secondary">From a second terminal, at the repo root:</p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-[12px] text-text-secondary">
                  demo/attack.sh
                </pre>
                <p className="mt-2 text-[11px] text-text-muted">
                  Uses the owner&rsquo;s key to try to drain the vault and disable the guard. Both attempts land here as
                  pending actions for you to veto.
                </p>
              </div>
            </section>

            {resolvedActions.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">History</h2>
                <div className="flex flex-col gap-3 opacity-70">
                  {resolvedActions.map((a) => (
                    <PendingActionCard
                      key={a.id}
                      deployment={deployment}
                      action={a}
                      onVeto={handleVeto}
                      onExecute={handleExecute}
                      busy={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
