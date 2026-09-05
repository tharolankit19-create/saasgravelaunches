"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ChevronDown, Check, Calendar, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, inputClass, Card } from "@/components/ui";
import { ImageUpload } from "@/components/image-upload";
import { PhotoUpload } from "@/components/photo-upload";
import { BadgeEmbed } from "@/components/badge-embed";
import { CopilotPanel } from "@/components/copilot-panel";
import { SupportPopup } from "@/components/support-popup";
import { LaunchConfigurator, type ConfigStep } from "@/components/launch-configurator";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";
import { CATEGORIES, PRICING_MODELS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";
import { resolveSelection, type AddonKey, type TierKey } from "@/lib/launch-options";
import { PRODUCTS } from "@/lib/pricing";

type Draft = {
  name: string;
  tagline: string;
  website_url: string;
  logo_url: string;
  gallery_urls: string[];
  description: string;
  categories: string[];
  pricing_model: string;
  who_for: string;
  problem: string;
  solution: string;
  unique_edge: string;
  keywords: string;
  maker_note: string;
  x_url: string;
  linkedin_url: string;
};

const EMPTY: Draft = {
  name: "",
  tagline: "",
  website_url: "",
  logo_url: "",
  gallery_urls: [],
  description: "",
  categories: [],
  pricing_model: "",
  who_for: "",
  problem: "",
  solution: "",
  unique_edge: "",
  keywords: "",
  maker_note: "",
  x_url: "",
  linkedin_url: "",
};

/**
 * The submit flow.
 *
 * The rule this form is built around: a maker should be able to launch in
 * under a minute. So it asks for five things, fills all of them from a URL,
 * and puts everything else behind a disclosure that says plainly it's
 * optional. Nothing below "The essentials" blocks publishing.
 */
type WeekOption = {
  week: string;
  label: string;
  range: string;
  open: number;
  cap: number;
  /** Featured placements still unsold in this week. */
  featuredOpen: number;
};

export function SubmitForm({
  canPublish,
  gateActive,
  supported,
  threshold,
  initialUrl,
  weekOptions,
  premium,
}: {
  canPublish: boolean;
  /** Whether the support-three gate is switched on yet (board has depth). */
  gateActive: boolean;
  supported: number;
  threshold: number;
  /** URL carried from the landing hero — autofill fires against it on mount. */
  initialUrl?: string;
  /** The weeks a maker can schedule into, with free-slot counts. */
  weekOptions: WeekOption[];
  /** Premium can launch into any week, full or not. */
  premium: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [sourceUrl, setSourceUrl] = useState(initialUrl || "");
  // Default to the first week a free maker can actually use (has open slots),
  // or just the first week for Premium.
  const [launchWeek, setLaunchWeek] = useState(
    () => (premium ? weekOptions[0]?.week : weekOptions.find((w) => w.open > 0)?.week) || weekOptions[0]?.week || ""
  );
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(false);
  const [more, setMore] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // When a launch is held for badge verification, we hold its slug here and show
  // the badge step instead of redirecting.
  const [badgeSlug, setBadgeSlug] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  // ── the configure step ── what the maker chose on the last screen. Free is
  // the default and stays one click away throughout.
  const [showConfig, setShowConfig] = useState(false);
  const [configStep, setConfigStep] = useState<ConfigStep>("plan");
  // Premium Launch leads: it's the option that removes work rather than adding
  // it, and a maker who wants free is one click away on the same screen.
  const [tier, setTier] = useState<TierKey>("premium");
  const [addon, setAddon] = useState<AddonKey>("none");
  // Phase 1 landed and the AI pass is still running — the form is usable, we
  // just say so rather than blocking it.
  const [polishing, setPolishing] = useState(false);
  const autoRan = useRef(false);

  // High-value SEO fields the AI drafts. Not shown as editable inputs (they'd
  // add friction), but carried through to publish and rendered on the SEO page.
  const [aiFaq, setAiFaq] = useState<{ q: string; a: string }[]>([]);
  const [aiAlternatives, setAiAlternatives] = useState<string[]>([]);
  const [aiExtras, setAiExtras] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // If the maker arrived from the hero with a URL, fill from it immediately —
  // the guard stops React's dev double-mount from firing autofill twice.
  useEffect(() => {
    if (autoRan.current) return;
    if (initialUrl && initialUrl.trim()) {
      autoRan.current = true;
      autofill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function autofill() {
    const url = sourceUrl.trim();
    if (!url) return toast.error("Paste your product's URL first.");

    setFilling(true);
    trackEvent("autofill_attempt");

    // Phase 1: no model, so this lands in a second or two — the founder sees
    // the name, logo, tagline and description appear instead of a spinner.
    let quickOk = false;
    try {
      const qres = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, stage: "quick" }),
      });
      const qdata = await qres.json();
      if (qres.ok && qdata?.source?.scraped) {
        quickOk = true;
        applyAutofill(qdata, url);
        setFilled(true);
        setPolishing(true);
      }
    } catch {
      /* the full pass below is the real attempt */
    }

    try {
      const res = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't read that site.");

      applyAutofill(data, url);
      if (Array.isArray(data.faq) && data.faq.length) setAiFaq(data.faq);
      if (Array.isArray(data.alternatives) && data.alternatives.length)
        setAiAlternatives(data.alternatives);
      setAiExtras((data.faq?.length || 0) + (data.alternatives?.length || 0) > 0);
      setFilled(true);
      trackEvent("autofill_success", {
        meta: { ai: Boolean(data?.source?.ai), via: data?.source?.via },
      });

      if (data?.source?.ai) {
        toast.success("Filled from your site. Check it over and fix anything we got wrong.");
      } else if (data?.source?.scraped) {
        toast.success("Pulled what we could from your page — the rest is yours to write.");
      } else {
        // Couldn't read the page (blocked, redirect, or JS-only) — but the URL
        // and a name are in, so it's not a dead end.
        toast.message(
          "We couldn't read that page automatically — your URL's in, just fill the fields (it's quick)."
        );
      }
    } catch (e: any) {
      trackEvent("autofill_error", { meta: { message: String(e?.message).slice(0, 120) } });
      // Phase 1 already filled the basics, so this is a downgrade, not a failure.
      if (quickOk) {
        toast.message("Filled from your page. The AI polish didn't finish — edit anything below.");
      } else {
        toast.error(e?.message || "Couldn't read that site. Fill it in by hand — it's five fields.");
      }
    } finally {
      setFilling(false);
      setPolishing(false);
    }
  }

  /** Write an autofill payload into the draft. Shared by both phases — a later
   *  phase only overwrites a field when it actually has something to say. */
  function applyAutofill(data: any, url: string) {
    setDraft((d) => ({
      ...d,
      name: data.name || d.name,
      tagline: data.tagline || d.tagline,
      website_url: data.website_url || url,
      logo_url: data.logo_url || d.logo_url,
      // Seed the gallery with the site's OG image only if the maker hasn't
      // added their own screenshots yet — their uploads always win.
      gallery_urls:
        d.gallery_urls.length > 0
          ? d.gallery_urls
          : Array.isArray(data.gallery_urls)
            ? data.gallery_urls.slice(0, 5)
            : d.gallery_urls,
      description: data.description || d.description,
      categories: data.categories?.length ? data.categories : d.categories,
      pricing_model: data.pricing_model || d.pricing_model,
      who_for: data.who_for || d.who_for,
      problem: data.problem || d.problem,
      solution: data.solution || d.solution,
      unique_edge: data.unique_edge || d.unique_edge,
      keywords: (data.keywords || []).join(", ") || d.keywords,
    }));
  }

  // Launch tap → the configure step (how it lands, plus the optional directory
  // package). Its Continue either goes straight to publish, or — when the
  // support-three gate is live — through the support popup first.
  function requestLaunch(e: React.FormEvent) {
    e.preventDefault();
    if (!canPublish) return;
    setConfigStep("plan");
    setShowConfig(true);
  }

  function confirmConfig() {
    if (gateActive) {
      setShowConfig(false);
      setShowSupport(true);
      return;
    }
    doPublish();
  }

  /**
   * Send the maker to checkout for whatever they picked. The launch is already
   * live at this point — payment buys the upgrade, it never gates the launch —
   * so any failure here just lands them on their product page instead.
   */
  async function startUpgrade(slug: string): Promise<boolean> {
    const { product } = resolveSelection(tier, addon);
    if (!product) return false;
    try {
      trackEvent("checkout_start", { meta: { product, from: "configure" } });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, productSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Checkout couldn't start.");
      window.location.href = data.url;
      return true;
    } catch (e: any) {
      toast.error(
        `${e?.message || "Checkout couldn't start."} Your launch is live — you can upgrade from your dashboard.`
      );
      return false;
    }
  }

  async function doPublish() {
    if (!canPublish) return;

    setPublishing(true);
    trackEvent("publish_attempt");
    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          keywords: draft.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          gallery_urls: draft.gallery_urls,
          launch_week: launchWeek,
          intent: resolveSelection(tier, addon).intent,
          faq: aiFaq,
          alternatives: aiAlternatives,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't publish that.");

      // Held pending payment — the draft exists, now collect it. A failure here
      // leaves the draft in their dashboard rather than a half-published launch.
      if (data.needsPayment && data.slug) {
        if (await startUpgrade(data.slug)) return;
        setPublishing(false);
        return;
      }

      // Held for badge verification — show the badge step, don't redirect.
      if (data.needsBadge && data.slug) {
        setShowSupport(false);
        setShowConfig(false);
        setBadgeSlug(data.slug);
        setPublishing(false);
        toast.message("Almost there — add the badge to your site to go live.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      trackEvent("publish_success", { productSlug: data.slug });

      // Anything paid was chosen on the configure step: the launch is up, now
      // hand off to checkout. On failure we fall through to the product page.
      if (await startUpgrade(data.slug)) return;

      router.push(`/products/${data.slug}?launched=1`);
    } catch (e: any) {
      trackEvent("publish_error", { meta: { message: String(e?.message).slice(0, 120) } });
      toast.error(e?.message || "Couldn't publish that.");
      setPublishing(false);
    }
  }

  async function verifyAndPublish() {
    if (!badgeSlug) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/verify-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: badgeSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't verify right now.");

      if (data.verified) {
        trackEvent("publish_success", { productSlug: badgeSlug });
        if (await startUpgrade(badgeSlug)) return;
        router.push(`/products/${badgeSlug}?launched=1`);
      } else {
        toast.error(data.error || "We didn't find the badge on your site yet.");
        setVerifying(false);
      }
    } catch (e: any) {
      toast.error(e?.message || "Couldn't verify right now.");
      setVerifying(false);
    }
  }

  const ready = draft.name.trim() && draft.tagline.trim() && draft.website_url.trim();
  const selectedWeek = weekOptions.find((w) => w.week === launchWeek) || null;

  // ── badge step ── shown as an unmissable modal the moment the draft is saved.
  // Two clear paths: add the badge and go live free, or go Premium and skip it.
  const badgeModal = badgeSlug ? (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-sm sm:p-6">
      <Card className="my-6 w-full max-w-2xl overflow-hidden shadow-lift">
        <div className="flex items-start gap-3 border-b border-ink-900/10 bg-ember-500/[0.06] px-6 py-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ember-600" />
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-semibold text-ink-900">
              Last step — your launch isn&apos;t live yet
            </h2>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-500">
              We saved your listing as a draft. Pick one way to publish it:
            </p>
          </div>
        </div>

        {/* Path A — free, with the badge */}
        <div className="px-6 py-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-[12px] font-bold text-paper-100">
              1
            </span>
            <p className="text-[15px] font-semibold text-ink-900">
              Free — add our badge to your site, then verify
            </p>
          </div>
          <p className="mb-4 text-[13px] leading-relaxed text-ink-500">
            Paste the code (or the AI prompt) below onto your site&apos;s homepage or footer,
            publish it, then hit verify. This is how the backlink sends traffic both ways.
          </p>
          <BadgeEmbed slug={badgeSlug} siteUrl={SITE} />
          <Button
            type="button"
            size="lg"
            onClick={verifyAndPublish}
            disabled={verifying}
            className="mt-5 w-full"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Checking your site…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> I added it — verify &amp; go live
              </>
            )}
          </Button>
        </div>

        {/* Path B — premium, skip the badge */}
        <div className="border-t border-ink-900/10 bg-paper-200/40 px-6 py-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brass-500 text-[12px] font-bold text-paper-50">
              2
            </span>
            <p className="text-[15px] font-semibold text-ink-900">
              Or go Premium — launch instantly, no badge needed
            </p>
          </div>
          <p className="mb-3 text-[13px] leading-relaxed text-ink-500">
            A Premium Launch skips verification entirely and publishes the moment it&apos;s paid — plus
            the Verified mark and a place in any week, even a full one. Nothing to add to your site.
          </p>
          {/* Stays in the flow. Sending a maker who has already written their
              listing off to /pricing is how a launch gets abandoned. */}
          <button
            type="button"
            onClick={() => {
              setBadgeSlug(null);
              setTier("premium");
              setAddon("none");
              setConfigStep("review");
              setShowConfig(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brass-500/50 px-4 py-2 text-[13px] font-semibold text-brass-600 transition hover:bg-brass-500/10"
          >
            Publish it now for ${PRODUCTS.premiumLaunch.dollars} →
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-ink-900/10 px-6 py-3">
          <p className="text-[12px] text-ink-400">
            Your draft is saved — you can finish this any time from your dashboard.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setBadgeSlug(null);
                setConfigStep("plan");
                setShowConfig(true);
              }}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400 hover:text-ink-700"
            >
              ← Back to options
            </button>
            <button
              type="button"
              onClick={() => setBadgeSlug(null)}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400 hover:text-ink-700"
            >
              Later
            </button>
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <>
      {badgeModal}
      <LaunchConfigurator
        open={showConfig && !badgeSlug}
        step={configStep}
        weekLabel={selectedWeek?.label || ""}
        weekRange={selectedWeek?.range || ""}
        productName={draft.name}
        featuredOpen={selectedWeek ? selectedWeek.featuredOpen : null}
        publishing={publishing}
        tier={tier}
        addon={addon}
        onTier={setTier}
        onAddon={setAddon}
        onStep={setConfigStep}
        onContinue={confirmConfig}
        onClose={() => setShowConfig(false)}
      />
      <SupportPopup
        open={showSupport}
        publishing={publishing}
        onContinue={doPublish}
        onClose={() => setShowSupport(false)}
      />
      <form onSubmit={requestLaunch} className="space-y-6">
      {/* ── autofill ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ember-500/8 to-moss-500/6 px-5 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ember-500" />
            <h2 className="text-base font-semibold tracking-tight text-ink-900">
              Start with your URL
            </h2>
          </div>
          <p className="mt-1.5 text-sm text-ink-500">
            Paste your site. We read it and write the listing — name, tagline, description, the
            lot. Then you fix whatever we got wrong.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              inputMode="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://yourproduct.com"
              className={cn(inputClass, "flex-1")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  autofill();
                }
              }}
            />
            <Button type="button" onClick={autofill} disabled={filling} size="md" className="sm:w-40">
              {polishing ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" /> Polishing…
                </>
              ) : filling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Fill with AI
                </>
              )}
            </Button>
          </div>

          {filled && (
            <div className="mt-2.5 space-y-1">
              {polishing ? (
                <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ember-600">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Filled from your page — AI is
                  writing the tagline, tags and problem/solution now…
                </p>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-moss-600">
                  <Check className="h-3.5 w-3.5" /> Filled in below — everything is editable.
                </p>
              )}
              {aiExtras && (
                <p className="text-[12px] text-ink-500">
                  We also drafted{" "}
                  {aiFaq.length > 0 && <strong className="text-ink-700">{aiFaq.length} FAQ answers</strong>}
                  {aiFaq.length > 0 && aiAlternatives.length > 0 && " and "}
                  {aiAlternatives.length > 0 && (
                    <strong className="text-ink-700">
                      {aiAlternatives.length} “alternative to” page{aiAlternatives.length > 1 ? "s" : ""}
                    </strong>
                  )}{" "}
                  — added to your SEO page on publish.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── the essentials ── */}
      <Card className="p-5 sm:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember-600">
          The essentials
        </p>
        <p className="mt-1.5 text-sm text-ink-500">
          These five are all we need. Everything below them is optional.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Product name" required>
            <input
              value={draft.name}
              onChange={(e) => set("name", e.target.value.slice(0, 60))}
              placeholder="e.g. Saasgrave"
              maxLength={60}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Tagline" required hint={`${draft.tagline.length}/80`}>
            <input
              value={draft.tagline}
              onChange={(e) => set("tagline", e.target.value.slice(0, 80))}
              placeholder="What it does, in one line"
              maxLength={80}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Website" required hint="gets a dofollow link">
            <input
              type="url"
              value={draft.website_url}
              onChange={(e) => set("website_url", e.target.value)}
              placeholder="https://yourproduct.com"
              required
              className={inputClass}
            />
          </Field>

          <Field label="Logo" hint="upload one, or paste a URL">
            <PhotoUpload
              value={draft.logo_url || null}
              onChange={(url) => set("logo_url", url || "")}
              bucket="logos"
              name={draft.name}
              label="Upload logo"
            />
            <input
              value={draft.logo_url}
              onChange={(e) => set("logo_url", e.target.value)}
              placeholder="or paste a logo URL"
              className={cn(inputClass, "mt-2.5")}
            />
          </Field>

          <Field
            label="Screenshots"
            hint="the founder's first impression — add at least one"
          >
            <ImageUpload
              value={draft.gallery_urls}
              onChange={(urls) => set("gallery_urls", urls)}
            />
          </Field>

          <Field label="Categories" required hint="pick up to 2">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = draft.categories.includes(c.name);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() =>
                      set(
                        "categories",
                        on
                          ? draft.categories.filter((x) => x !== c.name)
                          : draft.categories.length >= 2
                            ? draft.categories
                            : [...draft.categories, c.name]
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
                      on
                        ? "border-ember-500/40 bg-ember-500/10 text-ember-600"
                        : "border-ink-900/10 bg-paper-100 text-ink-500 hover:border-ink-900/25 hover:text-ink-900"
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </Card>

      {/* ── launch week ── */}
      {weekOptions.length > 0 && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ember-500" />
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember-600">
              When do you launch?
            </p>
          </div>
          <p className="mt-1.5 text-sm text-ink-500">
            {premium ? (
              <>You&apos;re Premium — launch into any week, even a full one.</>
            ) : (
              <>
                Each week holds {weekOptions[0]?.cap} free launches. Pick one with room —{" "}
                <span className="text-ink-700">Premium launches into any week.</span>
              </>
            )}
          </p>

          {/* A date grid, not a list — availability is the thing a founder is
              actually choosing on, so each week states it in plain words. */}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {weekOptions.map((w) => {
              const full = w.open <= 0;
              const locked = full && !premium;
              const active = launchWeek === w.week;
              return (
                <button
                  key={w.week}
                  type="button"
                  disabled={locked}
                  onClick={() => setLaunchWeek(w.week)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-ember-500/60 bg-ember-500/[0.05] ring-2 ring-ember-500/25"
                      : locked
                        ? "cursor-not-allowed border-ink-900/10 bg-paper-200/40 opacity-60"
                        : "border-ink-900/12 bg-paper-100 hover:border-ember-500/40 hover:shadow-card"
                  )}
                >
                  <span className="block text-[15px] font-bold text-ink-900">{w.label}</span>
                  <span className="mt-0.5 block text-[12px] text-ink-400">{w.range}</span>

                  <span className="mt-3 block space-y-1.5">
                    <Availability
                      ok={!full}
                      label={full ? "Free full" : `Free available · ${w.open}/${w.cap}`}
                    />
                    <Availability
                      ok={w.featuredOpen > 0}
                      label={
                        w.featuredOpen > 0
                          ? `Featured available · ${w.featuredOpen}/3`
                          : "Featured taken"
                      }
                    />
                  </span>

                  {locked && (
                    <span className="mt-2.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-brass-600">
                      <Lock className="h-3 w-3" /> Premium launches into any week
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── optional depth ── */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setMore((m) => !m)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-paper-200/50 sm:px-6"
        >
          <span>
            <span className="text-sm font-semibold text-ink-900">
              Make the page work harder{" "}
              <span className="font-normal text-ink-400">— optional</span>
            </span>
            <span className="mt-0.5 block text-[13px] text-ink-500">
              These fill your SEO page, so it keeps earning after launch week. Autofill already
              drafted them.
            </span>
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-400 transition", more && "rotate-180")} />
        </button>

        {more && (
          <div className="space-y-4 border-t border-ink-900/8 px-5 py-5 sm:px-6">
            <Field label="Description">
              <textarea
                value={draft.description}
                onChange={(e) => set("description", e.target.value.slice(0, 700))}
                rows={4}
                placeholder="A few sentences on what it is and who it's for."
                className={cn(inputClass, "resize-y")}
              />
            </Field>

            {/* The company's own accounts — both optional. Visitors who like a
                product usually want to follow the company, not just the maker. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="X (company account)" hint="— optional">
                <input
                  value={draft.x_url}
                  onChange={(e) => set("x_url", e.target.value.slice(0, 200))}
                  placeholder="x.com/yourcompany"
                  className={inputClass}
                />
              </Field>
              <Field label="LinkedIn company page" hint="— optional">
                <input
                  value={draft.linkedin_url}
                  onChange={(e) => set("linkedin_url", e.target.value.slice(0, 250))}
                  placeholder="linkedin.com/company/yourcompany"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Who is it for?">
                <input
                  value={draft.who_for}
                  onChange={(e) => set("who_for", e.target.value.slice(0, 120))}
                  placeholder="Indie founders shipping solo"
                  className={inputClass}
                />
              </Field>
              <Field label="Pricing">
                <select
                  value={draft.pricing_model}
                  onChange={(e) => set("pricing_model", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Not saying</option>
                  {PRICING_MODELS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Problem">
              <textarea
                value={draft.problem}
                onChange={(e) => set("problem", e.target.value.slice(0, 400))}
                rows={2}
                className={cn(inputClass, "resize-y")}
              />
            </Field>
            <Field label="Solution">
              <textarea
                value={draft.solution}
                onChange={(e) => set("solution", e.target.value.slice(0, 400))}
                rows={2}
                className={cn(inputClass, "resize-y")}
              />
            </Field>
            <Field label="What makes it different">
              <textarea
                value={draft.unique_edge}
                onChange={(e) => set("unique_edge", e.target.value.slice(0, 400))}
                rows={2}
                className={cn(inputClass, "resize-y")}
              />
            </Field>
            <Field label="Keywords" hint="comma separated">
              <input
                value={draft.keywords}
                onChange={(e) => set("keywords", e.target.value)}
                placeholder="launch platform, product directory, seo backlinks"
                className={inputClass}
              />
            </Field>
            <Field label="Your first comment" hint="pinned to the top of the discussion">
              <textarea
                value={draft.maker_note}
                onChange={(e) => set("maker_note", e.target.value.slice(0, 800))}
                rows={3}
                placeholder="Hi — I'm the maker. I built this because…"
                className={cn(inputClass, "resize-y")}
              />
            </Field>
          </div>
        )}
      </Card>

      {/* ── copilot ── */}
      {ready && (
        <CopilotPanel
          draft={{
            name: draft.name,
            tagline: draft.tagline,
            description: draft.description,
            categories: draft.categories,
            who_for: draft.who_for,
            problem: draft.problem,
            solution: draft.solution,
            unique_edge: draft.unique_edge,
            website_url: draft.website_url,
          }}
          onApplyTagline={(t) => set("tagline", t.slice(0, 80))}
          onApplyDescription={(d) => {
            set("description", d.slice(0, 700));
            setMore(true);
          }}
        />
      )}

      {/* ── publish ── */}
      <div className="sticky bottom-0 z-10 -mx-1 border-t border-ink-900/8 bg-paper-50/90 px-1 py-4 backdrop-blur">
        {gateActive && !canPublish && (
          <p className="mb-3 rounded-2xl border border-brass-500/25 bg-brass-500/8 px-4 py-3 text-[13px] text-ink-700">
            Support <strong>{threshold - supported}</strong> more launch
            {threshold - supported === 1 ? "" : "es"} before you publish your own. You&apos;ve
            upvoted {supported} of {threshold}.{" "}
            <a href="/" className="font-medium text-ember-600 hover:underline">
              Go find one worth an upvote →
            </a>
          </p>
        )}
        {!premium && (
          <p className="mb-3 rounded-xl border border-ink-900/12 bg-paper-200/50 px-4 py-2.5 text-[13px] leading-relaxed text-ink-600">
            <strong className="text-ink-900">One thing after this:</strong> free launches add our
            badge to your site and verify it (we&apos;ll show you how in a sec). Prefer to skip it?{" "}
            <a href="/pricing#plans" className="font-medium text-ember-600 hover:underline">
              Premium launches instantly
            </a>
            .
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-ink-500">
            Free, forever. Your page and its backlink stay live after the week ends.
          </p>
          <Button type="submit" size="lg" disabled={!canPublish || !ready || publishing}>
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
              </>
            ) : (
              "Launch it"
            )}
          </Button>
        </div>
      </div>
      </form>
    </>
  );
}

/** One availability line inside a week card — a dot and the plain state. */
function Availability({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-ink-500">
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ok ? "bg-moss-500" : "bg-ink-400/60")}
      />
      {label}
    </span>
  );
}
