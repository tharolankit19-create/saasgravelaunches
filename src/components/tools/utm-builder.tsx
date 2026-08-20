"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/ui";

/**
 * A UTM builder — pure client, no backend. Real, useful, and a clean SEO page
 * ("utm builder", "utm link generator") that keeps people on the domain.
 */
const SOURCES = ["twitter", "linkedin", "producthunt", "reddit", "newsletter", "google", "saasgrave"];

export function UtmBuilder() {
  const [base, setBase] = useState("");
  const [f, setF] = useState({ source: "", medium: "", campaign: "", term: "", content: "" });
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const result = useMemo(() => {
    if (!base.trim()) return "";
    let url: URL;
    try {
      url = new URL(base.trim().startsWith("http") ? base.trim() : `https://${base.trim()}`);
    } catch {
      return "";
    }
    const map: Record<string, string> = {
      utm_source: f.source,
      utm_medium: f.medium,
      utm_campaign: f.campaign,
      utm_term: f.term,
      utm_content: f.content,
    };
    for (const [k, v] of Object.entries(map)) {
      if (v.trim()) url.searchParams.set(k, v.trim().replace(/\s+/g, "_").toLowerCase());
    }
    return url.toString();
  }, [base, f]);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied.");
    } catch {
      toast.error("Couldn't copy — select it manually.");
    }
  }

  return (
    <div className="space-y-5">
      <Field label="Destination URL" required>
        <input
          value={base}
          onChange={(e) => setBase(e.target.value)}
          placeholder="yourproduct.com/pricing"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source" hint="where the link lives">
          <input
            value={f.source}
            onChange={(e) => set("source", e.target.value)}
            placeholder="twitter"
            list="utm-sources"
            className={inputClass}
          />
          <datalist id="utm-sources">
            {SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Medium" hint="the channel type">
          <input
            value={f.medium}
            onChange={(e) => set("medium", e.target.value)}
            placeholder="social"
            className={inputClass}
          />
        </Field>
        <Field label="Campaign">
          <input
            value={f.campaign}
            onChange={(e) => set("campaign", e.target.value)}
            placeholder="launch_week"
            className={inputClass}
          />
        </Field>
        <Field label="Content" hint="a/b or placement">
          <input
            value={f.content}
            onChange={(e) => set("content", e.target.value)}
            placeholder="hero_button"
            className={inputClass}
          />
        </Field>
      </div>

      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
          Your tracked link
        </p>
        <div className="flex items-stretch gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-ink-900/20 bg-paper-100 px-3.5 py-2.5 font-mono text-[13px] text-ink-900">
            {result || <span className="text-ink-400">Fill in a destination URL to build your link…</span>}
          </div>
          <button
            type="button"
            onClick={copy}
            disabled={!result}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink-900 px-4 text-[13px] font-medium text-paper-100 transition hover:bg-ember-500 disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
