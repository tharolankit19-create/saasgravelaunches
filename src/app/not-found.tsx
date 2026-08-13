import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember-600">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
        That page didn&apos;t launch
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
        The link is wrong, or the product was removed by its maker. This week&apos;s board is
        still right where you left it.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <LinkButton href="/">See this week</LinkButton>
        <LinkButton href="/products" variant="outline">
          Browse the directory
        </LinkButton>
      </div>
    </div>
  );
}
