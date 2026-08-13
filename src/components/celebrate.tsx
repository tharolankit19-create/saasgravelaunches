"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * A one-shot confetti burst for the moment a launch goes live.
 *
 * Dependency-free: it spawns a fixed, click-through overlay of coloured pieces
 * that fan out and fall on a pure-CSS keyframe, then unmounts itself. Honours
 * prefers-reduced-motion by simply not firing. Rendered on the product page
 * when it's opened with ?launched=1.
 */
const COLORS = ["#f2671e", "#fb8b3d", "#d8ad55", "#2f7a4f", "#c2410c", "#181510"];
const COUNT = 90;

export function Celebrate() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setOn(false);
      return;
    }
    const t = setTimeout(() => setOn(false), 3200);
    return () => clearTimeout(t);
  }, []);

  if (!on) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      style={{ perspective: "600px" }}
    >
      {Array.from({ length: COUNT }).map((_, i) => {
        const dx = (Math.random() - 0.5) * 150; // vw spread
        const dy = 70 + Math.random() * 45; // vh fall
        const dr = 360 + Math.random() * 900; // rotation
        const dur = 2 + Math.random() * 1.6;
        const delay = Math.random() * 0.4;
        const left = 50 + (Math.random() - 0.5) * 40; // start band, centred
        const color = COLORS[i % COLORS.length];
        const round = i % 4 === 0;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={
              {
                left: `${left}%`,
                top: `${8 + Math.random() * 12}%`,
                background: color,
                borderRadius: round ? "9999px" : "1px",
                width: round ? "9px" : "8px",
                height: round ? "9px" : `${12 + Math.random() * 8}px`,
                "--dx": `${dx}vw`,
                "--dy": `${dy}vh`,
                "--dr": `${dr}deg`,
                "--dur": `${dur}s`,
                "--delay": `${delay}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
