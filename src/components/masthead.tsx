import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MastheadShell } from "@/components/masthead-shell";
import { UserMenu } from "@/components/user-menu";
import { getSiteStats } from "@/lib/launches";
import { currentWeekKey, weekLabel } from "@/lib/week";

/**
 * Server half of the masthead: who's signed in, and what the live week is.
 * The scroll behaviour lives in MastheadShell, which is the only part that
 * needs to be a client component.
 */
export async function Masthead() {
  const supabase = createClient();
  const [
    {
      data: { user },
    },
    stats,
  ] = await Promise.all([supabase.auth.getUser(), getSiteStats()]);

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
    <MastheadShell
      weekLabel={weekLabel(currentWeekKey())}
      liveCount={stats.thisWeek}
      userSlot={
        user ? (
          <UserMenu userId={user.id} name={name} avatarUrl={avatar} isAdmin={isAdmin} />
        ) : (
          <Link
            href="/login"
            className="rounded-[3px] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500 transition hover:text-ink-900"
          >
            Sign in
          </Link>
        )
      }
    />
  );
}
