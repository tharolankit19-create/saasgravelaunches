import { createAdminClient, currentUser } from "@/lib/supabase/server";

/**
 * Is the signed-in user an admin?
 *
 * Read through the service-role client so the check can't be defeated by row
 * policies, and keyed on `profiles.is_admin` rather than a hard-coded email —
 * granting admin is then a database change, not a deploy. Shared with
 * Saasgrave: one profile row, one admin flag, both products.
 */
export async function getAdminUser() {
  const user = await currentUser();
  if (!user) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
    return data?.is_admin ? user : null;
  } catch {
    return null; // no service-role key — fail closed
  }
}

export async function isAdmin() {
  return (await getAdminUser()) !== null;
}

/**
 * Machine access for the Hermes watcher.
 *
 * A single bearer token in `ADMIN_INSIGHTS_TOKEN`, compared in constant time.
 * If the token isn't set, machine access is off — never open by default.
 */
export function checkInsightsToken(header: string | null): boolean {
  const expected = process.env.ADMIN_INSIGHTS_TOKEN?.trim();
  if (!expected) return false;
  const got = (header || "").replace(/^Bearer\s+/i, "").trim();
  if (!got || got.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
