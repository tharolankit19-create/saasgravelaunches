-- ─────────────────────────────────────────────────────────────
--  MIGRATION: no-login directory-blast orders
--
--  Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New
--  query → paste → Run). It's the exact block already in schema.sql, pulled
--  out so you don't have to re-run the whole file.
--
--  Strictly additive: `create table if not exists`, one new table, one helper
--  function, one trigger. Nothing Saasgrave owns is touched. Safe to re-run.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.launch_directory_orders (
  id               uuid primary key default gen_random_uuid(),
  public_token     text unique not null,        -- the buyer's only key
  tier             text not null,               -- starter49 | growth99 | premium149
  amount_cents     int,

  -- what the buyer told us
  product_name     text not null,
  website_url      text,
  x_handle         text,
  linkedin_handle  text,
  contact_email    text,
  category         text,
  short_pitch      text,
  notes            text,

  -- what we tell the buyer back
  status           text not null default 'received',  -- received | paid | in_progress | completed | on_hold
  live_note        text,                        -- the "what's happening right now" line
  submitted_count  int default 0,
  report_url       text,

  -- payment + operator bookkeeping (never shown to the buyer)
  dodo_payment_id  text,
  admin_notes      text,

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists launch_directory_orders_token_idx
  on public.launch_directory_orders(public_token);
create index if not exists launch_directory_orders_created_idx
  on public.launch_directory_orders(created_at desc);

-- keep updated_at honest
create or replace function public.launch_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists launch_directory_orders_touch on public.launch_directory_orders;
create trigger launch_directory_orders_touch
  before update on public.launch_directory_orders
  for each row execute function public.launch_touch_updated_at();
