import { NextResponse } from "next/server";
import { createAdminClient, currentUser } from "@/lib/supabase/server";
import { faviconFor } from "@/lib/directories";
import {
  normalizeEntry,
  newBidToken,
  outbidCheckoutLink,
  OUTBID_MIN_DOLLARS,
  OUTBID_MAX_DOLLARS,
} from "@/lib/outbid";

export const dynamic = "force-dynamic";

/**
 * Place a bid.
 *
 * The bidder sends a URL/handle, an amount and an optional tagline. We mint a
 * pending row and hand back the Dodo checkout link with the amount as quantity
 * and the token as metadata. The bid only reaches the board once the webhook
 * confirms the payment — a pending row is invisible.
 *
 * No login required; if a session happens to exist we tag the row to it so it
 * can show up in that maker's dashboard later.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const entry = normalizeEntry(String(body?.entry || ""));
  if (!entry) {
    return NextResponse.json(
      { error: "Enter a valid product URL or @handle." },
      { status: 400 }
    );
  }

  const amount = Math.round(Number(body?.amount));
  if (!Number.isFinite(amount) || amount < OUTBID_MIN_DOLLARS) {
    return NextResponse.json(
      { error: `Minimum bid is $${OUTBID_MIN_DOLLARS}.` },
      { status: 400 }
    );
  }
  if (amount > OUTBID_MAX_DOLLARS) {
    return NextResponse.json({ error: "That bid is too large." }, { status: 400 });
  }

  const tagline = String(body?.tagline || "").trim().slice(0, 160) || null;
  const email = String(body?.email || "").trim().slice(0, 200) || null;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Bidding is briefly unavailable. Try again in a minute." },
      { status: 503 }
    );
  }

  const user = await currentUser().catch(() => null);
  const token = newBidToken();

  const { error } = await admin.from("launch_bids").insert({
    public_token: token,
    entry_key: entry.entryKey,
    url: entry.url,
    display_url: entry.display,
    handle: entry.handle,
    product_name: entry.name,
    tagline,
    logo_url: faviconFor(entry.url, 128),
    amount_cents: amount * 100,
    status: "pending",
    contact_email: email,
    user_id: user?.id ?? null,
  });

  if (error) {
    console.error("outbid insert failed:", error);
    const missingTable = error.code === "42P01";
    return NextResponse.json(
      {
        error: missingTable
          ? "Bidding isn't set up yet — the bids table is missing. (Run the migration.)"
          : "Couldn't place your bid. Try again.",
        code: error.code,
      },
      { status: 500 }
    );
  }

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    token,
    checkoutUrl: outbidCheckoutLink(token, amount, `${origin}/spotlight?paid=${token}`),
  });
}
