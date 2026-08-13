"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Screenshot uploader for the launch form.
 *
 * A listing without a screenshot tells a founder nothing, so this is the one
 * thing we make genuinely easy: pick images (or drop them), they go straight to
 * the public `screenshots` bucket under the maker's own folder — which is what
 * the storage RLS policy requires — and their public URLs flow back up into the
 * draft's gallery. No server round-trip through our API; the browser talks to
 * storage directly with the maker's own session.
 */
const BUCKET = "screenshots";
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — a PNG screenshot, not a video
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function ImageUpload({
  value,
  onChange,
  max = MAX_FILES,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const remaining = max - value.length;

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    if (remaining <= 0) {
      toast.error(`That's the limit — ${max} screenshots.`);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sign in to upload screenshots.");
      return;
    }

    const picked = list.slice(0, remaining);
    setBusy(true);
    const uploaded: string[] = [];

    for (const file of picked) {
      if (!ACCEPT.includes(file.type)) {
        toast.error(`${file.name}: only PNG, JPG, WebP or GIF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 5 MB — compress it and try again.`);
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      // The folder MUST be the maker's uid — the storage policy checks it.
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        console.error("upload:", error.message);
        toast.error(`Couldn't upload ${file.name}. ${error.message}`);
        continue;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (data?.publicUrl) uploaded.push(data.publicUrl);
    }

    if (uploaded.length) {
      onChange([...value, ...uploaded].slice(0, max));
      toast.success(`Added ${uploaded.length} screenshot${uploaded.length > 1 ? "s" : ""}.`);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  // Drag to reorder — the first image is the one that shows first on the page.
  function onDrop(i: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === i) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((src, i) => (
            <div
              key={src}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="group relative aspect-video overflow-hidden rounded-lg border border-ink-900/10 bg-paper-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-[3px] bg-ink-900/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-paper-100">
                  Cover
                </span>
              )}
              <span className="absolute right-1.5 top-1.5 flex gap-1">
                <span
                  className="grid h-6 w-6 cursor-grab place-items-center rounded-[3px] bg-ink-900/70 text-paper-100 opacity-0 transition group-hover:opacity-100"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="grid h-6 w-6 place-items-center rounded-[3px] bg-ink-900/70 text-paper-100 transition hover:bg-ember-500"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
          }}
          disabled={busy}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition",
            dragOver
              ? "border-ember-500/60 bg-ember-500/[0.05]"
              : "border-ink-900/20 bg-paper-100 hover:border-ember-500/40 hover:bg-paper-200/50"
          )}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-ember-500" />
          ) : (
            <ImagePlus className="h-5 w-5 text-ink-400" />
          )}
          <span className="text-[13px] font-medium text-ink-700">
            {busy ? "Uploading…" : "Add screenshots"}
          </span>
          <span className="text-[12px] text-ink-400">
            Drag &amp; drop or click · PNG/JPG/WebP · up to {max}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
