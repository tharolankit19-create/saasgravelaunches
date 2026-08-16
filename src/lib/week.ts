// ─── Weeks ──────────────────────────────────────────────────
// The launchpad is organised by ISO week: a launch belongs to one week, the
// board ranks that week, and the leaderboard is a list of week winners.
// Everything is UTC so a maker in IST and a visitor in PST see the same board
// flip at the same moment.
//
// ── Numbering ──
// ISO week numbers are stored (`2026-W33`) but never shown. Nobody arriving at
// a brand-new launchpad should read "Week 33" — it implies thirty-two weeks of
// history that don't exist. What's displayed is the week's number *on this
// platform*: the first week we're live is Week 1, the next is Week 2.
//
// The epoch is set once, in NEXT_PUBLIC_LAUNCH_EPOCH_WEEK, and never changes
// again — moving it would renumber every past week and every archived URL.
// Weeks before the epoch don't exist as far as the UI is concerned.

export type WeekKey = string; // "2026-W33"

const DAY = 86_400_000;

/** Fallback epoch, used until NEXT_PUBLIC_LAUNCH_EPOCH_WEEK is set. */
const DEFAULT_EPOCH: WeekKey = "2026-W33";

/** The ISO week that counts as Week 1. */
export function launchEpoch(): WeekKey {
  const configured = process.env.NEXT_PUBLIC_LAUNCH_EPOCH_WEEK?.trim();
  return configured && parseWeekKey(configured) ? configured : DEFAULT_EPOCH;
}

/** Thursday-based ISO week number, per ISO-8601. */
export function isoWeekOf(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Shift to the Thursday of this week — its year is the ISO year.
  const dayNum = d.getUTCDay() || 7; // Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / DAY + 1) / 7);
  return { year, week };
}

export function weekKey(date: Date = new Date()): WeekKey {
  const { year, week } = isoWeekOf(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function currentWeekKey(): WeekKey {
  return weekKey(new Date());
}

export function parseWeekKey(key: string): { year: number; week: number } | null {
  const m = /^(\d{4})-W(\d{1,2})$/.exec((key || "").trim());
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  return { year, week };
}

/** Monday 00:00:00 UTC that starts the given ISO week. */
export function weekStart(key: WeekKey): Date {
  const parsed = parseWeekKey(key) || isoWeekOf(new Date());
  const { year, week } = parsed;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4.getTime() - (jan4Day - 1) * DAY);
  return new Date(week1Monday.getTime() + (week - 1) * 7 * DAY);
}

/** Monday 00:00 → the following Monday 00:00 (exclusive end). */
export function weekRange(key: WeekKey): { start: Date; end: Date } {
  const start = weekStart(key);
  return { start, end: new Date(start.getTime() + 7 * DAY) };
}

export function shiftWeek(key: WeekKey, by: number): WeekKey {
  return weekKey(new Date(weekStart(key).getTime() + by * 7 * DAY));
}

export function isCurrentWeek(key: WeekKey): boolean {
  return key === currentWeekKey();
}

export function isFutureWeek(key: WeekKey): boolean {
  return weekStart(key).getTime() > weekStart(currentWeekKey()).getTime();
}

/**
 * How many weeks a key sits from the epoch. 1 = the platform's first week.
 * Weeks before the epoch come back as 0 or negative and shouldn't be shown.
 */
export function weekNumber(key: WeekKey): number {
  const start = weekStart(key).getTime();
  const epoch = weekStart(launchEpoch()).getTime();
  return Math.round((start - epoch) / (7 * DAY)) + 1;
}

/** True for weeks that predate the platform — nothing to show, ever. */
export function isPreLaunchWeek(key: WeekKey): boolean {
  return weekNumber(key) < 1;
}

/** "Week 1" — what the tabs and headings show. Never the ISO number. */
export function weekLabel(key: WeekKey): string {
  const n = weekNumber(key);
  return n >= 1 ? `Week ${n}` : "Before launch";
}

/** The very first week — worth saying out loud while it's still true. */
export function isFirstWeek(key: WeekKey = currentWeekKey()): boolean {
  return weekNumber(key) === 1;
}

/** "Aug 11 – Aug 17, 2026" — the subtitle under the board. */
export function weekRangeLabel(key: WeekKey): string {
  const { start } = weekRange(key);
  const end = new Date(start.getTime() + 6 * DAY);
  const fmt = (d: Date, withYear = false) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: "UTC",
    });
  return `${fmt(start)} – ${fmt(end, true)}`;
}

/**
 * The tabs a board shows: a few weeks back, this week, one ahead — clamped so
 * it never offers a week from before the platform existed.
 */
export function weekWindow(key: WeekKey = currentWeekKey(), back = 3, forward = 1): WeekKey[] {
  const out: WeekKey[] = [];
  for (let i = -back; i <= forward; i++) {
    const w = shiftWeek(key, i);
    if (!isPreLaunchWeek(w)) out.push(w);
  }
  return out;
}

/**
 * The weeks a maker can schedule a launch into: this week and the next few,
 * never a week before the platform existed. Oldest (this week) first.
 */
export function upcomingWeeks(count = 6): WeekKey[] {
  const out: WeekKey[] = [];
  let cursor = currentWeekKey();
  // If we're somehow before the epoch, jump forward to the first real week.
  while (isPreLaunchWeek(cursor)) cursor = shiftWeek(cursor, 1);
  for (let i = 0; i < count; i++) {
    out.push(cursor);
    cursor = shiftWeek(cursor, 1);
  }
  return out;
}

/** Every week from the epoch up to now, newest first — the archive. */
export function weeksSinceLaunch(limit = 26): WeekKey[] {
  const out: WeekKey[] = [];
  let cursor = currentWeekKey();
  while (out.length < limit && !isPreLaunchWeek(cursor)) {
    out.push(cursor);
    cursor = shiftWeek(cursor, -1);
  }
  return out;
}

/** Milliseconds until the current week's board closes. */
export function msUntilWeekEnd(now: Date = new Date()): number {
  const { end } = weekRange(weekKey(now));
  return Math.max(0, end.getTime() - now.getTime());
}

/** "2d 04h 11m" — the countdown beside the live board. */
export function countdownLabel(ms: number): string {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

/** 'YYYY-MM' — the period an ad slot is sold by. */
export function monthKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(key: string, by: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(Date.UTC(y, (m - 1) + by, 1)));
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
