"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

/**
 * The one action on the landing page: paste a URL, press Launch.
 *
 * It doesn't try to autofill here — it carries the URL to /launch, which runs
 * the scrape+AI once the maker is signed in. That keeps the hero a single
 * decision (start) rather than a form, and means an anonymous visitor is sent
 * to sign in with their URL preserved instead of hitting a wall.
 */
export function HeroLauncher() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    trackEvent("hero_launch", { meta: { hasUrl: Boolean(value) } });
    router.push(value ? `/launch?url=${encodeURIComponent(value)}` : "/launch");
  }

  return (
    <form onSubmit={go} className="mx-auto flex w-full max-w-xl flex-col gap-2 sm:flex-row">
      <div
        className={cn(
          "flex flex-1 items-center gap-2 rounded-[4px] border-2 border-ink-900 bg-paper-100 px-3.5",
          "focus-within:border-oxblood-500"
        )}
      >
        <Link2 className="h-4 w-4 shrink-0 text-ink-400" />
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourproduct.com"
          className="h-12 w-full bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
          aria-label="Your product URL"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[4px] bg-oxblood-500 px-7 text-[15px] font-medium text-paper-100 transition hover:bg-oxblood-600 active:translate-y-px"
      >
        Launch
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
