import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Link2, LayoutList, ArrowUpRight, Code2, Megaphone, GitCompare, Bot, Braces } from "lucide-react";
import { Rubric, Card } from "@/components/ui";
import { ALL_DIRECTORIES } from "@/lib/directories";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "Free tools for founders — directories, launch checklist, UTM builder",
  description:
    "Free tools to launch and grow your SaaS: a 120 high-DR directory tracker, an interactive launch checklist, and a UTM link builder. No signup.",
  alternates: { canonical: `${SITE}/tools` },
};

const TOOLS = [
  {
    href: "/free-directories",
    icon: <LayoutList className="h-5 w-5" />,
    title: "120 Directory Tracker",
    body: `Every high-DR startup directory worth submitting to, with DR, do-follow status and a built-in tracker. ${ALL_DIRECTORIES.length} listed.`,
    tag: "Most used",
  },
  {
    href: "/tools/launch-checklist",
    icon: <ListChecks className="h-5 w-5" />,
    title: "SaaS Launch Checklist",
    body: "The 15 things that actually move the needle before, during and after launch day. Interactive, saved in your browser.",
  },
  {
    href: "/tools/launch-post",
    icon: <Megaphone className="h-5 w-5" />,
    title: "Launch Post Generator",
    body: "Ready-to-post launch copy for X, Show HN and LinkedIn from one fill. Sounds like a real maker.",
    tag: "New",
  },
  {
    href: "/tools/meta-tags",
    icon: <Code2 className="h-5 w-5" />,
    title: "Meta Tag & OG Generator",
    body: "SEO, Open Graph and Twitter tags with a live Google + social preview. Copy into your <head>.",
    tag: "New",
  },
  {
    href: "/tools/utm-builder",
    icon: <Link2 className="h-5 w-5" />,
    title: "UTM Link Builder",
    body: "Tag your launch links so you know which channel sent the users. Build, copy, done.",
  },
  {
    href: "/tools/llms-txt",
    icon: <Bot className="h-5 w-5" />,
    title: "llms.txt Generator",
    body: "Tell ChatGPT, Claude and Perplexity what your site is and which pages to read. One file, five minutes.",
    tag: "New",
  },
  {
    href: "/tools/schema",
    icon: <Braces className="h-5 w-5" />,
    title: "Schema Markup Generator",
    body: "JSON-LD for SoftwareApplication, Organization, FAQ and Article. Copy the script tag into your head.",
    tag: "New",
  },
  {
    href: "/alternatives",
    icon: <GitCompare className="h-5 w-5" />,
    title: "Where to launch your SaaS",
    body: "An honest comparison of Product Hunt, BetaList, Peerlist and more — free vs paid, dofollow vs nofollow.",
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <Rubric className="mb-3 max-w-sm">Free forever</Rubric>
      <h1 className="font-serif text-display font-semibold text-ink-900">Free tools for founders</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-700">
        Small, sharp tools to launch and grow — no signup, nothing leaves your browser. Built by the
        team behind Saasgrave Launches.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <Card className="flex h-full flex-col p-6 transition hover:shadow-lift">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ember-500/10 text-ember-600">
                  {t.icon}
                </span>
                {t.tag && (
                  <span className="rounded-full border border-ember-500/30 bg-ember-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ember-600">
                    {t.tag}
                  </span>
                )}
              </div>
              <h2 className="mt-4 font-serif text-lg font-semibold text-ink-900 group-hover:text-ember-600">
                {t.title}
              </h2>
              <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-500">{t.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ember-600">
                Open <ArrowUpRight className="h-3 w-3" />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-ink-900/12 bg-paper-100 p-6 text-center">
        <p className="text-[15px] text-ink-700">
          Ready to launch?{" "}
          <Link href="/launch" className="font-semibold text-ember-600 hover:underline">
            Paste your URL and go live in a minute →
          </Link>
        </p>
      </div>
    </div>
  );
}
