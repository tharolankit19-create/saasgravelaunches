"use client";

import { useEffect, useState } from "react";
import { countdownLabel, msUntilWeekEnd } from "@/lib/week";

/**
 * Time left in the current week's board.
 *
 * Rendered empty on the server and filled in after mount — a server-rendered
 * countdown is wrong by the time it reaches the browser, and hydrating a
 * different string than the server sent is a React error.
 */
export function Countdown({ className }: { className?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(countdownLabel(msUntilWeekEnd()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className} suppressHydrationWarning>
      {label ?? "—"}
    </span>
  );
}
