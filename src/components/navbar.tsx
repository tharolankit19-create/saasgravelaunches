import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { LinkButton } from "@/components/ui";

const NAV = [
  { href: "/", label: "This week" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/products", label: "Directory" },
  { href: "/pricing", label: "Advertise" },
];

export async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  let avatar: string | null = null;
  let isAdmin = false;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    name = data?.full_name || user.email?.split("@")[0] || null;
    avatar = data?.avatar_url || null;

    // Read the admin flag past RLS, same as the /admin gate does.
    try {
      const { data: row } = await createAdminClient()
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = Boolean(row?.is_admin);
    } catch {
      isAdmin = false;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/8 bg-paper-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-500 transition hover:bg-paper-200 hover:text-ink-900"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <LinkButton href="/launch" variant="dark" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New launch</span>
            <span className="sm:hidden">Launch</span>
          </LinkButton>

          {user ? (
            <UserMenu userId={user.id} name={name} avatarUrl={avatar} isAdmin={isAdmin} />
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-500 transition hover:text-ink-900"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav — the same links, one row down. */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-ink-900/6 px-4 py-2 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="shrink-0 rounded-lg px-3 py-1 text-[13px] font-medium text-ink-500 transition hover:bg-paper-200 hover:text-ink-900"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
