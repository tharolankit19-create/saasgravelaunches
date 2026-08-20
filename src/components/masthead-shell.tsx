"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "This week" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/spotlight", label: "Spotlight" },
  { href: "/products", label: "Directory" },
  { href: "/tools", label: "Free tools" },
  { href: "/pricing", label: "Pricing" },
];

/**
 * The masthead.
 *
 * At rest it's a slim rule — one line, out of the way, so the headline is the
 * first thing on the page. The moment you scroll it opens out into the full
 * register masthead: navigation, the live week, search and the launch action.
 *
 * The state flips once at a 24px threshold rather than tracking scroll
 * continuously, so it can't judder or fight a momentum scroll on iOS.
 */
export function MastheadShell({
  weekLabel,
  liveCount,
  userSlot,
}: {
  weekLabel: string;
  liveCount: number;
  /** The server-rendered user menu or sign-in link. */
  userSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  // Only the landing page starts collapsed. Anywhere else, the masthead is
  // navigation and should be there immediately.
  const isLanding = pathname === "/";
  const [open, setOpen] = useState(!isLanding);

  useEffect(() => {
    if (!isLanding) {
      setOpen(true);
      return;
    }
    const onScroll = () => setOpen(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-paper-50/92 backdrop-blur-md transition-all duration-300",
        open ? "border-ink-900/12" : "border-ink-900/8"
      )}
    >
      {/* The orange rule that runs the width of the page — the masthead's spine. */}
      <div className="h-[3px] w-full bg-ember-500" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── row one: always present ── */}
        <div
          className={cn(
            "flex items-center gap-4 transition-all duration-300",
            open ? "h-16" : "h-12"
          )}
        >
          <Logo compact={!open} />

          {/* The live week sits in the bar so it's true on every page. */}
          <span
            className={cn(
              "hidden items-center gap-2 border-l border-ink-900/12 pl-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 transition-opacity duration-300 sm:flex",
              open ? "opacity-100" : "opacity-0"
            )}
          >
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-moss-500" />
            {weekLabel} · {liveCount} live
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/launch"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[3px] bg-ink-900 font-medium text-paper-100 transition hover:bg-ember-500",
                open ? "h-9 px-3.5 text-[13px]" : "h-8 px-3 text-[12px]"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Launch
            </Link>
            {userSlot}
          </div>
        </div>

        {/* ── row two: opens on scroll ── */}
        <div
          className={cn(
            "grid overflow-hidden transition-all duration-300",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <nav className="flex items-center gap-1 overflow-x-auto border-t border-ink-900/10 py-2">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "shrink-0 rounded-[2px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition",
                    active
                      ? "bg-ink-900 text-paper-100"
                      : "text-ink-500 hover:bg-paper-200 hover:text-ink-900"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
            {/* A real search — native GET to the directory, which does the
                name/tagline filter server-side. */}
            <form
              action="/products"
              role="search"
              className="ml-auto hidden shrink-0 items-center sm:flex"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="h-8 w-44 rounded-[3px] border border-ink-900/14 bg-paper-100 pl-8 pr-3 text-[13px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:w-56 focus:border-ember-500/50"
                />
              </div>
            </form>
          </nav>
        </div>
      </div>
    </header>
  );
}
