// ─── AI ─────────────────────────────────────────────────────
// Server-only. One thin OpenRouter client, used by the autofill and by the
// admin traffic diagnosis.
//
// The model list is a ladder of small, free models: we try them in order and
// take the first that answers. They're fast and cheap enough to sit in a form
// submit, and none of them is load-bearing — every caller has a non-AI
// fallback, so an unset key or a rate-limited model degrades the feature
// instead of breaking the page.

const MODELS = [
  "nvidia/nemotron-3.5-lightning:free",
  "liquid/lfm-2.5-2.6b:free",
  "inclusionai/ling-3.0-tiny:free",
];

/** The ladder, with an operator override in front. */
export function models(): string[] {
  const pinned = process.env.OPENROUTER_MODEL?.trim();
  return pinned ? [pinned, ...MODELS.filter((m) => m !== pinned)] : MODELS;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export type CompleteOptions = {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  /** Ask OpenRouter for a JSON object back. Small models honour this loosely. */
  json?: boolean;
};

/**
 * Complete a prompt, walking the model ladder until one answers.
 * Throws only when every model failed (or no key is configured).
 */
export async function aiComplete(prompt: string, opts: CompleteOptions = {}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("AI isn't configured — set OPENROUTER_API_KEY.");

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://launches.saasgrave.org";
  const errors: string[] = [];

  for (const model of models()) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": site,
          "X-Title": "Saasgrave Launches",
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(opts.system ? [{ role: "system", content: opts.system }] : []),
            { role: "user", content: prompt },
          ],
          max_tokens: opts.maxTokens ?? 900,
          temperature: opts.temperature ?? 0.4,
          ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        errors.push(`${model}: ${res.status}`);
        continue; // 404 (retired), 429 (rate-limited), 402 — just try the next rung
      }

      const data: any = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.trim()) return text.trim();
      errors.push(`${model}: empty response`);
    } catch (e: any) {
      errors.push(`${model}: ${e?.message || "network error"}`);
    }
  }

  throw new Error(`Every AI model failed (${errors.join("; ")}).`);
}

/**
 * Complete and parse JSON. Small models like to wrap objects in prose or a
 * fenced block, so we dig the first balanced object out of whatever comes back.
 */
export async function aiJson<T>(prompt: string, opts: CompleteOptions = {}): Promise<T | null> {
  const raw = await aiComplete(prompt, { ...opts, json: true });
  return extractJson<T>(raw);
}

export function extractJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const direct = tryParse<T>(cleaned);
  if (direct) return direct;

  // Walk to the first '{' and find its matching '}' — tolerant of trailing prose.
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return tryParse<T>(cleaned.slice(start, i + 1));
    }
  }
  return null;
}

function tryParse<T>(s: string): T | null {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? (v as T) : null;
  } catch {
    return null;
  }
}
