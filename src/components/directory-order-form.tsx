"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Card, Field, inputClass, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ORDER_TIERS, ORDER_TIER_ORDER, DEFAULT_TIER, type OrderTierKey } from "@/lib/directory-orders";
import { trackEvent } from "@/lib/track-client";

/**
 * The no-login order form. Pick a plan, tell us the few things we need, and
 * you're taken to your own status page to pay and watch the work happen. No
 * account, no password — the whole point.
 */
export function DirectoryOrderForm({ initialTier }: { initialTier?: OrderTierKey }) {
  const router = useRouter();
  const [tier, setTier] = useState<OrderTierKey>(initialTier || DEFAULT_TIER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    productName: "",
    website: "",
    xHandle: "",
    linkedin: "",
    email: "",
    category: "",
    pitch: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const spec = ORDER_TIERS[tier];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.productName.trim()) return setError("Your product name is required.");
    if (!form.xHandle.trim() && !form.linkedin.trim())
      return setError("Add your X handle or LinkedIn — one is required.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      return setError("A contact email is required — it's where your report goes.");

    setBusy(true);
    trackEvent("directory_order_start", { meta: { tier } });
    try {
      const res = await fetch("/api/directory-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      // Straight to the private status page. It carries the pay button until
      // we confirm payment, so the buyer always has one place to return to.
      router.push(data.statusUrl);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* ── the fields ── */}
      <Card className="order-2 p-6 sm:p-7 lg:order-1">
        <h2 className="font-serif text-xl font-semibold text-ink-900">Tell us about your product</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
          Only what we actually need to submit you. Two minutes — no account.
        </p>

        <div className="mt-6 grid gap-5">
          <Field label="Product name" required>
            <input
              className={inputClass}
              placeholder="e.g. Saasgrave"
              value={form.productName}
              onChange={set("productName")}
              maxLength={160}
            />
          </Field>

          <Field label="Website" hint="— the link we submit">
            <input
              className={inputClass}
              placeholder="https://yourproduct.com"
              value={form.website}
              onChange={set("website")}
              inputMode="url"
              maxLength={300}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="X (Twitter) handle" hint="— X or LinkedIn required">
              <input
                className={inputClass}
                placeholder="@yourhandle"
                value={form.xHandle}
                onChange={set("xHandle")}
                maxLength={80}
              />
            </Field>
            <Field label="LinkedIn" hint="— X or LinkedIn required">
              <input
                className={inputClass}
                placeholder="linkedin.com/in/you"
                value={form.linkedin}
                onChange={set("linkedin")}
                maxLength={300}
              />
            </Field>
          </div>

          <Field label="Contact email" required hint="— where your report lands">
            <input
              className={inputClass}
              placeholder="you@email.com"
              value={form.email}
              onChange={set("email")}
              inputMode="email"
              type="email"
              maxLength={200}
            />
          </Field>

          <Field label="Category" hint="— optional, helps us pick the right directories">
            <input
              className={inputClass}
              placeholder="e.g. AI, developer tools, marketing"
              value={form.category}
              onChange={set("category")}
              maxLength={120}
            />
          </Field>

          <Field label="One-line pitch" hint="— optional, used on the listings">
            <input
              className={inputClass}
              placeholder="What your product does, in a sentence"
              value={form.pitch}
              onChange={set("pitch")}
              maxLength={400}
            />
          </Field>

          <Field label="Anything else" hint="— optional">
            <textarea
              className={cn(inputClass, "min-h-[84px] resize-y")}
              placeholder="Discount codes, launch dates, directories to prioritise or skip…"
              value={form.notes}
              onChange={set("notes")}
              maxLength={1000}
            />
          </Field>
        </div>
      </Card>

      {/* ── the plan + submit ── */}
      <div className="order-1 lg:order-2">
        <Card className="p-6 lg:sticky lg:top-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">Your plan</p>
          <div className="mt-3 space-y-2">
            {ORDER_TIER_ORDER.map((k) => {
              const t = ORDER_TIERS[k];
              const active = k === tier;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTier(k)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg border px-3.5 py-3 text-left transition",
                    active
                      ? "border-ember-500/60 bg-ember-500/[0.04]"
                      : "border-ink-900/15 hover:border-ink-900/35"
                  )}
                >
                  <span>
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-ink-900">
                      {t.name}
                      {k === DEFAULT_TIER && <Badge tone="orange">Popular</Badge>}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-ink-500">{t.directories}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="figure text-lg font-semibold text-ink-900">${t.dollars}</span>
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border",
                        active ? "border-ember-500 bg-ember-500 text-paper-100" : "border-ink-900/25"
                      )}
                    >
                      {active && <Check className="h-2.5 w-2.5" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-ink-900/10 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-ink-500">Total today</span>
              <span className="figure text-2xl font-semibold text-ink-900">${spec.dollars}</span>
            </div>
            <p className="mt-1 text-[12px] text-ink-400">One-off · {spec.directories} · do-follow only</p>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ember-500 text-[15px] font-semibold text-white transition hover:bg-ember-600 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Setting up…
              </>
            ) : (
              <>Continue to payment · ${spec.dollars}</>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-400">
            You&apos;ll get a private link to pay and track your order live. No account needed.
          </p>
        </Card>
      </div>
    </form>
  );
}
