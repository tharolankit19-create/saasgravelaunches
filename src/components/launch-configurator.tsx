"use client";

import { Check, Crown, Loader2, Sparkles, X, Zap } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  DIRECTORY_ADDONS,
  LAUNCH_TIERS,
  resolveSelection,
  type AddonKey,
  type TierKey,
} from "@/lib/launch-options";

/**
 * The configure-launch step — the last screen before a launch goes up.
 *
 * This is the one moment a founder is fully committed: the listing is written,
 * the week is chosen, and the only question left is how loudly it lands. So the
 * paid options are presented properly here rather than buried on /pricing.
 *
 * What it will NOT do: block the free path. "Standard — Free" is pre-selected,
 * the free button is a full-width primary action, and nothing here redirects to
 * a paywall. Everything paid is opt-in, priced from the one catalogue, and
 * described with perks we actually deliver — the scarcity lines are real slot
 * counts, not invented urgency.
 */
export function LaunchConfigurator({
  open,
  weekLabel,
  weekRange,
  productName,
  featuredOpen,
  publishing,
  tier,
  addon,
  onTier,
  onAddon,
  onContinue,
  onClose,
}: {
  open: boolean;
  weekLabel: string;
  weekRange: string;
  productName: string;
  /** Real Featured slots left in the chosen week — `null` when unknown. */
  featuredOpen: number | null;
  publishing: boolean;
  tier: TierKey;
  addon: AddonKey;
  onTier: (t: TierKey) => void;
  onAddon: (a: AddonKey) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const { total, featuredIncluded } = resolveSelection(tier, addon);
  const paying = total > 0;
  const featuredSoldOut = featuredOpen !== null && featuredOpen <= 0;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink-900/50 p-3 backdrop-blur-sm sm:p-6">
      <Card className="my-4 w-full max-w-3xl overflow-hidden shadow-lift">
        {/* ── header ── */}
        <div className="flex items-start gap-3 border-b border-ink-900/10 bg-paper-200/50 px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember-600">
              Last step
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold text-ink-900 sm:text-2xl">
              Configure your launch
            </h2>
            <p className="mt-1 truncate text-[13px] text-ink-500">
              <span className="font-semibold text-ink-700">{productName || "Your product"}</span> ·{" "}
              {weekLabel}
              {weekRange ? ` · ${weekRange}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink-400 transition hover:bg-paper-300/60 hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {/* ── launch type ── */}
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
            How it lands
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {LAUNCH_TIERS.map((t) => {
              // A directory package already contains the Featured week, so the
              // Featured card reads as included rather than selectable.
              const included = t.key === "featured" && featuredIncluded;
              const active = included || (!featuredIncluded && tier === t.key);
              const disabled = t.key === "featured" && featuredSoldOut && !included;
              return (
                <button
                  key={t.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => !included && onTier(t.key)}
                  className={cn(
                    "relative rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-ember-500/60 bg-ember-500/[0.05] ring-2 ring-ember-500/25"
                      : disabled
                        ? "cursor-not-allowed border-ink-900/10 bg-paper-200/40 opacity-60"
                        : "border-ink-900/12 bg-paper-100 hover:border-ember-500/40 hover:shadow-card"
                  )}
                >
                  {t.key === "featured" && !disabled && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-ember-500 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-paper-100">
                      {included ? "Included" : "Most picked"}
                    </span>
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[15px] font-bold text-ink-900">
                      {t.key === "featured" && <Crown className="h-4 w-4 text-brass-500" />}
                      {t.name}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[13px] font-bold",
                        included ? "text-moss-600" : t.price ? "text-ink-900" : "text-moss-600"
                      )}
                    >
                      {included ? "Included" : t.price ? `$${t.price}` : "Free"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{t.tagline}</p>
                  <ul className="mt-3 space-y-1.5">
                    {t.perks.map((p) => (
                      <li key={p} className="flex gap-2 text-[12.5px] leading-snug text-ink-700">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  {t.scarcity && (
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                      {disabled
                        ? "All 3 taken this week"
                        : featuredOpen !== null
                          ? `${featuredOpen} of 3 left this week`
                          : t.scarcity}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── directory add-on ── */}
          <div className="mt-7 flex items-baseline justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
              Directory submissions
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
              Optional
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
            One launch is one backlink. The founders who actually move their Domain Rating submit
            to dozens of directories — it&apos;s a weekend of copy-pasting. We can do it for you.
          </p>

          <div className="mt-3 space-y-2.5">
            {DIRECTORY_ADDONS.map((a) => {
              const active = addon === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => onAddon(a.key)}
                  className={cn(
                    "flex w-full gap-3 rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-ember-500/60 bg-ember-500/[0.05] ring-2 ring-ember-500/25"
                      : "border-ink-900/12 bg-paper-100 hover:border-ember-500/40 hover:shadow-card"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition",
                      active ? "border-ember-500 bg-ember-500" : "border-ink-900/25"
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-paper-100" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-[14.5px] font-bold text-ink-900">{a.name}</span>
                      <span className="flex items-baseline gap-2">
                        {a.worth ? (
                          <span className="font-mono text-[11px] text-ink-400 line-through">
                            ${a.worth}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "font-mono text-[13px] font-bold",
                            a.price ? "text-ink-900" : "text-moss-600"
                          )}
                        >
                          {a.price ? `+$${a.price}` : "$0"}
                        </span>
                      </span>
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-500">
                      {a.blurb}
                    </span>
                    {active && a.perks.length > 0 && (
                      <span className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                        {a.perks.map((p) => (
                          <span
                            key={p}
                            className="flex gap-2 text-[12px] leading-snug text-ink-700"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" />
                            {p}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── the close ── */}
        <div className="border-t border-ink-900/10 bg-paper-200/50 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                Total today
              </p>
              <p className="font-serif text-2xl font-bold text-ink-900">
                {total ? `$${total}` : "Free"}
              </p>
            </div>
            <p className="max-w-[19rem] text-[12px] leading-relaxed text-ink-400">
              {paying
                ? "We publish your launch first, then take you to checkout. If you change your mind at the payment screen, your launch still goes up."
                : "No card, no trial. Your launch goes up and the page is yours to keep."}
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={onContinue}
            disabled={publishing}
            className="mt-4 w-full"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
              </>
            ) : paying ? (
              <>
                <Zap className="h-4 w-4" /> Publish &amp; continue — ${total}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Publish my launch — free
              </>
            )}
          </Button>

          {/* The free path is never more than one click away. */}
          {paying && (
            <button
              type="button"
              disabled={publishing}
              onClick={() => {
                onTier("free");
                onAddon("none");
              }}
              className="mt-2.5 w-full text-center text-[12.5px] text-ink-400 underline-offset-2 transition hover:text-ink-700 hover:underline disabled:opacity-40"
            >
              No thanks — just launch it free
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
