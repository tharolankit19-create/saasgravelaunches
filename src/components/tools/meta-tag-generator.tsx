"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Meta / Open Graph tag generator. Fill a few fields, get a clean block of SEO
 * + OG + Twitter tags to paste in your <head>, with a live Google + social
 * preview. Pure client — nothing leaves the browser.
 */
export function MetaTagGenerator() {
  const [f, setF] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    site: "",
    twitter: "",
  });
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const esc = (v: string) => v.replace(/"/g, "&quot;");
  const title = f.title || "Your product name";
  const desc = f.description || "A short, punchy description of what your product does.";
  const url = f.url || "https://yourproduct.com";
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "yourproduct.com";
    }
  })();

  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    ``,
    `<!-- Open Graph -->`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    f.site ? `<meta property="og:site_name" content="${esc(f.site)}" />` : null,
    f.image ? `<meta property="og:image" content="${esc(f.image)}" />` : null,
    ``,
    `<!-- Twitter -->`,
    `<meta name="twitter:card" content="${f.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    f.image ? `<meta name="twitter:image" content="${esc(f.image)}" />` : null,
    f.twitter ? `<meta name="twitter:site" content="@${f.twitter.replace(/^@/, "")}" />` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(tags);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* inputs */}
      <div className="grid gap-4">
        <Field label="Page title" hint="— 50–60 chars is ideal">
          <input className={inputClass} value={f.title} onChange={set("title")} maxLength={70} placeholder="Acme — invoicing for freelancers" />
        </Field>
        <Field label="Description" hint="— 150–160 chars">
          <textarea className={cn(inputClass, "min-h-[72px] resize-y")} value={f.description} onChange={set("description")} maxLength={200} placeholder="Send invoices, get paid, and chase late payers automatically." />
        </Field>
        <Field label="Canonical URL">
          <input className={inputClass} value={f.url} onChange={set("url")} inputMode="url" placeholder="https://acme.com" />
        </Field>
        <Field label="Preview image URL" hint="— 1200×630 for the big card">
          <input className={inputClass} value={f.image} onChange={set("image")} inputMode="url" placeholder="https://acme.com/og.png" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name">
            <input className={inputClass} value={f.site} onChange={set("site")} placeholder="Acme" />
          </Field>
          <Field label="X (Twitter) handle">
            <input className={inputClass} value={f.twitter} onChange={set("twitter")} placeholder="acme" />
          </Field>
        </div>
      </div>

      {/* output + preview */}
      <div className="grid gap-4">
        {/* google preview */}
        <div className="rounded-2xl border border-ink-900/10 bg-paper-100 p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">Google preview</p>
          <p className="truncate text-[13px] text-ink-500">{host}</p>
          <p className="truncate text-[18px] leading-tight text-[#1a0dab]">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-600">{desc}</p>
        </div>

        {/* code */}
        <div className="relative rounded-2xl border border-ink-900/10 bg-ink-900 p-4">
          <button
            onClick={copy}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-white/20"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-paper-200">
{tags}
          </pre>
        </div>
      </div>
    </div>
  );
}
