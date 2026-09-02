import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/components/logo";
import { getProductBySlug } from "@/lib/launches";
import { brandFonts } from "@/lib/og";

export const alt = "Product launch on Saasgrave Launches";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#16181d";
const MUTE = "#5b616b";
const EMBER = "#f2671e";
const STOCK = "#fbfbfc";

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
 * Same front-page language as the site card so the two read as one masthead:
 * the maker's own logo carries the image, the name is set in Fraunces at poster
 * scale, and the vote count is the proof. A share of this is free marketing for
 * the board, so it's built to look like a headline, not a form receipt.
 */
export default async function ProductOgImage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  const name = product?.name || "A new launch";
  const tagline = product?.tagline || "Launched on Saasgrave Launches";
  const upvotes = product?.upvote_count ?? 0;
  const fonts = await brandFonts();
  const serif = "Fraunces";
  const sans = "Instrument Sans";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: STOCK,
          padding: "36px 60px 44px",
          fontFamily: sans,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -150,
            width: 780,
            height: 620,
            display: "flex",
            background:
              "radial-gradient(circle at 55% 42%, rgba(242,103,30,0.13), rgba(242,103,30,0) 64%)",
          }}
        />

        {/* ── masthead ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoMarkDataUri(30)} width={30} height={30} alt="" />
            <span
              style={{
                display: "flex",
                marginLeft: 12,
                fontFamily: "monospace",
                fontSize: 15,
                letterSpacing: 3,
                color: INK,
              }}
            >
              SAASGRAVE LAUNCHES
            </span>
            <span
              style={{
                display: "flex",
                marginLeft: "auto",
                padding: "9px 18px",
                borderRadius: 999,
                background: EMBER,
                color: "#ffffff",
                fontFamily: "monospace",
                fontSize: 14,
                letterSpacing: 1.5,
              }}
            >
              LAUNCHING THIS WEEK
            </span>
          </div>
          <div style={{ display: "flex", marginTop: 14, height: 3, background: INK }} />
          <div style={{ display: "flex", marginTop: 3, height: 1, background: INK }} />
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
                border: "1px solid rgba(22,24,29,0.12)",
                background: "#ffffff",
                boxShadow: "0 18px 44px -20px rgba(22,24,29,0.4)",
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
            <span
              style={{
                display: "flex",
                fontFamily: serif,
                fontWeight: 900,
                fontSize: 82,
                color: INK,
                lineHeight: 0.98,
                letterSpacing: -2.2,
              }}
            >
              {name}
            </span>
            <span
              style={{
                display: "flex",
                marginTop: 16,
                fontFamily: sans,
                fontSize: 32,
                color: MUTE,
                lineHeight: 1.26,
              }}
            >
              {tagline}
            </span>
          </div>
        </div>

        {/* ── proof ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 23 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 26px",
              borderRadius: 999,
              background: EMBER,
              color: "#ffffff",
              fontWeight: 600,
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
          <span
            style={{
              display: "flex",
              marginLeft: "auto",
              fontFamily: "monospace",
              fontSize: 18,
              letterSpacing: 1,
              color: "#9aa0aa",
            }}
          >
            ls.saasgrave.org
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
