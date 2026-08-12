import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Tracker } from "@/components/tracker";
import "./globals.css";

// Same pairing as Saasgrave — Bricolage Grotesque throughout, JetBrains Mono
// for figures and labels. The two products should feel related on sight.
const grotesk = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://launches.saasgrave.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Saasgrave Launches — launch your SaaS, free, every week",
    template: "%s · Saasgrave Launches",
  },
  description:
    "A weekly launchpad for makers who ship. Paste your URL, AI writes the listing, launch in a minute. Free forever, with a real dofollow backlink and a page that keeps ranking.",
  keywords: [
    "launch platform",
    "product hunt alternative",
    "launch your saas",
    "startup directory",
    "dofollow backlink",
    "indie maker launchpad",
    "weekly product launches",
  ],
  openGraph: {
    title: "Launch your SaaS. Free, every week.",
    description:
      "Paste your URL — AI writes the listing. Launch in a minute, climb the weekly board, keep the backlink forever.",
    type: "website",
    siteName: "Saasgrave Launches",
  },
  twitter: {
    card: "summary_large_image",
    title: "Launch your SaaS. Free, every week.",
    description:
      "Paste your URL — AI writes the listing. Launch in a minute, climb the weekly board, keep the backlink forever.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
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

        <Navbar />
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
              background: "#ffffff",
              border: "1px solid rgba(18,17,15,0.10)",
              color: "#12110f",
              boxShadow: "0 10px 40px -12px rgba(18,17,15,0.18)",
            },
          }}
        />
      </body>
    </html>
  );
}
