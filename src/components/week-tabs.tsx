import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  currentWeekKey,
  isCurrentWeek,
  isFutureWeek,
  isPreLaunchWeek,
  shiftWeek,
  weekLabel,
  weekWindow,
} from "@/lib/week";

/**
 * The week strip.
 *
 * Labels are the platform's own week numbers (Week 1, Week 2 …), never ISO
 * week numbers — nobody arriving at a new board should read "Week 33". Weeks
 * before launch aren't offered at all, and the week ahead is visible but not
 * linkable, because you can't vote in a week that hasn't started.
 */
export function WeekTabs({ week, basePath = "/" }: { week: string; basePath?: string }) {
  const weeks = weekWindow(week, 3, 1);
  const href = (w: string) => (w === currentWeekKey() ? basePath : `${basePath}?w=${w}`);

  const previous = shiftWeek(week, -1);
  const next = shiftWeek(week, 1);
  const canGoBack = !isPreLaunchWeek(previous);
  const canGoForward = !isFutureWeek(next);

  const arrow =
    "grid h-7 w-7 shrink-0 place-items-center rounded-[2px] transition";

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-3 py-2.5 sm:px-4">
      {canGoBack ? (
        <Link
          href={href(previous)}
          aria-label="Previous week"
          className={cn(arrow, "text-ink-400 hover:bg-paper-300 hover:text-ink-900")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(arrow, "text-ink-400/30")}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {weeks.map((w) => {
        const active = w === week;
        const future = isFutureWeek(w);

        if (future) {
          return (
            <span
              key={w}
              title="This week hasn't started yet"
              className="shrink-0 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400/50"
            >
              {weekLabel(w)}
            </span>
          );
        }

        return (
          <Link
            key={w}
            href={href(w)}
            className={cn(
              "shrink-0 rounded-[2px] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition",
              active
                ? "bg-ink-900 text-paper-100"
                : "text-ink-500 hover:bg-paper-300 hover:text-ink-900"
            )}
          >
            {weekLabel(w)}
            {isCurrentWeek(w) && !active && (
              <span className="ml-1.5 inline-block h-1 w-1 rounded-full bg-moss-500 align-middle" />
            )}
          </Link>
        );
      })}

      {canGoForward ? (
        <Link
          href={href(next)}
          aria-label="Next week"
          className={cn(arrow, "text-ink-400 hover:bg-paper-300 hover:text-ink-900")}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(arrow, "text-ink-400/30")}>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
