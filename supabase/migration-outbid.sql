-- ─────────────────────────────────────────────────────────────
--  MIGRATION: Spotlight pay-to-rank bids
--
--  Run once in the Supabase SQL editor. Strictly additive — one new table in
--  the launch_* namespace, RLS off, nothing Saasgrave owns is touched. Safe to
--  re-run.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_bids (
  id              uuid primary key default gen_random_uuid(),
  public_token    text unique not null,
  entry_key       text not null,               -- normalized url/@handle, for rank + de-dupe
  url             text not null,
  display_url     text,
  handle          text,
  product_name    text,
  tagline         text,
  logo_url        text,
  amount_cents    int not null,
  status          text not null default 'pending',  -- pending | active | expired
  contact_email   text,
  user_id         uuid references public.profiles(id) on delete set null,
  dodo_payment_id text,
  clicks          int default 0,
  created_at      timestamptz default now(),
  activated_at    timestamptz,
  expires_at      timestamptz
);
create index if not exists launch_bids_rank_idx
  on public.launch_bids(status, expires_at, amount_cents desc);
create index if not exists launch_bids_entry_idx on public.launch_bids(entry_key);
create index if not exists launch_bids_token_idx on public.launch_bids(public_token);
