// ─── Email ──────────────────────────────────────────────────
// Server-only. A thin Resend client. Everything degrades gracefully: with no
// RESEND_API_KEY set, every send is a no-op that reports `skipped` rather than
// throwing, so a launch never fails because email isn't wired up yet.
//
// Docs: https://resend.com/docs/api-reference/emails/send-email

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** The verified sender. Set EMAIL_FROM once the domain is verified in Resend. */
export function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || "Saasgrave Launches <launches@saasgrave.org>";
}

export type SendResult = { ok: boolean; skipped?: boolean; id?: string; error?: string };

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  /** Hidden preview line — set by the templates. */
  headers?: Record<string, string>;
};

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, skipped: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: emailFrom(),
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
        ...(args.headers ? { headers: args.headers } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `resend ${res.status}: ${text.slice(0, 200)}` };
    }
    const json: any = await res.json().catch(() => ({}));
    return { ok: true, id: json?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "email send failed" };
  }
}

export type BatchMessage = { to: string; subject: string; html: string; headers?: Record<string, string> };

/**
 * Send many distinct messages in one call. Each recipient gets their own
 * message (never a shared `to`, so addresses are never leaked to each other).
 * Resend's batch endpoint takes up to 100 at a time; callers chunk.
 */
export async function sendBatch(messages: BatchMessage[]): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, skipped: true };
  if (!messages.length) return { ok: true };

  try {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(
        messages.map((m) => ({
          from: emailFrom(),
          to: [m.to],
          subject: m.subject,
          html: m.html,
          ...(m.headers ? { headers: m.headers } : {}),
        }))
      ),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `resend batch ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "email batch failed" };
  }
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
