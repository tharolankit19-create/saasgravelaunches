import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentWeekKey, isCurrentWeek, isFutureWeek, shiftWeek, weekLabel, weekWindow } from "@/lib/week";

/**
 * The week strip. Future weeks are shown but not linkable — you can see the
 * board is about to turn over, you just can't vote in a week that hasn't
 * started.
 */
export function WeekTabs({ week, basePath = "/" }: { week: string; basePath?: string }) {
  const weeks = weekWindow(week, 3, 1);
  const href = (w: string) => (w === currentWeekKey() ? basePath : `${basePath}?w=${w}`);

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-2 py-3 sm:px-4">
      <Link
        href={href(shiftWeek(week, -1))}
        aria-label="Previous week"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-200 hover:text-ink-900"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {weeks.map((w) => {
        const active = w === week;
        const future = isFutureWeek(w);

        if (future) {
          return (
            <span
              key={w}
              title="This week hasn't started yet"
              className="shrink-0 rounded-lg px-3.5 py-1.5 text-sm text-ink-400/60"
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
              "shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
              active
                ? "bg-ink-900 text-white shadow-card"
                : "text-ink-500 hover:bg-paper-200 hover:text-ink-900"
            )}
          >
            {weekLabel(w)}
            {isCurrentWeek(w) && !active && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-signal-500 align-middle" />
            )}
          </Link>
        );
      })}

      {!isFutureWeek(shiftWeek(week, 1)) ? (
        <Link
          href={href(shiftWeek(week, 1))}
          aria-label="Next week"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-200 hover:text-ink-900"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="grid h-8 w-8 shrink-0 place-items-center text-ink-400/40">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
