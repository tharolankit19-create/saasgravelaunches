/**
 * Route-level loading state.
 *
 * Every page here is server-rendered on demand, so a navigation is a real
 * round-trip. Without this, a click sat on the old page with no feedback and
 * read as "slow"; with it, the new page paints a skeleton the instant you
 * click, so the wait is visible and the app feels responsive.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-12 sm:px-6" aria-hidden>
      <div className="h-3 w-24 rounded bg-ink-900/10" />
      <div className="mt-5 h-9 w-2/3 max-w-md rounded bg-ink-900/10" />
      <div className="mt-3 h-4 w-1/2 max-w-sm rounded bg-ink-900/[0.07]" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-ink-900/8 bg-paper-100 p-4"
            >
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-ink-900/10" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-ink-900/10" />
                <div className="h-3 w-2/3 rounded bg-ink-900/[0.07]" />
              </div>
              <div className="h-9 w-11 shrink-0 rounded-xl bg-ink-900/[0.07]" />
            </div>
          ))}
        </div>
        <div className="hidden space-y-3 lg:block">
          <div className="h-3 w-20 rounded bg-ink-900/10" />
          <div className="h-28 rounded-2xl border border-ink-900/8 bg-paper-100" />
          <div className="h-28 rounded-2xl border border-ink-900/8 bg-paper-100" />
        </div>
      </div>
    </div>
  );
}
