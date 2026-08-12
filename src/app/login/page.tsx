import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { AuthAside } from "@/components/auth-aside";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-20">
      <div className="flex justify-center lg:justify-start">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
      <AuthAside />
    </div>
  );
}
