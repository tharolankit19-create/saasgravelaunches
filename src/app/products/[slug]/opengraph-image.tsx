import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/components/logo";
import { getProductBySlug } from "@/lib/launches";

export const alt = "Product launch on Saasgrave Launches";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The social card for a launch — the thing makers actually share. */
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
          background: "#ffffff",
          padding: 72,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* the ember spine — the brand's one rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: "#f2671e",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoMarkDataUri(48)} width={48} height={48} alt="" />
            <span style={{ fontSize: 26, fontWeight: 700, color: "#12110f" }}>
              Saasgrave Launches
            </span>
          </div>
          <span
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 999,
              border: "2px solid #f2671e",
              color: "#c2410c",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            LAUNCHING THIS WEEK
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {product?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.logo_url}
              width={148}
              height={148}
              alt=""
              style={{ borderRadius: 28, border: "1px solid rgba(18,17,15,0.12)" }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 840 }}>
            <span style={{ fontSize: 74, fontWeight: 800, color: "#12110f", lineHeight: 1.02 }}>
              {name}
            </span>
            <span style={{ marginTop: 16, fontSize: 34, color: "#3b372f", lineHeight: 1.28 }}>
              {tagline}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 26 }}>
          <span
            style={{
              display: "flex",
              padding: "12px 24px",
              borderRadius: 999,
              background: "#f2671e",
              color: "white",
              fontWeight: 700,
            }}
          >
            ▲ {upvotes} upvotes
          </span>
          <span
            style={{
              display: "flex",
              padding: "12px 24px",
              borderRadius: 999,
              background: "#f1f0ec",
              color: "#3b372f",
              fontWeight: 600,
            }}
          >
            Permanent dofollow backlink
          </span>
          <span style={{ marginLeft: "auto", color: "#6a655a", fontWeight: 600 }}>
            ls.saasgrave.org
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
