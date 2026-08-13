import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { Masthead } from "@/components/masthead";
import { Footer } from "@/components/footer";
import { Tracker } from "@/components/tracker";
import "./globals.css";

// Fraunces for headlines — an optically-sized serif with real character, which
// is what makes this read as a register rather than a dashboard. Instrument Sans
// for body copy, JetBrains Mono for every figure and label.
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://launches.saasgrave.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Saasgrave Launches — the weekly register of what founders shipped",
    template: "%s · Saasgrave Launches",
  },
  description:
    "Launch your SaaS free on a weekly board that real makers vote on. Paste your URL and AI writes the listing. You keep a permanent product page and a dofollow backlink — long after launch week ends.",
  keywords: [
    "launch your saas",
    "product hunt alternative",
    "weekly launch platform",
    "startup directory",
    "dofollow backlink",
    "indie maker launchpad",
    "saas launch platform",
  ],
  openGraph: {
    title: "The weekly register of what founders shipped",
    description:
      "Launch free, get voted on by real makers, and keep the page and the backlink forever.",
    type: "website",
    siteName: "Saasgrave Launches",
  },
  twitter: {
    card: "summary_large_image",
    title: "The weekly register of what founders shipped",
    description:
      "Launch free, get voted on by real makers, and keep the page and the backlink forever.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper-50 font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE}/#org`,
                  name: "Saasgrave Launches",
                  url: SITE,
                  logo: `${SITE}/icon`,
                  parentOrganization: { "@type": "Organization", name: "Saasgrave" },
                  description:
                    "A weekly launchpad for makers who ship. Free to launch, with a dofollow backlink and a permanent product page.",
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE}/#website`,
                  url: SITE,
                  name: "Saasgrave Launches",
                  publisher: { "@id": `${SITE}/#org` },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${SITE}/products?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />

        <Masthead />
        <main>{children}</main>
        <Footer />

        {/* useSearchParams needs a boundary or every page opts out of static rendering. */}
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>

        <Toaster
          theme="light"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#fffdf9",
              border: "1px solid rgba(23,21,15,0.14)",
              borderRadius: "4px",
              color: "#17150f",
              boxShadow: "0 10px 40px -14px rgba(23,21,15,0.24)",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
