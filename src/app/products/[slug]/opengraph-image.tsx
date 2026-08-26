import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/components/logo";
import { getProductBySlug } from "@/lib/launches";

export const alt = "Product launch on Saasgrave Launches";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** An upvote caret drawn as SVG — a "▲" glyph needs a font Satori can't fetch. */
function Caret({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <polygon points="6,1 11,10 1,10" fill={color} />
    </svg>
  );
}

/**
 * The social card for a launch — the thing makers actually share.
 *
 * Same light stock as the site card so the two read as one brand: the maker's
 * own logo carries the image, the tagline does the selling, and the vote count
 * is the proof.
 */
export default async function ProductOgImage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  const name = product?.name || "A new launch";
  const tagline = product?.tagline || "Launched on Saasgrave Launches";
  const upvotes = product?.upvote_count ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbfbfc",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            display: "flex",
            background: "#f2671e",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -140,
            width: 760,
            height: 620,
            display: "flex",
            background:
              "radial-gradient(circle at 50% 45%, rgba(242,103,30,0.14), rgba(242,103,30,0) 66%)",
          }}
        />

        {/* ── header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoMarkDataUri(38)} width={38} height={38} alt="" />
            <span
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 3.2,
                color: "#666b74",
              }}
            >
              SAASGRAVE LAUNCHES
            </span>
          </div>
          <span
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: 999,
              background: "#f2671e",
              color: "#ffffff",
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            Launching this week
          </span>
        </div>

        {/* ── the product ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          {product?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.logo_url}
              width={156}
              height={156}
              alt=""
              style={{
                borderRadius: 30,
                border: "1px solid rgba(22,24,29,0.12)",
                background: "#ffffff",
                boxShadow: "0 18px 44px -20px rgba(22,24,29,0.4)",
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 810 }}>
            <span
              style={{ fontSize: 76, fontWeight: 800, color: "#16181d", lineHeight: 1.02, letterSpacing: -2 }}
            >
              {name}
            </span>
            <span style={{ marginTop: 16, fontSize: 33, color: "#666b74", lineHeight: 1.28 }}>
              {tagline}
            </span>
          </div>
        </div>

        {/* ── proof ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 26px",
              borderRadius: 999,
              background: "#f2671e",
              color: "#ffffff",
              fontWeight: 800,
            }}
          >
            <Caret color="#ffffff" size={18} />
            {upvotes} upvotes
          </span>
          <span
            style={{
              display: "flex",
              padding: "13px 26px",
              borderRadius: 999,
              border: "1px solid rgba(22,24,29,0.14)",
              background: "#ffffff",
              color: "#393c44",
              fontWeight: 600,
            }}
          >
            Permanent dofollow backlink
          </span>
          <span style={{ marginLeft: "auto", color: "#9aa0aa", fontWeight: 600 }}>
            ls.saasgrave.org
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
