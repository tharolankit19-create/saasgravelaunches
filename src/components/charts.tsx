// Inline SVG charts. No charting library: these are three shapes, and a
// dependency that ships a renderer for all of them would cost more than the
// whole analytics page.

import { cn } from "@/lib/utils";

/** Bars for a daily series. */
export function BarChart({
  data,
  color = "#8c2323",
  height = 128,
  label,
}: {
  data: { day: string; value: number }[];
  color?: string;
  height?: number;
  label?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div>
      {label && (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
          {label}
        </p>
      )}
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d) => (
          <div key={d.day} className="group relative flex flex-1 flex-col justify-end">
            <div
              title={`${d.day}: ${d.value}`}
              className="w-full transition-opacity group-hover:opacity-75"
              style={{
                height: `${Math.max(d.value > 0 ? 3 : 1, (d.value / max) * 100)}%`,
                background: d.value > 0 ? color : "#e2ded4",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-ink-400">
        <span>{data[0]?.day.slice(5)}</span>
        <span className="figure">max {max}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

/**
 * The cumulative upvote curve — velocity.
 *
 * A flat tail means the launch stopped moving, which is the single most useful
 * thing this page can tell a maker: it's a signal to go share it again, not to
 * wait.
 */
export function LineChart({
  data,
  height = 128,
  label,
}: {
  data: { day: string; value: number }[];
  height?: number;
  label?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100;
  const h = 100;

  const points = data.map((d, i) => {
    const x = data.length <= 1 ? 0 : (i / (data.length - 1)) * w;
    const y = h - (d.value / max) * h;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const area = `0,${h} ${points.join(" ")} ${w},${h}`;

  return (
    <div>
      {label && (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
          {label}
        </p>
      )}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ height }}
        className="w-full"
        role="img"
        aria-label={label || "Cumulative upvotes"}
      >
        <polygon points={area} fill="rgba(140,35,35,0.10)" />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#8c2323"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-ink-400">
        <span>{data[0]?.day.slice(5)}</span>
        <span className="figure">{max} total</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

/** A labelled proportion bar — used for referrers. */
export function ShareBars({
  rows,
}: {
  rows: { label: string; value: number; share: number }[];
}) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-ink-400">No traffic recorded yet.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[13px] text-ink-700">{r.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden bg-paper-300">
            <span
              className="block h-full bg-oxblood-500"
              style={{ width: `${Math.max(2, r.share * 100)}%` }}
            />
          </span>
          <span className="figure w-10 shrink-0 text-right text-[11px] text-ink-500">
            {r.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A progress meter for the reputation level. */
export function LevelMeter({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  return (
    <span className={cn("block h-1.5 w-full overflow-hidden bg-paper-300", className)}>
      <span
        className="block h-full bg-brass-500"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
      />
    </span>
  );
}
