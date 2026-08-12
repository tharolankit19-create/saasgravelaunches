"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * The maker profile. Shared with Saasgrave — this writes the same `profiles`
 * row — so anything filled in here shows up on both sites.
 */
export function ProfileForm({
  initial,
}: {
  initial: {
    full_name: string | null;
    maker_headline: string | null;
    bio: string | null;
    x_handle: string | null;
    github_handle: string | null;
    website_url: string | null;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: initial.full_name || "",
    maker_headline: initial.maker_headline || "",
    bio: initial.bio || "",
    x_handle: initial.x_handle || "",
    github_handle: initial.github_handle || "",
    website_url: initial.website_url || "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't save that.");
      toast.success("Profile saved.");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            className={inputClass}
            placeholder="Jane Maker"
          />
        </Field>
        <Field label="Headline" hint="one line, shown under your name">
          <input
            value={form.maker_headline}
            onChange={(e) => set("maker_headline", e.target.value.slice(0, 90))}
            className={inputClass}
            placeholder="Solo founder, shipping weekly"
          />
        </Field>
      </div>

      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value.slice(0, 400))}
          rows={3}
          className={cn(inputClass, "resize-y")}
          placeholder="What you build and why."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="X handle">
          <input
            value={form.x_handle}
            onChange={(e) => set("x_handle", e.target.value)}
            className={inputClass}
            placeholder="@yourhandle"
          />
        </Field>
        <Field label="GitHub">
          <input
            value={form.github_handle}
            onChange={(e) => set("github_handle", e.target.value)}
            className={inputClass}
            placeholder="yourhandle"
          />
        </Field>
        <Field label="Website">
          <input
            value={form.website_url}
            onChange={(e) => set("website_url", e.target.value)}
            className={inputClass}
            placeholder="https://you.com"
          />
        </Field>
      </div>

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
