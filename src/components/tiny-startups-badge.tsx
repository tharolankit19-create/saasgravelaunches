/**
 * "Launched on Tiny Startups" badge, as supplied by tinystartups.com, converted
 * to JSX for the footer marquee. `uid` keeps the gradient id unique so the two
 * marquee copies don't collide.
 */
export function TinyStartupsBadge({ uid = 0 }: { uid?: number }) {
  const gid = `tsg-${uid}`;
  return (
    <a
      href="https://www.tinystartups.com/startup/the-weekly-register-of-what-founders-shipped"
      target="_blank"
      rel="noopener"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 22px 14px 18px",
        borderRadius: 14,
        textDecoration: "none",
        fontFamily: "'Inter',system-ui,sans-serif",
        background:
          "linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#3525E6,#D81FE0,#22B8F0) border-box",
        border: "2px solid transparent",
        color: "#0E0B1F",
      }}
    >
      <svg width="56" height="56" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={gid} x1=".1" y1="0" x2=".9" y2="1">
            <stop offset="0%" stopColor="#3525E6" />
            <stop offset="55%" stopColor="#D81FE0" />
            <stop offset="100%" stopColor="#22B8F0" />
          </linearGradient>
        </defs>
        <path
          d="M50 6C52 32 68 48 94 50C68 52 52 68 50 94C48 68 32 52 6 50C32 48 48 32 50 6Z"
          fill={`url(#${gid})`}
        />
      </svg>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6A6585",
          }}
        >
          Launched on
        </span>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em" }}>
          Tiny Startups
        </span>
        <span style={{ fontSize: 11, color: "#6A6585", marginTop: 4 }}>tinystartups.com</span>
      </span>
    </a>
  );
}
