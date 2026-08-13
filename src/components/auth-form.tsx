"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, inputClass } from "@/components/ui";
import { GoogleButton } from "@/components/google-button";
import { trackEvent } from "@/lib/track-client";

/**
 * Google first, email second, both visible at once. Hiding email behind
 * "other options" costs more sign-ups than it saves in layout.
 *
 * Accounts are shared with Saasgrave — same Supabase project, same profile —
 * so an existing Saasgrave user signs straight in here.
 */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");

    setLoading(true);
    trackEvent("signin_start", { meta: { provider: "email", mode } });

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      trackEvent("signin_success", { meta: { provider: "email", mode } });
      toast.success("Account created. Check your inbox to confirm.");
      router.push(next);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      trackEvent("signin_success", { meta: { provider: "email", mode } });
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink-900">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-500">
          {isRegister ? "Free, no card. Works on Saasgrave too." : "Sign in to launch and upvote."}
        </p>
      </div>

      <GoogleButton next={next} className="w-full" />

      <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
        <div className="h-px flex-1 bg-ink-900/10" />
        or with email
        <div className="h-px flex-1 bg-ink-900/10" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        {isRegister && (
          <Field label="Full name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Maker"
              autoComplete="name"
              required
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            className={inputClass}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "One sec…" : isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link
          href={`${isRegister ? "/login" : "/register"}?next=${encodeURIComponent(next)}`}
          className="font-medium text-ink-900 underline underline-offset-4 hover:text-ember-600"
        >
          {isRegister ? "Sign in" : "Create one — free"}
        </Link>
      </p>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400">
        Already use Saasgrave? Same account works here.
      </p>
    </div>
  );
}
