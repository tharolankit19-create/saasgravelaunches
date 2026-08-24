import { Check, Minus } from "lucide-react";
import { FEATURES, SAASGRAVE, type Platform, type Cell } from "@/lib/compare";
import { cn } from "@/lib/utils";

function CellMark({ v }: { v: Cell }) {
  if (v === "yes")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-moss-500/12 text-moss-600">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  if (v === "varies")
    return <span className="font-mono text-[12px] text-ink-400">varies</span>;
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/5 text-ink-400">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}

/**
 * A feature-by-feature comparison. Always anchors on Saasgrave Launches, then
 * one or more platforms alongside. Used on the /alternatives hub (all of them)
 * and each /alternatives/[slug] page (us vs one).
 */
export function ComparisonTable({ others }: { others: Platform[] }) {
  const cols = [SAASGRAVE, ...others];
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-900/10">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-900/10">
            <th className="p-4 text-[13px] font-medium text-ink-500">Feature</th>
            {cols.map((p) => (
              <th
                key={p.slug}
                className={cn(
                  "p-4 text-center text-[14px] font-semibold",
                  p.us ? "text-ember-600" : "text-ink-900"
                )}
              >
                {p.name}
                {p.us && (
                  <span className="mt-0.5 block font-mono text-[9px] font-normal uppercase tracking-[0.1em] text-ink-400">
                    You are here
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((f, i) => (
            <tr key={f.key} className={cn(i % 2 === 1 && "bg-paper-200/40")}>
              <td className="p-4 text-[13px] font-medium text-ink-700">{f.label}</td>
              {cols.map((p) => (
                <td key={p.slug} className="p-4 text-center">
                  <CellMark v={p.cells[f.key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
