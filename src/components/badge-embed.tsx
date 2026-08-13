"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

/**
 * "Featured on Saasgrave Launches" — the badge a maker puts on their own site.
 *
 * This is the loop that compounds: the product page sends them a dofollow
 * link, the badge sends one back, and every visitor to their site learns the
 * launchpad exists. Makers only bother when it's one copy-paste and it looks
 * good, so both themes are offered and the snippet is pre-written.
 */
export function BadgeEmbed({
  slug,
  siteUrl,
  className,
}: {
  slug: string;
  siteUrl: string;
  className?: string;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState<"html" | "md" | null>(null);

  const badgeSrc = `${siteUrl}/api/badge?slug=${encodeURIComponent(slug)}&theme=${theme}`;
  const target = `${siteUrl}/products/${slug}?ref=badge`;

  const html = `<a href="${target}" target="_blank" rel="noopener">
  <img src="${badgeSrc}" alt="Featured on Saasgrave Launches" width="250" height="54" />
</a>`;

  const markdown = `[![Featured on Saasgrave Launches](${badgeSrc})](${target})`;

  async function copy(kind: "html" | "md") {
    try {
      await navigator.clipboard.writeText(kind === "html" ? html : markdown);
      setCopied(kind);
      toast.success(kind === "html" ? "HTML copied." : "Markdown copied — paste it in your README.");
      trackEvent("badge_copy", { productSlug: slug, meta: { kind, theme } });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy. Select the snippet and copy it manually.");
    }
  }

  return (
    <div className={cn("", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink-900">Put the badge on your site</p>
        <div className="flex gap-1 rounded-lg border border-ink-900/10 bg-paper-100 p-0.5">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[12px] font-medium capitalize transition",
                theme === t ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
        It shows your rank and live upvote count, and links back to your page. Makers who add it
        keep getting traffic long after their week closes.
      </p>

      <div
        className={cn(
          "mt-4 flex justify-center rounded-xl border border-ink-900/8 p-6",
          theme === "dark" ? "bg-ink-900" : "bg-paper-200/60"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badgeSrc} alt="Featured on Saasgrave Launches" width={250} height={54} />
      </div>

      <div className="mt-4 space-y-2">
        <Snippet code={html} onCopy={() => copy("html")} copied={copied === "html"} label="HTML" />
        <Snippet
          code={markdown}
          onCopy={() => copy("md")}
          copied={copied === "md"}
          label="Markdown"
        />
      </div>
    </div>
  );
}

function Snippet({
  code,
  label,
  copied,
  onCopy,
}: {
  code: string;
  label: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink-900/10 bg-paper-200/50">
      <div className="flex items-center justify-between border-b border-ink-900/8 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ember-600 hover:underline"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-moss-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink-700">
        {code}
      </pre>
    </div>
  );
}
