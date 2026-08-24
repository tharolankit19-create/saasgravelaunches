import type { Metadata } from "next";
import Link from "next/link";
import { Rubric } from "@/components/ui";
import { LaunchPostGenerator } from "@/components/tools/launch-post-generator";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "Free Launch Post Generator — X, Show HN & LinkedIn copy",
  description:
    "Generate ready-to-post launch copy for X (Twitter), Show HN and LinkedIn from your product in one fill. Sounds like a real maker, not a press release. Free, no signup.",
  alternates: { canonical: `${SITE}/tools/launch-post` },
};

export default function LaunchPostPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/tools" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
        ← Free tools
      </Link>
      <Rubric className="mb-3 mt-5">Free tool</Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">Launch post generator</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
        Fill your product in once — get launch copy for X, Show HN and LinkedIn that reads like a
        real maker wrote it. Tweak, copy, post. Nothing leaves your browser.
      </p>
      <div className="mt-8">
        <LaunchPostGenerator />
      </div>
    </div>
  );
}
