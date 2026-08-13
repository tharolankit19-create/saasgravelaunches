"use client";

import { useState } from "react";
import { Check, Link2, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

/**
 * Share, with the copy already written.
 *
 * Makers share launches when the post writes itself; asking them to compose
 * one is where sharing dies. The text names the product, the rank if it has
 * one, and the page — nothing else.
 */
export function ShareRow({
  url,
  name,
  tagline,
  rank,
  slug,
  className,
}: {
  url: string;
  name: string;
  tagline: string;
  rank?: number | null;
  slug?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const line = rank
    ? `${name} is #${rank} on Saasgrave Launches this week — ${tagline}`
    : `Just launched ${name} on Saasgrave Launches — ${tagline}`;

  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(line)}&url=${encodeURIComponent(url)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${line}\n${url}`);
      setCopied(true);
      toast.success("Copied — paste it anywhere.");
      trackEvent("share", { productSlug: slug, meta: { channel: "copy" } });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the URL and copy it manually.");
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-ink-900/10 bg-paper-100 px-3 py-1.5 text-[13px] font-medium text-ink-700 transition hover:border-oxblood-500/40 hover:text-oxblood-600";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <a
        href={xHref}
        target="_blank"
        rel="noopener"
        className={btn}
        onClick={() => trackEvent("share", { productSlug: slug, meta: { channel: "x" } })}
      >
        <XIcon /> Share on X
      </a>
      <a
        href={liHref}
        target="_blank"
        rel="noopener"
        className={btn}
        onClick={() => trackEvent("share", { productSlug: slug, meta: { channel: "linkedin" } })}
      >
        <Linkedin className="h-3.5 w-3.5" /> LinkedIn
      </a>
      <button onClick={copy} className={btn}>
        {copied ? <Check className="h-3.5 w-3.5 text-moss-500" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
