import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const STATUSES = ["received", "paid", "in_progress", "completed", "on_hold"];

/**
 * Operator edits an order. Admin-only, service-role write. The buyer never
 * hits this — they only ever read their own token'd status page.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body?.id || "").trim();
  if (!id) return NextResponse.json({ error: "Missing order id." }, { status: 400 });

  const patch: Record<string, unknown> = {};

  if (typeof body.status === "string") {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (typeof body.live_note === "string") patch.live_note = body.live_note.slice(0, 500);
  if (typeof body.submitted_count === "number") {
    patch.submitted_count = Math.max(0, Math.round(body.submitted_count));
  }
  if (typeof body.report_url === "string") patch.report_url = body.report_url.trim().slice(0, 500) || null;
  if (typeof body.admin_notes === "string") patch.admin_notes = body.admin_notes.slice(0, 2000);
  if (typeof body.dodo_payment_id === "string") patch.dodo_payment_id = body.dodo_payment_id.trim().slice(0, 200) || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("launch_directory_orders")
    .update(patch)
    .eq("id", id)
    .select("id, status, live_note, submitted_count, report_url, admin_notes, dodo_payment_id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, order: data });
}
