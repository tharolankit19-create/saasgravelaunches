import type { Metadata } from "next";
import Link from "next/link";
import { Rubric } from "@/components/ui";
import { MetaTagGenerator } from "@/components/tools/meta-tag-generator";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "Free Meta Tag & Open Graph Generator — SEO + social preview",
  description:
    "Generate SEO, Open Graph and Twitter meta tags for your site in seconds, with a live Google and social-card preview. Free, no signup, nothing leaves your browser.",
  alternates: { canonical: `${SITE}/tools/meta-tags` },
};

export default function MetaTagsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/tools" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
        ← Free tools
      </Link>
      <Rubric className="mb-3 mt-5">Free tool</Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">Meta tag & Open Graph generator</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
        Paste your title, description and URL — get a clean block of SEO, Open Graph and Twitter tags
        to drop into your <code className="rounded bg-paper-200 px-1 py-0.5 font-mono text-[13px]">&lt;head&gt;</code>,
        with a live preview. Nothing leaves your browser.
      </p>
      <div className="mt-8">
        <MetaTagGenerator />
      </div>
    </div>
  );
}
