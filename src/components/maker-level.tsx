import { Flame, Star, Trophy, Rocket, Crown, Sprout } from "lucide-react";
import { LEVELS, levelFor, streakLabel } from "@/lib/premium";
import { cn } from "@/lib/utils";

/**
 * A maker's standing, made to feel earned.
 *
 * The old version was a hairline brass bar under two lines of 10px mono — it
 * read as a loading state, not an achievement. This gives each tier its own
 * medal, colour and icon, a real progress track, and the streak as a live
 * flame, so the profile has something worth screenshotting.
 */

type Tier = {
  icon: React.ReactNode;
  /** Medal gradient. */
  from: string;
  to: string;
  /** Text + accent on the light chip. */
  ink: string;
  ring: string;
};

const TIERS: Record<string, Tier> = {
  Newcomer: {
    icon: <Sprout className="h-5 w-5" />,
    from: "#9aa0aa",
    to: "#c2c6ce",
    ink: "text-ink-500",
    ring: "ring-ink-900/10",
  },
  Shipper: {
    icon: <Rocket className="h-5 w-5" />,
    from: "#2f7a4f",
    to: "#5fbd86",
    ink: "text-moss-600",
    ring: "ring-moss-500/25",
  },
  Regular: {
    icon: <Star className="h-5 w-5" />,
    from: "#2563c9",
    to: "#63a4f5",
    ink: "text-[#2563c9]",
    ring: "ring-[#2563c9]/25",
  },
  Veteran: {
    icon: <Trophy className="h-5 w-5" />,
    from: "#94701f",
    to: "#e3c069",
    ink: "text-brass-600",
    ring: "ring-brass-500/30",
  },
  "Register Keeper": {
    icon: <Crown className="h-5 w-5" />,
    from: "#c2410c",
    to: "#fb8b3d",
    ink: "text-ember-600",
    ring: "ring-ember-500/30",
  },
};

export function MakerLevel({
  reputation,
  streakWeeks,
  className,
}: {
  reputation: number;
  streakWeeks: number;
  className?: string;
}) {
  const { level, next, progress } = levelFor(reputation);
  const tier = TIERS[level.name] || TIERS.Newcomer;
  const tierIndex = LEVELS.findIndex((l) => l.name === level.name);
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-900/10 bg-paper-100 p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* the medal */}
        <span
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-card ring-4",
            tier.ring
          )}
          style={{ background: `linear-gradient(140deg, ${tier.from}, ${tier.to})` }}
        >
          {tier.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="font-serif text-xl font-semibold text-ink-900">{level.name}</p>
            <span
              className={cn(
                "rounded-full bg-paper-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
                tier.ink
              )}
            >
              Tier {tierIndex + 1} of {LEVELS.length}
            </span>
            {streakWeeks > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ember-500/10 px-2 py-0.5 text-[11px] font-semibold text-ember-600">
                <Flame className="h-3 w-3" />
                {streakWeeks}w streak
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{level.blurb}</p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="figure text-2xl font-semibold text-ink-900">{reputation}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">points</p>
        </div>
      </div>

      {/* the track */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-[12px] font-medium text-ink-600">
            {next ? `${next.min - reputation} points to ${next.name}` : "Top tier reached"}
          </span>
          <span className="font-mono text-[11px] text-ink-400">{pct}%</span>
        </div>
        <span className="block h-2.5 w-full overflow-hidden rounded-full bg-paper-300">
          <span
            className="block h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(pct, 3)}%`,
              background: `linear-gradient(90deg, ${tier.from}, ${tier.to})`,
            }}
          />
        </span>
        {!streakWeeks && (
          <p className="mt-2 text-[11.5px] text-ink-400">
            {streakLabel(streakWeeks)} — launch this week to start one.
          </p>
        )}
      </div>

      {/* the ladder */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-ink-900/8 pt-3.5">
        {LEVELS.map((l, i) => {
          const reached = i <= tierIndex;
          const t = TIERS[l.name] || TIERS.Newcomer;
          return (
            <span
              key={l.name}
              title={`${l.name} · ${l.min} points`}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                reached ? "" : "bg-paper-300"
              )}
              style={
                reached ? { background: `linear-gradient(90deg, ${t.from}, ${t.to})` } : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
