"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * Keeps a buyer's status page live without a page reload. It re-runs the
 * server render every 25s (and on a manual tap), so `live_note` and the step
 * update themselves while the buyer watches. Stops polling once the order is
 * done — there's nothing left to change.
 */
export function OrderLiveRefresh({ done }: { done?: boolean }) {
  const router = useRouter();
  const [ticking, setTicking] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => router.refresh(), 25000);
    return () => clearInterval(id);
  }, [router, done]);

  return (
    <button
      type="button"
      onClick={() => {
        setTicking(true);
        router.refresh();
        setTimeout(() => setTicking(false), 700);
      }}
      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400 transition hover:text-ember-600"
    >
      <RefreshCw className={`h-3 w-3 ${ticking ? "animate-spin" : ""}`} />
      {done ? "Up to date" : "Live · refreshes automatically"}
    </button>
  );
}
