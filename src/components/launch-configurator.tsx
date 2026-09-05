"use client";

import { ArrowLeft, Check, Crown, Loader2, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  DIRECTORY_ADDONS,
  LAUNCH_TIERS,
  addon as findAddon,
  resolveSelection,
  tier as findTier,
  type AddonKey,
  type TierKey,
} from "@/lib/launch-options";

export type ConfigStep = "plan" | "review";

/**
 * The configure-launch step — the last screen before a launch goes up.
 *
 * Two steps, both in-flow: choose how it publishes, then review and pay. Back
 * returns to the choice rather than dumping the maker on /pricing, because a
 * founder who has already written their listing should never be sent to a
 * different page to buy something.
 *
 * The paid options lead. That is a merchandising decision, not a trick: a free
 * launch genuinely costs the maker work (our badge on their site, then a
 * verification round-trip), and that cost is stated on the free row in plain
 * words instead of being discovered two screens later. Free is still one click,
 * still publishes a real listing, and still carries the same permanent dofollow
 * link. Every price, perk and scarcity line resolves from the catalogue, and
 * the only urgency shown is a real count of unsold Featured slots.
 */
export function LaunchConfigurator({
  open,
  step,
  weekLabel,
  weekRange,
  productName,
  featuredOpen,
  publishing,
  tier,
  addon,
  onTier,
  onAddon,
  onStep,
  onContinue,
  onClose,
}: {
  open: boolean;
  step: ConfigStep;
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
  onStep: (s: ConfigStep) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const sel = resolveSelection(tier, addon);
  const add = findAddon(addon);
  const paying = sel.total > 0;
  const featuredSoldOut = featuredOpen !== null && featuredOpen <= 0;
  // A directory package publishes the launch itself, so the publish rows below
  // it read as "included" rather than as a second thing to buy.
  const publishIncluded = Boolean(add.product);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink-900/55 p-3 backdrop-blur-sm sm:p-6">
      <Card className="my-4 w-full max-w-3xl overflow-hidden shadow-lift">
        {/* ── header ── */}
        <div className="flex items-start gap-3 border-b border-ink-900/10 bg-paper-200/50 px-5 py-4 sm:px-7 sm:py-5">
          {step === "review" && (
            <button
              type="button"
              onClick={() => onStep("plan")}
              className="mt-1 rounded-full p-1.5 text-ink-500 transition hover:bg-paper-300/60 hover:text-ink-900"
              aria-label="Back to plans"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember-600">
              {step === "plan" ? "Last step" : "Review & publish"}
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold text-ink-900 sm:text-2xl">
              {step === "plan" ? "How should this launch land?" : "You're one click from live"}
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
          {step === "plan" ? (
            <PlanStep
              tier={tier}
              addon={addon}
              onTier={onTier}
              onAddon={onAddon}
              featuredOpen={featuredOpen}
              featuredSoldOut={featuredSoldOut}
              publishIncluded={publishIncluded}
            />
          ) : (
            <ReviewStep tier={tier} addon={addon} />
          )}
        </div>

        {/* ── the close ── */}
        <div className="border-t border-ink-900/10 bg-paper-200/50 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                Total today
              </p>
              <p className="font-serif text-2xl font-bold text-ink-900">
                {sel.total ? `$${sel.total}` : "Free"}
              </p>
            </div>
            <p className="max-w-[20rem] text-[12px] leading-relaxed text-ink-400">
              {sel.needsBadge
                ? "Free launches publish once we find our badge on your site. Until then your listing stays a draft."
                : "One payment. Your launch publishes the moment it clears — nothing to add to your site."}
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={step === "plan" && paying ? () => onStep("review") : onContinue}
            disabled={publishing}
            className="mt-4 w-full"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Working…
              </>
            ) : step === "plan" ? (
              paying ? (
                <>
                  Continue — ${sel.total} <Zap className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Continue — add my badge
                </>
              )
            ) : paying ? (
              <>
                <Zap className="h-4 w-4" /> Pay ${sel.total} &amp; publish
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Publish my launch
              </>
            )}
          </Button>

          {step === "review" && (
            <button
              type="button"
              disabled={publishing}
              onClick={() => onStep("plan")}
              className="mt-2.5 w-full text-center text-[12.5px] text-ink-400 underline-offset-2 transition hover:text-ink-700 hover:underline disabled:opacity-40"
            >
              ← Back to the options
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ── step 1 · how it publishes ─────────────────────────────── */

function PlanStep({
  tier,
  addon,
  onTier,
  onAddon,
  featuredOpen,
  featuredSoldOut,
  publishIncluded,
}: {
  tier: TierKey;
  addon: AddonKey;
  onTier: (t: TierKey) => void;
  onAddon: (a: AddonKey) => void;
  featuredOpen: number | null;
  featuredSoldOut: boolean;
  publishIncluded: boolean;
}) {
  const premium = findTier("premium");
  const featured = findTier("featured");
  const free = findTier("free");

  return (
    <>
      {/* ── the lead option ── */}
      <button
        type="button"
        onClick={() => onTier("premium")}
        className={cn(
          "relative w-full rounded-3xl border-2 p-5 text-left transition",
          publishIncluded
            ? "border-moss-500/50 bg-moss-500/[0.05]"
            : tier === "premium"
              ? "border-ember-500 bg-ember-500/[0.06] shadow-card"
              : "border-ink-900/12 bg-paper-100 hover:border-ember-500/50 hover:shadow-card"
        )}
      >
        <span
          className={cn(
            "absolute -top-3 left-5 rounded-full px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-paper-100",
            publishIncluded ? "bg-moss-500" : "bg-ember-500"
          )}
        >
          {publishIncluded ? "Included in your package" : premium.badge}
        </span>

        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="flex items-center gap-2 font-serif text-[19px] font-bold text-ink-900">
            <Crown className="h-4.5 w-4.5 text-brass-500" />
            {premium.name}
          </span>
          <span className="flex items-baseline gap-2">
            {premium.worth && !publishIncluded ? (
              <span className="font-mono text-[12px] text-ink-400 line-through">
                ${premium.worth}
              </span>
            ) : null}
            <span className="font-mono text-[17px] font-bold text-ink-900">
              {publishIncluded ? "Included" : `$${premium.price}`}
            </span>
            {!publishIncluded && (
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                one-off
              </span>
            )}
          </span>
        </span>

        <span className="mt-1.5 block text-[13.5px] leading-relaxed text-ink-600">
          {premium.tagline}
        </span>

        <span className="mt-3.5 grid gap-1.5 sm:grid-cols-2">
          {premium.perks.map((p) => (
            <span key={p} className="flex gap-2 text-[12.5px] leading-snug text-ink-700">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" />
              {p}
            </span>
          ))}
        </span>
      </button>

      {/* ── directory packages — the rest of the ladder ── */}
      <div className="mt-7 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
          Go further — directory submissions
        </p>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
          Publishing included
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
        One launch is one backlink. The founders who actually move their Domain Rating are listed
        across dozens of directories — it&apos;s a weekend of copy-pasting the same form. We do it
        by hand, and your launch publishes the moment you pay.
      </p>

      <div className="mt-3 space-y-2.5">
        {DIRECTORY_ADDONS.filter((a) => a.product).map((a) => {
          const active = addon === a.key;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => onAddon(active ? "none" : a.key)}
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
                    <span className="font-mono text-[13px] font-bold text-ink-900">${a.price}</span>
                  </span>
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-500">
                  {a.blurb}
                </span>
                {active && a.perks.length > 0 && (
                  <span className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                    {a.perks.map((p) => (
                      <span key={p} className="flex gap-2 text-[12px] leading-snug text-ink-700">
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

      {/* ── the quieter options ── */}
      {!publishIncluded && (
        <>
          <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
            Or
          </p>
          <div className="mt-3 space-y-2.5">
            {/* Featured — a pin, not a way to publish. */}
            <button
              type="button"
              disabled={featuredSoldOut}
              onClick={() => onTier("featured")}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                tier === "featured"
                  ? "border-ember-500/60 bg-ember-500/[0.05] ring-2 ring-ember-500/25"
                  : featuredSoldOut
                    ? "cursor-not-allowed border-ink-900/10 bg-paper-200/40 opacity-60"
                    : "border-ink-900/12 bg-paper-100 hover:border-ember-500/40"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-[14px] font-bold text-ink-900">{featured.name}</span>
                  <span className="font-mono text-[13px] font-bold text-ink-900">
                    ${featured.price}
                  </span>
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-500">
                  {featured.tagline}{" "}
                  <span className="text-ink-400">{featured.effort}</span>
                </span>
                <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                  {featuredSoldOut
                    ? "All 3 taken this week"
                    : featuredOpen !== null
                      ? `${featuredOpen} of 3 left this week`
                      : featured.scarcity}
                </span>
              </span>
            </button>

            {/* Free — available, deliberately quiet, and honest about the work. */}
            <button
              type="button"
              onClick={() => {
                onTier("free");
                onAddon("none");
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                tier === "free"
                  ? "border-ink-900/30 bg-paper-200/60"
                  : "border-ink-900/10 bg-paper-100 hover:border-ink-900/25"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-[14px] font-semibold text-ink-700">
                    {free.name} — launch free
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-ink-500">$0</span>
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-500">
                  {free.effort}
                </span>
              </span>
            </button>
          </div>
        </>
      )}
    </>
  );
}

/* ── step 2 · review ───────────────────────────────────────── */

function ReviewStep({ tier, addon }: { tier: TierKey; addon: AddonKey }) {
  const sel = resolveSelection(tier, addon);
  const add = findAddon(addon);
  const t = findTier(tier);

  // What they're actually getting, in the order it happens.
  const lines: string[] = add.product
    ? [...add.perks, "Your launch publishes as soon as payment clears — no badge needed"]
    : tier === "premium"
      ? findTier("premium").perks
      : tier === "featured"
        ? [...findTier("featured").perks, "Publishes once we verify our badge on your site"]
        : findTier("free").perks;

  return (
    <>
      <div className="rounded-3xl border border-ink-900/12 bg-paper-200/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-serif text-[18px] font-bold text-ink-900">
            {add.product ? add.name : t.name}
          </p>
          <p className="font-mono text-[17px] font-bold text-ink-900">
            {sel.total ? `$${sel.total}` : "Free"}
          </p>
        </div>
        <ul className="mt-4 space-y-2">
          {lines.map((l) => (
            <li key={l} className="flex gap-2.5 text-[13.5px] leading-snug text-ink-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss-500" />
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-ink-900/10 bg-paper-100 p-4">
        <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-moss-500" />
        <p className="text-[12.5px] leading-relaxed text-ink-500">
          {sel.needsBadge ? (
            <>
              We&apos;ll save your listing as a draft and show you the badge to add to your site.
              It publishes the moment we can see it — and if we can&apos;t find it, nothing goes
              live.
            </>
          ) : (
            <>
              We save your listing, then take you to a secure checkout. Your launch publishes
              automatically once the payment clears — you never touch your own site. If you close
              the payment screen, your draft is waiting in your dashboard.
            </>
          )}
        </p>
      </div>
    </>
  );
}
