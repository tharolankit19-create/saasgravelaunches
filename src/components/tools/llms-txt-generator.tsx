"use client";

import { useState } from "react";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type Row = { title: string; url: string; note: string };

/**
 * Generates an /llms.txt file — the llmstxt.org convention for telling language
 * models what a site is and which pages are worth reading. Pure client, no
 * signup; the output is a plain file you drop at your site root.
 */
export function LlmsTxtGenerator() {
  const [site, setSite] = useState({ name: "", url: "", summary: "", detail: "" });
  const [rows, setRows] = useState<Row[]>([
    { title: "Pricing", url: "/pricing", note: "What it costs" },
    { title: "Docs", url: "/docs", note: "How it works" },
  ]);
  const [copied, setCopied] = useState(false);

  const setS = (k: keyof typeof site) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSite((s) => ({ ...s, [k]: e.target.value }));

  function setRow(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  const name = site.name || "Your Product";
  const base = (site.url || "https://yourproduct.com").replace(/\/+$/, "");
  const summary = site.summary || "One sentence on what this is and who it's for.";

  const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : `${base}${u.startsWith("/") ? "" : "/"}${u}`);

  const output = [
    `# ${name}`,
    "",
    `> ${summary}`,
    "",
    ...(site.detail ? [site.detail, ""] : []),
    "## Docs",
    "",
    ...rows
      .filter((r) => r.title.trim() && r.url.trim())
      .map((r) => `- [${r.title}](${abs(r.url)})${r.note ? `: ${r.note}` : ""}`),
    "",
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the textarea is selectable */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site or product name" required>
            <input className={inputClass} value={site.name} onChange={setS("name")} placeholder="Acme" />
          </Field>
          <Field label="Base URL">
            <input className={inputClass} value={site.url} onChange={setS("url")} placeholder="https://acme.com" />
          </Field>
        </div>

        <Field label="One-line summary" hint="— the > blockquote line">
          <input
            className={inputClass}
            value={site.summary}
            onChange={setS("summary")}
            placeholder="Invoicing that chases late payers for you."
          />
        </Field>

        <Field label="Extra context" hint="— optional paragraph for the model">
          <textarea
            className={cn(inputClass, "min-h-[84px] resize-y")}
            value={site.detail}
            onChange={setS("detail")}
            placeholder="Who it's for, what it replaces, anything an assistant should know before recommending it."
          />
        </Field>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-900">Key pages</p>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={cn(inputClass, "flex-1 py-2")}
                  value={r.title}
                  onChange={(e) => setRow(i, { title: e.target.value })}
                  placeholder="Title"
                />
                <input
                  className={cn(inputClass, "flex-1 py-2")}
                  value={r.url}
                  onChange={(e) => setRow(i, { url: e.target.value })}
                  placeholder="/path"
                />
                <input
                  className={cn(inputClass, "flex-1 py-2")}
                  value={r.note}
                  onChange={(e) => setRow(i, { note: e.target.value })}
                  placeholder="Note"
                />
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                  aria-label="Remove row"
                  className="shrink-0 rounded-lg px-2 text-ink-400 transition hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRows((r) => [...r, { title: "", url: "", note: "" }])}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-ink-900/15 px-3 py-1.5 text-[12px] font-medium text-ink-600 transition hover:border-ink-900/35"
          >
            <Plus className="h-3.5 w-3.5" /> Add a page
          </button>
        </div>
      </div>

      <div>
        <div className="relative rounded-xl border border-ink-900/10 bg-ink-900 p-4">
          <button
            onClick={copy}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-white/20"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-paper-200">
{output}
          </pre>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-500">
          Save this as <code className="rounded bg-paper-200 px-1 py-0.5 font-mono text-[12px]">llms.txt</code>{" "}
          at your site root, so it serves from{" "}
          <code className="rounded bg-paper-200 px-1 py-0.5 font-mono text-[12px]">{base}/llms.txt</code>. It
          tells assistants what your site is and which pages to read — the same way{" "}
          <code className="rounded bg-paper-200 px-1 py-0.5 font-mono text-[12px]">robots.txt</code> talks to
          crawlers.
        </p>
      </div>
    </div>
  );
}
