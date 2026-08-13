import { cn } from "@/lib/utils";

/**
 * The rank marker.
 *
 * The podium — 1st, 2nd, 3rd — gets the medal it earned and the place named
 * under it (First in gold, Second in silver, Third in bronze), dropping in with
 * a small spring. Everyone else gets a clean typeset numeral. Server component:
 * the animation is pure CSS.
 */
const PODIUM: Record<1 | 2 | 3, { emoji: string; ordinal: string; label: string }> = {
  1: { emoji: "🥇", ordinal: "First", label: "text-brass-600" },
  2: { emoji: "🥈", ordinal: "Second", label: "text-ink-500" },
  3: { emoji: "🥉", ordinal: "Third", label: "text-ember-600" },
};

export function RankMedal({
  rank,
  size = "md",
  index = 0,
}: {
  rank: number;
  size?: "sm" | "md";
  index?: number;
}) {
  const podium = rank <= 3 ? PODIUM[rank as 1 | 2 | 3] : null;

  if (podium) {
    const emoji = size === "sm" ? "text-xl" : "text-[26px]";
    return (
      <span
        className="medal-in flex w-11 shrink-0 flex-col items-center gap-0.5"
        style={{ animationDelay: `${index * 90}ms` }}
      >
        <span className={cn("leading-none", emoji)} aria-hidden>
          {podium.emoji}
        </span>
        <span
          className={cn(
            "font-mono text-[8px] font-semibold uppercase leading-none tracking-[0.1em]",
            podium.label
          )}
        >
          {podium.ordinal}
        </span>
      </span>
    );
  }

  return (
    <span className="figure w-11 shrink-0 text-center text-[15px] font-semibold text-ink-400">
      {rank}
    </span>
  );
}
