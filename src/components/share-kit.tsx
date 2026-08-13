"use client";

import { useState } from "react";
import { Check, Copy, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

/**
 * The share kit.
 *
 * Launches are won in the first hour, by the maker telling people. The thing
 * that stops them isn't willingness — it's the blank box. So the post is
 * already written, in the three shapes that actually get posted: the launch,
 * the rank, and the ask for feedback. One click posts it, one click copies it.
 */
export function ShareKit({
  url,
  name,
  tagline,
  rank,
  upvotes,
  slug,
  className,
}: {
  url: string;
  name: string;
  tagline: string;
  rank?: number | null;
  upvotes?: number;
  slug: string;
  className?: string;
}) {
  const [copied, setCopied] = useState<number | null>(null);

  const posts: { label: string; text: string }[] = [
    {
      label: "Launch day",
      text: `I just launched ${name} on Saasgrave Launches.\n\n${tagline}\n\nIt's live on this week's board — an upvote would genuinely help. 👇`,
    },
    rank && rank <= 3
      ? {
          label: `You're #${rank}`,
          text: `${name} is #${rank} on Saasgrave Launches this week. 🏆\n\n${tagline}\n\nThank you to everyone who upvoted.`,
        }
      : {
          label: "Climbing",
          text: `${name} is on the board this week on Saasgrave Launches${
            upvotes ? ` — ${upvotes} upvotes so far` : ""
          }.\n\n${tagline}\n\nStill time to help it climb 👇`,
        },
    {
      label: "Asking for feedback",
      text: `Put ${name} in front of other makers today.\n\n${tagline}\n\nIf you've got 30 seconds, tell me what you'd change — the comments are open.`,
    },
  ];

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(i);
      toast.success("Copied — paste it anywhere.");
      trackEvent("share", { productSlug: slug, meta: { channel: "copy", variant: i } });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  }

  function postToX(text: string, i: number) {
    trackEvent("share", { productSlug: slug, meta: { channel: "x", variant: i } });
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener"
    );
  }

  return (
    <div className={cn("", className)}>
      <p className="text-[13px] font-semibold text-ink-900">Share it — the post is already written</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
        The launches that win the week are the ones whose maker shared them in the first hour.
        Pick one, tweak it if you like, post it.
      </p>

      <ul className="mt-4 space-y-3">
        {posts.map((p, i) => (
          <li key={p.label} className="rounded-xl border border-ink-900/10 bg-paper-200/40 p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-400">{p.label}</p>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-700">
              {p.text}
            </p>
            <p className="mt-2 truncate text-[12px] text-ink-400">{url}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => postToX(p.text, i)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-ember-500"
              >
                <XIcon /> Post on X
              </button>
              <button
                type="button"
                onClick={() => copy(p.text, i)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-900/10 bg-paper-100 px-3 py-1.5 text-[13px] font-medium text-ink-700 transition hover:border-ember-500/40 hover:text-ember-600"
              >
                {copied === i ? (
                  <Check className="h-3.5 w-3.5 text-moss-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied === i ? "Copied" : "Copy"}
              </button>
              {i === 0 && (
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener"
                  onClick={() =>
                    trackEvent("share", { productSlug: slug, meta: { channel: "linkedin" } })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-900/10 bg-paper-100 px-3 py-1.5 text-[13px] font-medium text-ink-700 transition hover:border-ember-500/40 hover:text-ember-600"
                >
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
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
