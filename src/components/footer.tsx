import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { NewsletterForm } from "@/components/newsletter-form";
import { TinyStartupsBadge } from "@/components/tiny-startups-badge";
import { CATEGORIES } from "@/lib/categories";

const SAASGRAVE = process.env.NEXT_PUBLIC_SAASGRAVE_URL || "https://saasgrave.org";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-900/8 bg-paper-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={26} />
              <span className="text-[15px] font-semibold tracking-tight text-ink-900">
                Saasgrave Launches
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
              A weekly launchpad for makers who ship. Free to launch, a real dofollow backlink, and
              a page that keeps working after launch week.
            </p>
            <div className="mt-5 max-w-sm">
              <p className="mb-2 text-[13px] font-medium text-ink-900">The weekly digest</p>
              <NewsletterForm source="footer" />
            </div>
          </div>

          <FooterCol
            title="Launchpad"
            links={[
              { href: "/", label: "This week" },
              { href: "/leaderboard", label: "Leaderboard" },
              { href: "/planets", label: "Conquer the planets" },
              { href: "/products", label: "Directory" },
              { href: "/launch", label: "Launch a product" },
              { href: "/free-directories", label: "120 directories (free)" },
              { href: "/tools", label: "Free tools" },
              { href: "/guides", label: "Founder guides" },
              { href: "/alternatives", label: "Where to launch (compare)" },
              { href: "/blog", label: "Articles" },
              { href: "/directories", label: "Directory submission" },
              { href: "/pricing", label: "Pricing" },
            ]}
          />

          <FooterCol
            title="Categories"
            links={CATEGORIES.slice(0, 6).map((c) => ({
              href: `/categories/${c.slug}`,
              label: c.name,
            }))}
          />

          <FooterCol
            title="More"
            links={[
              { href: SAASGRAVE, label: "Saasgrave ↗", external: true },
              { href: "/login", label: "Sign in" },
              { href: "/register", label: "Create account" },
            ]}
          />
        </div>

        {/* As featured on — a marquee of the boards we launched on. Real dofollow
            backlinks both ways; append new badges to the array below. */}
        <div className="mt-10 border-t border-ink-900/8 pt-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
            As featured on
          </p>
          <div className="marquee-mask">
            <div className="marquee-track py-1">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex shrink-0 items-center gap-10" aria-hidden={dup === 1}>
                  <a
                    href="https://www.scrolllaunch.com/products/saasgrave-launches?ref=badge"
                    target="_blank"
                    rel="noopener"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://www.scrolllaunch.com/api/badge/saasgrave-launches"
                      alt="Featured on ScrollLaunch"
                      width="220"
                      height="48"
                      loading="lazy"
                    />
                  </a>
                  <a
                    href="https://startupfa.me/s/saasgrave?utm_source=ls.saasgrave.org"
                    target="_blank"
                    rel="noopener"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://startupfa.me/badges/featured-badge.webp"
                      alt="Saasgrave - Featured on Startup Fame"
                      width="171"
                      height="54"
                      loading="lazy"
                    />
                  </a>
                  <TinyStartupsBadge uid={dup} />
                  <a
                    href="https://tools.launchllama.co?utm_source=badge&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://tools.launchllama.co/featured-badge-white.png?v=2"
                      alt="As seen on Launch Llama Newsletter"
                      width="200"
                      height="50"
                      loading="lazy"
                    />
                  </a>
                  {/* tinyshelf: their verifier reads the server HTML and rejects any
                      rel="nofollow/sponsored/ugc". Keep this a plain server-rendered
                      anchor with the ?ref= intact and no rel attribute. */}
                  <a href="https://www.tinyshelf.co/?ref=ls.saasgrave.org" title="Featured on tinyshelf">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://www.tinyshelf.co/badge/tinyshelf-badge-dark-f4d1216a.svg"
                      alt="Featured on tinyshelf"
                      width="216"
                      height="64"
                      loading="lazy"
                    />
                  </a>
                  <a
                    href="https://nicklaunches.com/products/saasgrave-launches/?utm_source=ls.saasgrave.org&utm_medium=badge&utm_campaign=featured"
                    target="_blank"
                    rel="noopener"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://nicklaunches.com/badges/featured.png"
                      alt="Saasgrave Launches on Nick Launches"
                      width="244"
                      height="56"
                      loading="lazy"
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/8 pt-6 text-[12px] text-ink-400">
          <p>© {new Date().getFullYear()} Saasgrave Launches. Built for makers who ship.</p>
          <p>
            Part of{" "}
            <a href={SAASGRAVE} className="text-ink-700 hover:text-ember-600">
              Saasgrave
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            {l.external ? (
              <a href={l.href} className="text-[13px] text-ink-500 transition hover:text-ember-600">
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="text-[13px] text-ink-500 transition hover:text-ember-600">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
