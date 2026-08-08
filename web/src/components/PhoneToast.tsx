"use client";

export type PhoneAlert = { id: string; title: string; body: string };

export function PhoneToastStack({ alerts, onDismiss }: { alerts: PhoneAlert[]; onDismiss: (id: string) => void }) {
  if (alerts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end">
      {alerts.map((a) => (
        <div
          key={a.id}
          className="animate-buzz pointer-events-auto w-full max-w-sm rounded-2xl border border-border-strong bg-surface-2/95 p-4 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none">📱</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-text-primary">{a.title}</p>
                <button
                  onClick={() => onDismiss(a.id)}
                  className="shrink-0 text-text-muted transition hover:text-text-primary"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-text-secondary">{a.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
