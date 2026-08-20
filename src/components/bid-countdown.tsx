"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The 24-hour clock on a bid, ticking down live. This is the FOMO engine —
 * "expires in 3h 41m" turns a static row into a deadline. Under an hour it
 * counts seconds and turns ember; when it's gone it says so.
 */
export function BidCountdown({ expiresAt, className }: { expiresAt: string | null; className?: string }) {
  const target = expiresAt ? new Date(expiresAt).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!target) return null;
  const left = target - now;

  if (left <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-ink-400", className)}>
        <Clock className="h-3 w-3" /> expired
      </span>
    );
  }

  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const urgent = left < 3_600_000; // under an hour

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        urgent ? "text-ember-600" : "text-ink-400",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      {h > 0 ? `${h}h ${m}m left` : `${m}m ${s.toString().padStart(2, "0")}s left`}
    </span>
  );
}
