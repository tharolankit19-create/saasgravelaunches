"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { Button, inputClass } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";
import type { Comment } from "@/lib/launches";

/**
 * Discussion on a launch. One level of replies — deep threads on a page that
 * lives for a week are a feature nobody uses and everybody has to scroll past.
 */
export function CommentThread({
  productId,
  slug,
  comments,
  signedIn,
  makerId,
}: {
  productId: string;
  slug: string;
  comments: Comment[];
  signedIn: boolean;
  makerId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const roots = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    if (text.length > 2000) return toast.error("That's longer than 2,000 characters.");

    setBusy(true);
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, body: text, parentId: replyTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't post that.");

      setBody("");
      setReplyTo(null);
      trackEvent("comment", { productSlug: slug });
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't post that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {signedIn ? (
        <form onSubmit={submit} className="mb-6">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-[12px] text-ink-500">
              <CornerDownRight className="h-3.5 w-3.5" />
              Replying to a comment
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="font-medium text-oxblood-600 hover:underline"
              >
                cancel
              </button>
            </div>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Ask the maker something, or tell them what you'd change."
            className={cn(inputClass, "resize-y")}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-ink-400">Links aren&apos;t allowed.</span>
            <Button type="submit" size="sm" disabled={busy || !body.trim()}>
              {busy ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-ink-900/12 bg-paper-200/50 px-4 py-4 text-sm text-ink-500">
          <Link
            href={`/login?next=${encodeURIComponent(`/products/${slug}`)}`}
            className="font-medium text-oxblood-600 hover:underline"
          >
            Sign in
          </Link>{" "}
          to join the discussion. Free, and it takes one click with Google.
        </div>
      )}

      {roots.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-400">
          No comments yet — be the first to give this maker real feedback.
        </p>
      ) : (
        <ul className="space-y-5">
          {roots.map((c) => (
            <li key={c.id}>
              <CommentBody comment={c} isMaker={c.author_id === makerId} />
              {signedIn && (
                <button
                  onClick={() => setReplyTo(c.id)}
                  className="ml-11 mt-1 text-[12px] font-medium text-ink-400 hover:text-oxblood-600"
                >
                  Reply
                </button>
              )}
              {repliesOf(c.id).length > 0 && (
                <ul className="ml-6 mt-3 space-y-3 border-l border-ink-900/8 pl-4">
                  {repliesOf(c.id).map((r) => (
                    <li key={r.id}>
                      <CommentBody comment={r} isMaker={r.author_id === makerId} small />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentBody({
  comment,
  isMaker,
  small,
}: {
  comment: Comment;
  isMaker: boolean;
  small?: boolean;
}) {
  const author = comment.profiles;
  return (
    <div className="flex gap-3">
      <Avatar src={author?.avatar_url} name={author?.full_name} size={small ? 28 : 32} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/makers/${comment.author_id}`}
            className="text-[13px] font-semibold text-ink-900 hover:text-oxblood-600"
          >
            {author?.full_name || "A maker"}
          </Link>
          {isMaker && (
            <span className="rounded-full border border-oxblood-500/20 bg-oxblood-500/8 px-2 py-0.5 text-[10px] font-medium text-oxblood-600">
              Maker
            </span>
          )}
          <span className="text-[11px] text-ink-400">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
          {comment.body}
        </p>
      </div>
    </div>
  );
}
