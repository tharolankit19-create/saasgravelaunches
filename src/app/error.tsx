"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-oxblood-600">Error</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
        Something broke on our side
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
        Not your fault, and nothing you typed was lost. Try again — if it keeps happening, the
        board itself is still fine.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="outline">
          Back to this week
        </LinkButton>
      </div>
    </div>
  );
}
