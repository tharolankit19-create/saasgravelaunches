"use client";

import { useState } from "react";
import { Loader2, Sparkles, ExternalLink } from "lucide-react";
import { Card, Field, inputClass } from "@/components/ui";

/**
 * Operator tool: generate and publish a Premium+ article for a product. Calls
 * the admin-only generate endpoint; on success it hands back the live URL.
 */
export function ArticleGenerator() {
  const [f, setF] = useState({ productName: "", productUrl: "", tagline: "", category: "", productSlug: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!f.productName.trim() || !f.productUrl.trim()) return setError("Product name and URL are required.");
    setBusy(true);
    try {
      const res = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed.");
      setResult(data.url);
    } catch (err: any) {
      setError(err?.message || "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={generate} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" required>
            <input className={inputClass} value={f.productName} onChange={set("productName")} placeholder="Acme" />
          </Field>
          <Field label="Product URL" required>
            <input className={inputClass} value={f.productUrl} onChange={set("productUrl")} placeholder="https://acme.com" />
          </Field>
        </div>
        <Field label="Tagline" hint="— what it does">
          <input className={inputClass} value={f.tagline} onChange={set("tagline")} placeholder="invoicing that chases late payers for you" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <input className={inputClass} value={f.category} onChange={set("category")} placeholder="fintech / dev tools / marketing" />
          </Field>
          <Field label="Product slug" hint="— optional, links the article to a launch">
            <input className={inputClass} value={f.productSlug} onChange={set("productSlug")} placeholder="acme" />
          </Field>
        </div>

        {error && <p className="text-[13px] text-red-600">{error}</p>}
        {result && (
          <a
            href={result}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-xl border border-moss-500/40 bg-moss-500/5 px-3 py-2 text-[13px] font-medium text-moss-600"
          >
            Published → {result} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ember-500 px-6 text-[14px] font-medium text-white transition hover:bg-ember-600 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Writing…" : "Generate & publish article"}
        </button>
        <p className="text-[11px] text-ink-400">
          Uses the free AI ladder; falls back to a clean templated article if AI is unavailable.
          Publishes to /blog with dofollow links to the product.
        </p>
      </form>
    </Card>
  );
}
