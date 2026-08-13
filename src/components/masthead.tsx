import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MastheadShell } from "@/components/masthead-shell";
import { UserMenu } from "@/components/user-menu";
import { getLiveWeekCount } from "@/lib/launches";
import { currentWeekKey, weekLabel } from "@/lib/week";

/**
 * Server half of the masthead: who's signed in, and what the live week is.
 * The scroll behaviour lives in MastheadShell, which is the only part that
 * needs to be a client component.
 *
 * This renders on every page, so it does the minimum: one auth call, one live
 * count, and — only when signed in — one profile row that also carries the
 * admin flag. No service-role client, no full site-stats scan.
 */
export async function Masthead() {
  const supabase = createClient();
  const [
    {
      data: { user },
    },
    liveCount,
  ] = await Promise.all([supabase.auth.getUser(), getLiveWeekCount()]);

  let name: string | null = null;
  let avatar: string | null = null;
  let isAdmin = false;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    name = data?.full_name || user.email?.split("@")[0] || null;
    avatar = data?.avatar_url || null;
    isAdmin = Boolean(data?.is_admin);
  }

  return (
    <MastheadShell
      weekLabel={weekLabel(currentWeekKey())}
      liveCount={liveCount}
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
