import type { Metadata } from "next";
import Link from "next/link";
import { Rubric, Card } from "@/components/ui";
import { UtmBuilder } from "@/components/tools/utm-builder";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "Free UTM Builder — build tracked campaign links in seconds",
  description:
    "A free UTM link builder for founders. Add source, medium and campaign to any URL and copy a clean tracked link. No signup.",
  alternates: { canonical: `${SITE}/tools/utm-builder` },
};

export default function UtmBuilderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/tools" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
        ← Free tools
      </Link>
      <Rubric className="mb-3 mt-5">Free tool</Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">UTM link builder</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
        Tag your launch links so you actually know which channel sent the users. Build a clean UTM
        link, copy it, done — nothing leaves your browser.
      </p>
      <Card className="mt-8 p-6 sm:p-8">
        <UtmBuilder />
      </Card>
    </div>
  );
}
