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
 * The social card for a launch — the thing makers actually share, so it has to
 * earn the click in a crowded feed. Dark with an ember bloom, the product's own
 * logo big and centre, and the vote count as the proof.
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
          background: "#0a0b10",
          padding: "58px 66px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ember bloom behind the product */}
        <div
          style={{
            position: "absolute",
            top: -240,
            right: -160,
            width: 860,
            height: 700,
            display: "flex",
            background:
              "radial-gradient(circle at 50% 45%, rgba(242,103,30,0.5), rgba(242,103,30,0) 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -300,
            left: -200,
            width: 820,
            height: 700,
            display: "flex",
            background:
              "radial-gradient(circle at 50% 50%, rgba(64,110,255,0.28), rgba(64,110,255,0) 64%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            display: "flex",
            background: "#f2671e",
          }}
        />

        {/* ── header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoMarkDataUri(44)} width={44} height={44} alt="" />
            <span style={{ fontSize: 24, fontWeight: 700, color: "#ffffff" }}>
              Saasgrave Launches
            </span>
          </div>
          <span
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: 999,
              border: "1px solid rgba(242,103,30,0.6)",
              background: "rgba(242,103,30,0.16)",
              color: "#ffb37a",
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: 1.6,
            }}
          >
            LAUNCHING THIS WEEK
          </span>
        </div>

        {/* ── the product ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          {product?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.logo_url}
              width={150}
              height={150}
              alt=""
              style={{
                borderRadius: 30,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "#ffffff",
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
            <span style={{ fontSize: 72, fontWeight: 800, color: "#ffffff", lineHeight: 1.02 }}>
              {name}
            </span>
            <span style={{ marginTop: 16, fontSize: 33, color: "#a8adb8", lineHeight: 1.28 }}>
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
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.05)",
              color: "#e6e8ec",
              fontWeight: 600,
            }}
          >
            Permanent dofollow backlink
          </span>
          <span style={{ marginLeft: "auto", color: "#7c828e", fontWeight: 600 }}>
            ls.saasgrave.org
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
