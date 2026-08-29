import type { Metadata } from "next";
import Link from "next/link";
import { Rubric } from "@/components/ui";
import { SchemaGenerator } from "@/components/tools/schema-generator";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "Free Schema Markup Generator — JSON-LD structured data",
  description:
    "Generate JSON-LD structured data for SoftwareApplication, Organization, FAQPage and Article. Copy the script tag straight into your head. Free, no signup.",
  keywords: [
    "schema markup generator",
    "json-ld generator",
    "structured data generator",
    "softwareapplication schema",
    "faq schema generator",
  ],
  alternates: { canonical: `${SITE}/tools/schema` },
};

export default function SchemaToolPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/tools" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
        ← Free tools
      </Link>
      <Rubric className="mb-3 mt-5">Free tool</Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">Schema markup generator</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
        Structured data is how search engines and assistants understand what a page is about. Pick a
        type, fill the fields, paste the script tag. Nothing leaves your browser.
      </p>

      <div className="mt-8">
        <SchemaGenerator />
      </div>

      <section className="mt-14 rounded-2xl border border-ink-900/10 bg-paper-100 p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">Two rules worth following</h2>
        <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-ink-600">
          <li>
            <strong className="text-ink-900">Only mark up what&apos;s on the page.</strong> Structured
            data that describes content a visitor can&apos;t see is against Google&apos;s guidelines and
            is the most common reason rich results get pulled.
          </li>
          <li>
            <strong className="text-ink-900">Validate before you ship.</strong> Run the page through
            Google&apos;s Rich Results Test and schema.org&apos;s validator — a single missing required
            field silently disables the whole block.
          </li>
        </ul>
      </section>
    </div>
  );
}
