import type { Metadata } from "next";
import Link from "next/link";
import { Rubric } from "@/components/ui";
import { TrackOnMount } from "@/components/tracker";
import { DirectoryTracker } from "@/components/directory-tracker";
import { ALL_DIRECTORIES } from "@/lib/directories";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";
const dofollow = ALL_DIRECTORIES.filter((d) => d.dofollow).length;

export const metadata: Metadata = {
  title: "120 High-DR Startup Directories to Submit Your SaaS (2026) — Free Tracker",
  description:
    "The free, hand-picked list of 120 high Domain Rating startup directories for 2026 — with DR, do-follow status and a built-in tracker (done / skip / visit). Submit your SaaS and build real backlinks.",
  alternates: { canonical: `${SITE}/free-directories` },
  openGraph: {
    title: "120 High-DR Startup Directories (2026) — Free Submission Tracker",
    description:
      "Every high-DR directory worth submitting your SaaS to, with a built-in progress tracker. Free.",
    url: `${SITE}/free-directories`,
  },
};

export default function FreeDirectoriesPage() {
  // ItemList structured data — this is what earns the rich result & AI citations.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "120 High-DR Startup Directories 2026",
    numberOfItems: ALL_DIRECTORIES.length,
    itemListElement: ALL_DIRECTORIES.slice(0, 60).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: d.name,
      url: d.url,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <TrackOnMount event="free_directories_view" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Rubric className="mb-3 max-w-sm">Free tool</Rubric>
      <h1 className="max-w-3xl font-serif text-display font-semibold text-ink-900">
        120 high-DR startup directories to submit to
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-700">
        Every directory worth your time in 2026, hand-picked and ranked by Domain Rating — with
        do-follow status and a built-in tracker so you never lose your place.{" "}
        <strong>{dofollow} give a do-follow link.</strong> Mark them <em>done</em>, <em>skip</em> the
        ones that don&apos;t fit, and <em>visit</em> to submit. It&apos;s saved in your browser.
      </p>
      <p className="mt-2 max-w-2xl text-[14px] text-ink-500">
        Want to skip the grind?{" "}
        <Link href="/directories" className="font-medium text-ember-600 hover:underline">
          We&apos;ll submit you to all of them by hand →
        </Link>
      </p>

      <div className="mt-10">
        <DirectoryTracker directories={ALL_DIRECTORIES} />
      </div>
    </div>
  );
}
