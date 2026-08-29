"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type Kind = "software" | "organization" | "faq" | "article";

const KINDS: { key: Kind; label: string; blurb: string }[] = [
  { key: "software", label: "SoftwareApplication", blurb: "For a SaaS or app product page" },
  { key: "organization", label: "Organization", blurb: "For your homepage / about page" },
  { key: "faq", label: "FAQPage", blurb: "For a page with real Q&A on it" },
  { key: "article", label: "Article", blurb: "For a blog post or guide" },
];

/**
 * JSON-LD structured data generator. Fill the fields, get a script tag to paste
 * into <head>. Client-only — nothing is sent anywhere.
 */
export function SchemaGenerator() {
  const [kind, setKind] = useState<Kind>("software");
  const [f, setF] = useState({
    name: "",
    url: "",
    description: "",
    logo: "",
    price: "",
    currency: "USD",
    category: "BusinessApplication",
    author: "",
    datePublished: "",
    q1: "",
    a1: "",
    q2: "",
    a2: "",
  });
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const name = f.name || "Your Product";
  const url = f.url || "https://yourproduct.com";
  const description = f.description || "A short description of what it does.";

  function build(): object {
    if (kind === "organization") {
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name,
        url,
        description,
        ...(f.logo ? { logo: f.logo } : {}),
      };
    }
    if (kind === "faq") {
      const pairs = [
        { q: f.q1, a: f.a1 },
        { q: f.q2, a: f.a2 },
      ].filter((p) => p.q.trim() && p.a.trim());
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: (pairs.length ? pairs : [{ q: "A real question", a: "A direct answer." }]).map((p) => ({
          "@type": "Question",
          name: p.q,
          acceptedAnswer: { "@type": "Answer", text: p.a },
        })),
      };
    }
    if (kind === "article") {
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: name,
        description,
        mainEntityOfPage: url,
        ...(f.author ? { author: { "@type": "Person", name: f.author } } : {}),
        ...(f.datePublished ? { datePublished: f.datePublished } : {}),
      };
    }
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name,
      url,
      description,
      applicationCategory: f.category,
      operatingSystem: "Web",
      ...(f.logo ? { image: f.logo } : {}),
      offers: {
        "@type": "Offer",
        price: f.price || "0",
        priceCurrency: f.currency || "USD",
      },
    };
  }

  const output = `<script type="application/ld+json">\n${JSON.stringify(build(), null, 2)}\n</script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-900">Type</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  kind === k.key
                    ? "border-ember-500/60 bg-ember-500/[0.04]"
                    : "border-ink-900/12 hover:border-ink-900/30"
                )}
              >
                <span className="block font-mono text-[12px] font-semibold text-ink-900">{k.label}</span>
                <span className="mt-0.5 block text-[11.5px] text-ink-500">{k.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <Field label={kind === "article" ? "Headline" : "Name"} required>
          <input className={inputClass} value={f.name} onChange={set("name")} placeholder="Acme" />
        </Field>
        <Field label="URL">
          <input className={inputClass} value={f.url} onChange={set("url")} placeholder="https://acme.com" />
        </Field>
        <Field label="Description">
          <textarea
            className={cn(inputClass, "min-h-[70px] resize-y")}
            value={f.description}
            onChange={set("description")}
            placeholder="What it does, in a sentence or two."
          />
        </Field>

        {kind === "software" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price" hint="— 0 for free">
              <input className={inputClass} value={f.price} onChange={set("price")} placeholder="0" />
            </Field>
            <Field label="Currency">
              <input className={inputClass} value={f.currency} onChange={set("currency")} placeholder="USD" />
            </Field>
            <Field label="Category">
              <select className={inputClass} value={f.category} onChange={set("category")}>
                <option>BusinessApplication</option>
                <option>DeveloperApplication</option>
                <option>DesignApplication</option>
                <option>FinanceApplication</option>
                <option>SecurityApplication</option>
                <option>WebApplication</option>
              </select>
            </Field>
          </div>
        )}

        {(kind === "software" || kind === "organization") && (
          <Field label="Logo / image URL">
            <input className={inputClass} value={f.logo} onChange={set("logo")} placeholder="https://acme.com/logo.png" />
          </Field>
        )}

        {kind === "article" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author">
              <input className={inputClass} value={f.author} onChange={set("author")} placeholder="Jane Doe" />
            </Field>
            <Field label="Published" hint="— YYYY-MM-DD">
              <input className={inputClass} value={f.datePublished} onChange={set("datePublished")} placeholder="2026-08-29" />
            </Field>
          </div>
        )}

        {kind === "faq" && (
          <div className="grid gap-4">
            <Field label="Question 1">
              <input className={inputClass} value={f.q1} onChange={set("q1")} placeholder="Is there a free plan?" />
            </Field>
            <Field label="Answer 1">
              <textarea className={cn(inputClass, "min-h-[60px] resize-y")} value={f.a1} onChange={set("a1")} placeholder="Yes — up to 10 invoices a month." />
            </Field>
            <Field label="Question 2">
              <input className={inputClass} value={f.q2} onChange={set("q2")} placeholder="Can I cancel any time?" />
            </Field>
            <Field label="Answer 2">
              <textarea className={cn(inputClass, "min-h-[60px] resize-y")} value={f.a2} onChange={set("a2")} placeholder="Yes, from the billing page." />
            </Field>
          </div>
        )}
      </div>

      <div>
        <div className="relative rounded-xl border border-ink-900/10 bg-ink-900 p-4">
          <button
            onClick={copy}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-white/20"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-paper-200">
{output}
          </pre>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-500">
          Paste this into your page&apos;s <code className="rounded bg-paper-200 px-1 py-0.5 font-mono text-[12px]">&lt;head&gt;</code>.
          Only mark up what is genuinely on the page — marking up FAQs that
          aren&apos;t visible is against Google&apos;s guidelines and can cost you the rich result.
        </p>
      </div>
    </div>
  );
}
