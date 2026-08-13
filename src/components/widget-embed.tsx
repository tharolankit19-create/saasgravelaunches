"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, Rubric } from "@/components/ui";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

const KINDS = [
  {
    kind: "badge",
    name: "Badge",
    blurb: "The wide one. Shows your rank and live upvote count.",
    w: 248,
    h: 56,
  },
  {
    kind: "upvote",
    name: "Upvote chip",
    blurb: "A live counter that asks for the vote. Best in a site footer or header.",
    w: 150,
    h: 58,
  },
  {
    kind: "rank",
    name: "Rank strip",
    blurb: "Compact, and only worth using once you've actually placed.",
    w: 176,
    h: 48,
  },
] as const;

/**
 * The embed page's working surface.
 *
 * Three widgets, both themes, live previews, and the snippet already written in
 * HTML and Markdown. These are plain images, not scripts — a directory has no
 * business running JavaScript on somebody else's site, and an <img> can't break
 * their page.
 */
export function WidgetEmbed({ slug, siteUrl }: { slug: string; siteUrl: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState<string | null>(null);

  const target = `${siteUrl}/products/${slug}?ref=badge`;
  const src = (kind: string) =>
    `${siteUrl}/api/widget?slug=${encodeURIComponent(slug)}&kind=${kind}&theme=${theme}`;

  async function copy(id: string, code: string, kind: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(id);
      toast.success("Copied — paste it into your site.");
      trackEvent("badge_copy", { productSlug: slug, meta: { kind, theme, id } });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy. Select the snippet and copy it manually.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Rubric className="max-w-[200px]">Live widgets</Rubric>
        <div className="flex gap-1 border border-ink-900/14 bg-paper-100 p-0.5">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition",
                theme === t ? "bg-ink-900 text-paper-100" : "text-ink-500 hover:text-ink-900"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {KINDS.map((k) => {
          const html = `<a href="${target}" target="_blank" rel="noopener">\n  <img src="${src(k.kind)}" alt="Saasgrave Launches" width="${k.w}" height="${k.h}" />\n</a>`;
          const md = `[![Saasgrave Launches](${src(k.kind)})](${target})`;

          return (
            <Card key={k.kind} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-ink-900">{k.name}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{k.blurb}</p>
                </div>
              </div>

              <div
                className={cn(
                  "mt-4 flex justify-center border border-ink-900/10 p-6",
                  theme === "dark" ? "bg-ink-900" : "bg-paper-200/60"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(k.kind)} alt={`${k.name} widget`} width={k.w} height={k.h} />
              </div>

              <div className="mt-4 space-y-2">
                <Snippet
                  label="HTML"
                  code={html}
                  copied={copied === `${k.kind}-html`}
                  onCopy={() => copy(`${k.kind}-html`, html, k.kind)}
                />
                <Snippet
                  label="Markdown"
                  code={md}
                  copied={copied === `${k.kind}-md`}
                  onCopy={() => copy(`${k.kind}-md`, md, k.kind)}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-ink-500">
        The numbers update on their own — they&apos;re rendered when the image is requested and
        cached for a couple of minutes. Visits through any of these arrive tagged, so you can see in
        your analytics whether the widget earned its place.
      </p>
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
    <div className="border border-ink-900/12 bg-paper-200/50">
      <div className="flex items-center justify-between border-b border-ink-900/10 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-oxblood-600 hover:underline"
        >
          {copied ? <Check className="h-3 w-3 text-moss-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink-700">
        {code}
      </pre>
    </div>
  );
}
