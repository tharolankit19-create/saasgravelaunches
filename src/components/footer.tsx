import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { NewsletterForm } from "@/components/newsletter-form";
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
              { href: "/products", label: "Directory" },
              { href: "/launch", label: "Launch a product" },
              { href: "/pricing", label: "Advertise" },
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

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/8 pt-6 text-[12px] text-ink-400">
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
