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
          background: "#f8f7f4",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoMarkDataUri(48)} width={48} height={48} alt="" />
          <span style={{ fontSize: 26, fontWeight: 600, color: "#6a655a" }}>
            Saasgrave Launches
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {product?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.logo_url}
              width={132}
              height={132}
              alt=""
              style={{ borderRadius: 28, border: "1px solid rgba(18,17,15,0.1)" }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 860 }}>
            <span style={{ fontSize: 68, fontWeight: 700, color: "#12110f", lineHeight: 1.05 }}>
              {name}
            </span>
            <span style={{ marginTop: 14, fontSize: 32, color: "#3b372f", lineHeight: 1.3 }}>
              {tagline}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 26 }}>
          <span
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: 999,
              background: "#5B3DF5",
              color: "white",
              fontWeight: 600,
            }}
          >
            ▲ {upvotes} upvotes
          </span>
          <span style={{ color: "#6a655a" }}>ls.saasgrave.org</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
