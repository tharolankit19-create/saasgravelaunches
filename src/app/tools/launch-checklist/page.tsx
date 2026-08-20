import type { Metadata } from "next";
import Link from "next/link";
import { Rubric } from "@/components/ui";
import { LaunchChecklist } from "@/components/tools/launch-checklist";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "The SaaS Launch Checklist — everything to do before, during & after",
  description:
    "A free, interactive SaaS launch checklist for indie founders. 15 things to do before, during and after launch day. Saved in your browser.",
  alternates: { canonical: `${SITE}/tools/launch-checklist` },
};

export default function LaunchChecklistPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/tools" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
        ← Free tools
      </Link>
      <Rubric className="mb-3 mt-5">Free tool</Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">The SaaS launch checklist</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
        The things that actually move the needle before, during and after launch day. Tick them off
        — it&apos;s saved in your browser.
      </p>
      <div className="mt-8">
        <LaunchChecklist />
      </div>
    </div>
  );
}
