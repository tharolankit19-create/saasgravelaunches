import type { Metadata } from "next";
import Link from "next/link";
import { Rubric } from "@/components/ui";
import { LlmsTxtGenerator } from "@/components/tools/llms-txt-generator";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "Free llms.txt Generator — make your site readable to AI assistants",
  description:
    "Generate an llms.txt file for your site in seconds. Tell ChatGPT, Claude, Perplexity and other assistants what your product is and which pages to read. Free, no signup.",
  keywords: ["llms.txt generator", "llms txt", "ai seo", "make site readable to ai", "llmstxt"],
  alternates: { canonical: `${SITE}/tools/llms-txt` },
};

const FAQ = [
  {
    q: "What is llms.txt?",
    a: "A plain markdown file at your site root that tells language models what your site is and which pages are worth reading. Think robots.txt, but for assistants rather than crawlers — and instead of blocking, it curates.",
  },
  {
    q: "Does it actually do anything yet?",
    a: "It's a convention, not a standard any model is obliged to follow. Some assistants and agent frameworks fetch it; many don't yet. It costs you five minutes and one static file, and it's a well-structured summary of your site either way.",
  },
  {
    q: "Where do I put the file?",
    a: "At your site root, so it serves from yoursite.com/llms.txt as text/plain or text/markdown. If you use Next.js, a route handler at app/llms.txt/route.ts works.",
  },
  {
    q: "Is this the same as robots.txt?",
    a: "No. robots.txt controls which crawlers may fetch which paths. llms.txt doesn't grant or deny anything — it's a curated index that helps a model understand your site quickly. You want both.",
  },
];

export default function LlmsTxtToolPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/tools" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
        ← Free tools
      </Link>
      <Rubric className="mb-3 mt-5">Free tool</Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">llms.txt generator</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
        Tell ChatGPT, Claude, Perplexity and other assistants what your product is and which pages to
        read. Fill this in, copy the file, drop it at your site root. Nothing leaves your browser.
      </p>

      <div className="mt-8">
        <LlmsTxtGenerator />
      </div>

      <section className="mt-14">
        <h2 className="font-serif text-section font-semibold text-ink-900">Common questions</h2>
        <div className="mt-5 space-y-4">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-xl border border-ink-900/10 bg-paper-100 p-5">
              <p className="text-[14px] font-semibold text-ink-900">{f.q}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[13px] text-ink-500">
          Ours is live at{" "}
          <a href="/llms.txt" className="font-medium text-ember-600 hover:underline">
            /llms.txt
          </a>{" "}
          if you want a real example to copy the shape of.
        </p>
      </section>
    </div>
  );
}
