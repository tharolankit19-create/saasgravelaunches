import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  ORDER_TIERS,
  isOrderTier,
  paymentLinkForOrder,
  newOrderToken,
  cleanXHandle,
} from "@/lib/directory-orders";
import { readCookie } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Create a no-login directory-blast order.
 *
 * The buyer hasn't signed in and never will. They send the handful of fields
 * we need; we mint a private token, write the order, and hand back the hosted
 * Dodo payment link plus the status URL keyed on that token. Payment happens on
 * Dodo's page; the operator confirms it and drives the status from /admin.
 *
 * No amount travels from the browser — the tier decides the price and the link.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const tier = body?.tier;
  if (!isOrderTier(tier)) {
    return NextResponse.json({ error: "Pick a plan first." }, { status: 400 });
  }

  const productName = String(body?.productName || "").trim();
  if (!productName) {
    return NextResponse.json({ error: "Your product name is required." }, { status: 400 });
  }

  const xHandle = cleanXHandle(String(body?.xHandle || ""));
  const linkedin = String(body?.linkedin || "").trim();
  // One of X or LinkedIn is required — it's how we tag the submissions and
  // reach you if a directory needs a nudge.
  if (!xHandle && !linkedin) {
    return NextResponse.json(
      { error: "Add your X handle or LinkedIn — one is required." },
      { status: 400 }
    );
  }

  const website = String(body?.website || "").trim();
  const email = String(body?.email || "").trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "A contact email is required — it's how you get your report." },
      { status: 400 }
    );
  }

  const category = String(body?.category || "").trim().slice(0, 120) || null;
  const pitch = String(body?.pitch || "").trim().slice(0, 400) || null;
  const notes = String(body?.notes || "").trim().slice(0, 1000) || null;

  const spec = ORDER_TIERS[tier];
  const token = newOrderToken();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Ordering is briefly unavailable. Please try again in a minute." },
      { status: 503 }
    );
  }

  const { error } = await admin.from("launch_directory_orders").insert({
    public_token: token,
    tier,
    amount_cents: spec.dollars * 100,
    product_name: productName.slice(0, 160),
    website_url: website ? website.slice(0, 300) : null,
    x_handle: xHandle || null,
    linkedin_handle: linkedin ? linkedin.slice(0, 300) : null,
    contact_email: email.slice(0, 200),
    category,
    short_pitch: pitch,
    notes,
    status: "received",
    live_note: "Order placed. Complete your payment to start the queue.",
  });

  if (error) {
    // Surface the real reason so a missing migration (42P01) or a column
    // mismatch (42703) is obvious rather than a blank "try again".
    console.error("directory-order insert failed:", error);
    const missingTable = error.code === "42P01";
    return NextResponse.json(
      {
        error: missingTable
          ? "Ordering isn't set up yet — the orders table is missing. (Run the migration.)"
          : "Couldn't save your order. Please try again.",
        code: error.code,
        detail: error.message,
      },
      { status: 500 }
    );
  }

  const origin = new URL(request.url).origin;
  const visitorId = readCookie(request, "datafast_visitor_id");
  return NextResponse.json({
    token,
    statusUrl: `/order/${token}`,
    paymentLink: paymentLinkForOrder(tier, token, `${origin}/order/${token}`, visitorId),
  });
}
