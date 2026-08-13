"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, inputClass, Card } from "@/components/ui";
import { ProductLogo } from "@/components/avatar";
import { CopilotPanel } from "@/components/copilot-panel";
import { CATEGORIES, PRICING_MODELS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

type Draft = {
  name: string;
  tagline: string;
  website_url: string;
  logo_url: string;
  description: string;
  categories: string[];
  pricing_model: string;
  who_for: string;
  problem: string;
  solution: string;
  unique_edge: string;
  keywords: string;
  maker_note: string;
};

const EMPTY: Draft = {
  name: "",
  tagline: "",
  website_url: "",
  logo_url: "",
  description: "",
  categories: [],
  pricing_model: "",
  who_for: "",
  problem: "",
  solution: "",
  unique_edge: "",
  keywords: "",
  maker_note: "",
};

/**
 * The submit flow.
 *
 * The rule this form is built around: a maker should be able to launch in
 * under a minute. So it asks for five things, fills all of them from a URL,
 * and puts everything else behind a disclosure that says plainly it's
 * optional. Nothing below "The essentials" blocks publishing.
 */
export function SubmitForm({
  canPublish,
  supported,
  threshold,
  initialUrl,
}: {
  canPublish: boolean;
  supported: number;
  threshold: number;
  /** URL carried from the landing hero — autofill fires against it on mount. */
  initialUrl?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [sourceUrl, setSourceUrl] = useState(initialUrl || "");
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(false);
  const [more, setMore] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const autoRan = useRef(false);

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
    try {
      const res = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't read that site.");

      setDraft((d) => ({
        ...d,
        name: data.name || d.name,
        tagline: data.tagline || d.tagline,
        website_url: data.website_url || url,
        logo_url: data.logo_url || d.logo_url,
        description: data.description || d.description,
        categories: data.categories?.length ? data.categories : d.categories,
        pricing_model: data.pricing_model || d.pricing_model,
        who_for: data.who_for || d.who_for,
        problem: data.problem || d.problem,
        solution: data.solution || d.solution,
        unique_edge: data.unique_edge || d.unique_edge,
        keywords: (data.keywords || []).join(", ") || d.keywords,
      }));
      setFilled(true);
      trackEvent("autofill_success", { meta: { ai: Boolean(data?.source?.ai) } });

      if (data?.source?.ai) {
        toast.success("Filled from your site. Check it over and fix anything we got wrong.");
      } else {
        toast.success("Pulled what we could from your page — the rest is yours to write.");
      }
    } catch (e: any) {
      trackEvent("autofill_error", { meta: { message: String(e?.message).slice(0, 120) } });
      toast.error(e?.message || "Couldn't read that site. Fill it in by hand — it's five fields.");
    } finally {
      setFilling(false);
    }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't publish that.");

      trackEvent("publish_success", { productSlug: data.slug });
      router.push(`/products/${data.slug}?launched=1`);
    } catch (e: any) {
      trackEvent("publish_error", { meta: { message: String(e?.message).slice(0, 120) } });
      toast.error(e?.message || "Couldn't publish that.");
      setPublishing(false);
    }
  }

  const ready = draft.name.trim() && draft.tagline.trim() && draft.website_url.trim();

  return (
    <form onSubmit={publish} className="space-y-6">
      {/* ── autofill ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-oxblood-500/8 to-moss-500/6 px-5 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-oxblood-500" />
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
              {filling ? (
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
            <p className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-moss-600">
              <Check className="h-3.5 w-3.5" /> Filled in below — everything is editable.
            </p>
          )}
        </div>
      </Card>

      {/* ── the essentials ── */}
      <Card className="p-5 sm:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-oxblood-600">
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

          <Field label="Logo URL" hint="we guessed from your favicon">
            <div className="flex items-center gap-3">
              <ProductLogo src={draft.logo_url || null} name={draft.name} size={44} />
              <input
                value={draft.logo_url}
                onChange={(e) => set("logo_url", e.target.value)}
                placeholder="https://yourproduct.com/logo.png"
                className={inputClass}
              />
            </div>
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
                        ? "border-oxblood-500/40 bg-oxblood-500/10 text-oxblood-600"
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
        {!canPublish && (
          <p className="mb-3 rounded-xl border border-brass-500/25 bg-brass-500/8 px-4 py-3 text-[13px] text-ink-700">
            Support <strong>{threshold - supported}</strong> more launch
            {threshold - supported === 1 ? "" : "es"} before you publish your own. You&apos;ve
            upvoted {supported} of {threshold}.{" "}
            <a href="/" className="font-medium text-oxblood-600 hover:underline">
              Go find one worth an upvote →
            </a>
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
  );
}
