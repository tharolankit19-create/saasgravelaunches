"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Launch-post generator. Fill your product in once, get ready-to-post copy for
 * X, Show HN and LinkedIn — written to sound like a real maker, not a press
 * release. Pure client, template-based, no signup.
 */
export function LaunchPostGenerator() {
  const [f, setF] = useState({ name: "", pitch: "", url: "", who: "", built: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const name = f.name || "MyProduct";
  const pitch = f.pitch || "does the boring thing so you don't have to";
  const url = f.url || "https://myproduct.com";
  const who = f.who || "indie founders";
  const built = f.built || "I kept hitting this problem myself";

  const tweet = `Launched ${name} today 🚀

${cap(pitch)}.

Built it because ${lower(built)}.

If you're ${lower(who)}, I'd love your honest feedback 👇
${url}`;

  const showHN = `Show HN: ${name} – ${lower(pitch)}

Hi HN, I built ${name}. ${cap(pitch)}.

I made it because ${lower(built)}. It's aimed at ${lower(who)}.

It's live here: ${url}

Happy to answer any questions, and I'd genuinely appreciate feedback — especially the critical kind.`;

  const linkedin = `I just launched ${name}. 🚀

${cap(pitch)}.

The honest backstory: ${lower(built)}. So I built the thing I wished existed.

It's for ${lower(who)}. If that's you, take a look — and tell me what's missing:
${url}

(Reposts and feedback mean a lot on launch day 🙏)`;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* inputs */}
      <div className="grid gap-4">
        <Field label="Product name" required>
          <input className={inputClass} value={f.name} onChange={set("name")} placeholder="Acme" maxLength={40} />
        </Field>
        <Field label="One-line pitch" hint="— what it does">
          <input className={inputClass} value={f.pitch} onChange={set("pitch")} placeholder="turns invoices into paid invoices" maxLength={120} />
        </Field>
        <Field label="URL">
          <input className={inputClass} value={f.url} onChange={set("url")} inputMode="url" placeholder="https://acme.com" />
        </Field>
        <Field label="Who it's for">
          <input className={inputClass} value={f.who} onChange={set("who")} placeholder="freelancers who hate chasing payments" maxLength={80} />
        </Field>
        <Field label="Why you built it">
          <input className={inputClass} value={f.built} onChange={set("built")} placeholder="I was losing hours every month chasing late invoices" maxLength={140} />
        </Field>
      </div>

      {/* outputs */}
      <div className="grid gap-4">
        <PostCard label="X / Twitter" text={tweet} />
        <PostCard label="Show HN (Hacker News)" text={showHN} />
        <PostCard label="LinkedIn" text={linkedin} />
      </div>
    </div>
  );
}

function PostCard({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <div className="rounded-xl border border-ink-900/10 bg-paper-100 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">{label}</p>
        <button
          onClick={copy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition",
            copied ? "bg-moss-500/12 text-moss-600" : "bg-ink-900/5 text-ink-600 hover:bg-ink-900/10"
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-700">{text}</p>
    </div>
  );
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
