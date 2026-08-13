import { cn } from "@/lib/utils";

/**
 * The rank marker.
 *
 * The podium — 1st, 2nd, 3rd — gets a real metal disc (gold / silver / bronze)
 * with the metal named underneath, dropping in with a spring and a slow sheen
 * so the top of the board actually feels like a top of the board. Everyone
 * else gets a clean typeset numeral. Server component — the animation is pure
 * CSS, no JS.
 */
const PODIUM: Record<1 | 2 | 3, { ordinal: string; metal: string; disc: string; label: string }> = {
  1: {
    ordinal: "1st",
    metal: "Gold",
    disc: "bg-gradient-to-br from-brass-400 to-brass-600 text-paper-50 ring-brass-500/40",
    label: "text-brass-600",
  },
  2: {
    ordinal: "2nd",
    metal: "Silver",
    disc: "bg-gradient-to-br from-paper-300 to-paper-500 text-ink-700 ring-ink-900/15",
    label: "text-ink-500",
  },
  3: {
    ordinal: "3rd",
    metal: "Bronze",
    disc: "bg-gradient-to-br from-ember-400 to-ember-600 text-paper-50 ring-ember-500/40",
    label: "text-ember-600",
  },
};

export function RankMedal({
  rank,
  size = "md",
  index = 0,
}: {
  rank: number;
  size?: "sm" | "md";
  /** Stagger the drop-in so the podium cascades. */
  index?: number;
}) {
  const podium = rank <= 3 ? PODIUM[rank as 1 | 2 | 3] : null;

  if (podium) {
    const disc = size === "sm" ? "h-8 w-8 text-[13px]" : "h-9 w-9 text-[15px]";
    return (
      <span
        className="medal-in flex w-11 shrink-0 flex-col items-center gap-1"
        style={{ animationDelay: `${index * 90}ms` }}
      >
        <span
          className={cn(
            "medal-sheen figure relative grid place-items-center overflow-hidden rounded-full font-bold shadow-card ring-2",
            disc,
            podium.disc
          )}
        >
          {rank}
        </span>
        <span
          className={cn(
            "font-mono text-[8px] font-semibold uppercase leading-none tracking-[0.12em]",
            podium.label
          )}
        >
          {podium.metal}
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
