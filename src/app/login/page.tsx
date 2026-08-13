import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 sm:px-6">
      <Card className="w-full p-7 sm:p-8">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </Card>
    </div>
  );
}
