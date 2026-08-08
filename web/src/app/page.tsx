import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Small transfers, instant",
    body: "A plain ETH send under the threshold — or to an allowlisted address — executes in the same transaction. The wallet still feels normal for everyday use.",
    accent: "good" as const,
  },
  {
    n: "02",
    title: "Everything else, queued",
    body: "Large transfers, contract calls, and anything that touches the vault's own policy wait behind a delay and emit an event a phone can subscribe to.",
    accent: "warning" as const,
  },
  {
    n: "03",
    title: "A second key can veto",
    body: "The guardian key can cancel any queued action before it executes. It can never move funds itself — only stop them from moving.",
    accent: "critical" as const,
  },
  {
    n: "04",
    title: "The off-switch is delayed too",
    body: "Disabling the guard, changing the threshold, swapping the guardian — all of it only happens by the vault calling itself, which only happens through the same queue.",
    accent: "brand" as const,
  },
];

const FEATURES = [
  {
    title: "Instant threshold",
    body: "Set the line between “normal” and “worth a second look.” Below it, transfers clear in one block.",
  },
  {
    title: "Allowlist bypass",
    body: "Recipients you already trust — your cold wallet, a known exchange address — skip the delay entirely.",
  },
  {
    title: "Rolling-window limit",
    body: "A cumulative cap over a rolling period closes the obvious hole: splitting a big transfer into many small ones.",
  },
  {
    title: "Recursive self-governance",
    body: "Policy changes are proposals too. Turning the guard off can't be a shortcut around the guard.",
  },
  {
    title: "Permissionless execution",
    body: "Anyone can trigger a ready, unvetoed action — no single relayer has to be online, or can be pressured to withhold it.",
  },
  {
    title: "Two keys, one purpose",
    body: "The owner proposes, the guardian can only cancel. Neither key alone can both move funds and silence the other.",
  },
];

const TRACKS = [
  {
    name: "Self-Sovereignty",
    role: "Primary",
    body: "A smart-account wallet where a compromised everyday key is not the same as a compromised vault — instant UX for routine spending, hard stops for everything else.",
  },
  {
    name: "Coordination Layers",
    role: "Secondary",
    body: "Owner and guardian are a minimal trustless two-party protocol: neither can unilaterally move funds outside the agreed policy, and the policy can only evolve through the rules it enforces on everyone else.",
  },
  {
    name: "Censorship Resistance",
    role: "Secondary",
    body: "Execution is permissionless once an action is ready and unvetoed — no single relayer or keeper can be coerced into withholding a legitimate, already-approved transfer.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary">
            <span className="pulse-good relative inline-flex h-1.5 w-1.5 rounded-full bg-good" />
            Live on a local demo chain — give it your key and try to break it
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Give an attacker your <span className="text-gradient">private key.</span>
            <br />
            Watch them fail to steal anything.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-[17px] leading-relaxed text-text-secondary">
            Vigil is a circuit breaker for your wallet. Small transfers go through instantly.
            Anything large is queued for a delay and pings a second key — and even the request to
            turn the guard off has to survive that same delay.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-text-primary px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-85"
            >
              Open the live dashboard
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-primary transition hover:border-border-strong"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-2">The problem</h2>
        <p className="mt-4 text-balance text-2xl font-medium leading-snug tracking-tight text-text-primary">
          A hot wallet is a single point of failure. One phished signature, one malicious
          approval, and everything it controls is gone.
        </p>
        <p className="mt-4 text-balance text-[15px] leading-relaxed text-text-secondary">
          Multisigs fix this by needing co-signers online for every tap — too much friction for
          daily spending. A blanket time-lock on all transactions fixes it too, and nobody runs
          one, because it makes the wallet unusable. Both trade the protection away in practice.
        </p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-bg-plane">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-2">How it works</h2>
            <p className="mt-3 text-balance text-3xl font-semibold tracking-tight">
              One policy engine in front of every outgoing call
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} className="card p-6">
                <span
                  className={`font-mono text-xs font-semibold ${
                    step.accent === "good"
                      ? "text-good"
                      : step.accent === "warning"
                        ? "text-warning"
                        : step.accent === "critical"
                          ? "text-critical"
                          : "text-brand-2"
                  }`}
                >
                  {step.n}
                </span>
                <h3 className="mt-3 text-[15px] font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-2">Architecture</h2>
            <p className="mt-3 text-balance text-3xl font-semibold tracking-tight">
              The interesting part is the loop back into itself
            </p>
          </div>
          <div className="card overflow-x-auto p-6 sm:p-10">
            <ArchitectureDiagram />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-bg-plane">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-2">The policy engine</h2>
            <p className="mt-3 text-balance text-3xl font-semibold tracking-tight">
              Six primitives, one contract
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <h3 className="text-[15px] font-semibold text-text-primary">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-2">The demo</h2>
            <p className="mt-3 text-balance text-3xl font-semibold tracking-tight">
              Try to drain it. We&rsquo;ll wait.
            </p>
          </div>
          <ol className="flex flex-col gap-4">
            {[
              ["Send a normal test transfer", "$10-equivalent, using the owner's key. Lands instantly — the wallet still works."],
              ["Try to take everything", "Propose a transfer of the full balance. It doesn't move — it's queued, and the guardian's phone lights up."],
              ["Try to just turn the guard off", "disableGuard() is a self-targeted action too. Same delay, same veto, no shortcut."],
              ["Hit VETO", "From the dashboard, in real time. The delay elapses. Neither action can ever execute."],
            ].map(([title, body], i) => (
              <li key={title} className="card flex gap-4 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-sm font-semibold text-text-secondary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <pre className="overflow-x-auto rounded-lg border border-border bg-black/40 px-4 py-3 font-mono text-[13px] text-text-secondary">
              demo/attack.sh
            </pre>
            <Link href="/dashboard" className="text-sm font-semibold text-brand-2 hover:underline">
              Watch it live on the dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="border-t border-border bg-bg-plane">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-2">Tracks</h2>
            <p className="mt-3 text-balance text-3xl font-semibold tracking-tight">Submitted across three</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {TRACKS.map((t) => (
              <div key={t.name} className="card p-6">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    t.role === "Primary" ? "bg-brand/15 text-brand-2" : "bg-white/[0.06] text-text-secondary"
                  }`}
                >
                  {t.role}
                </span>
                <h3 className="mt-3 text-[15px] font-semibold text-text-primary">{t.name}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
