export function GuardBanner({ disabled }: { disabled: boolean }) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-critical/30 bg-critical-dim px-4 py-3">
        <span className="relative flex h-2.5 w-2.5 shrink-0 rounded-full bg-critical" />
        <div className="text-sm">
          <span className="font-semibold text-text-primary">Guard disabled.</span>{" "}
          <span className="text-text-secondary">Every transfer executes instantly — no delay, no veto.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-good/30 bg-good-dim px-4 py-3">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="pulse-good absolute inline-flex h-full w-full rounded-full bg-good" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-good" />
      </span>
      <div className="text-sm">
        <span className="font-semibold text-text-primary">Guard active.</span>{" "}
        <span className="text-text-secondary">Large transfers and policy changes are delayed and vetoable.</span>
      </div>
    </div>
  );
}
