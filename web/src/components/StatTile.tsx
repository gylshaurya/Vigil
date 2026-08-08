import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  unit,
  sub,
  accent = "default",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  accent?: "default" | "good" | "warning" | "critical";
}) {
  const ring =
    accent === "good"
      ? "ring-good/25"
      : accent === "warning"
        ? "ring-warning/25"
        : accent === "critical"
          ? "ring-critical/25"
          : "ring-border";

  return (
    <div className={`card ring-1 ${ring} p-5`}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5 font-tabular">
        <span className="text-[28px] font-semibold leading-none text-text-primary">{value}</span>
        {unit && <span className="text-sm font-medium text-text-secondary">{unit}</span>}
      </div>
      {sub && <div className="mt-2 text-xs text-text-secondary">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ fraction, accent = "default" }: { fraction: number; accent?: "default" | "good" | "warning" | "critical" }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  const color =
    accent === "good" ? "bg-good" : accent === "warning" ? "bg-warning" : accent === "critical" ? "bg-critical" : "bg-brand";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div className={`h-full rounded-full ${color} transition-[width] duration-500 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
}
