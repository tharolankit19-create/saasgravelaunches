"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ProductLogo, Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

/**
 * Upload one image — a product logo or a profile photo — straight to the given
 * public bucket under the user's own folder (which the storage RLS requires),
 * and hand its public URL back. Shows a live preview and a remove control.
 */
const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

export function PhotoUpload({
  value,
  onChange,
  bucket,
  shape = "square",
  name,
  label = "Upload",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: "logos" | "avatars";
  shape?: "square" | "round";
  /** For the initials fallback in the preview. */
  name?: string | null;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!ACCEPT.includes(file.type)) {
      toast.error("Use a PNG, JPG, WebP, GIF or SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} is over 4 MB.`);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sign in to upload.");
      return;
    }

    setBusy(true);
    try {
      const ext =
        file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        (file.type === "image/svg+xml" ? "svg" : "png");
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      if (data?.publicUrl) {
        onChange(data.publicUrl);
        toast.success("Uploaded.");
      }
    } catch (e: any) {
      console.error("photo upload:", e?.message || e);
      toast.error(`Couldn't upload. ${e?.message || ""}`.trim());
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const preview =
    shape === "round" ? (
      <Avatar src={value} name={name} size={64} />
    ) : (
      <ProductLogo src={value} name={name} size={64} />
    );

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {preview}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-ink-900/15 bg-paper-100 text-ink-500 shadow-card transition hover:text-ember-600"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-ink-900/16 bg-paper-100 px-3.5 py-2 text-[13px] font-medium text-ink-700 transition hover:border-ember-500/50 hover:text-ember-600"
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {busy ? "Uploading…" : value ? "Replace" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
