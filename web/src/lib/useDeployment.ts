"use client";

import { useEffect, useState } from "react";
import type { Deployment } from "./deployment";

export function useDeployment() {
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/deployment", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Failed to load deployment");
          setDeployment(null);
        } else {
          setDeployment(json as Deployment);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load deployment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    queueMicrotask(load);
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { deployment, error, loading };
}
