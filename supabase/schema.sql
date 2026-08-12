-- ============================================================
--  SAASGRAVE LAUNCHES — schema for the weekly launchpad
--
--  This runs against the SAME Supabase project as Saasgrave. It only ever
--  ADDS `launch_*` tables and reuses `public.profiles` (and its
--  auth.users trigger) so one account works across both products.
--
--  Nothing here touches or drops a Saasgrave table. Safe to re-run.
--  Paste into Supabase → SQL Editor → Run.
-- ============================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
--  PROFILES — shared with Saasgrave.
--  Created there; these columns are the launchpad's additions, so
--  running this file on a fresh project (or an old one) is safe.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  bio         text,
  x_handle    text,
  website_url text,
  created_at  timestamptz default now()
);

alter table public.profiles add column if not exists maker_headline text;
alter table public.profiles add column if not exists github_handle  text;
alter table public.profiles add column if not exists is_admin       boolean default false;

-- ─────────────────────────────────────────────────────────────
--  LAUNCH PRODUCTS — one row per launch.
--  A product belongs to exactly one ISO week; the weekly board and
--  the all-time leaderboard are both views over this table.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_products (
  id            uuid primary key default gen_random_uuid(),
  maker_id      uuid not null references public.profiles(id) on delete cascade,
  slug          text unique not null,

  -- the essentials (all the submit form asks for)
  name          text not null,
  tagline       text not null,
  description   text,
  website_url   text not null,
  logo_url      text,
  gallery_urls  text[] default '{}',
  categories    text[] default '{}',
  pricing_model text,                              -- free | freemium | paid | trial

  -- the optional depth an SEO page wants (AI prefills, maker edits)
  who_for       text,
  problem       text,
  solution      text,
  unique_edge   text,
  seo_title     text,
  seo_description text,
  keywords      text[] default '{}',
  alternatives  text[] default '{}',               -- "alternative to X"
  faq           jsonb  default '[]'::jsonb,        -- [{q,a}]
  maker_note    text,                              -- founder's pinned first comment

  -- launch lifecycle
  status        text default 'draft',              -- draft | live | removed
  launch_week   text,                              -- ISO week key, e.g. 2026-W33
  launched_at   timestamptz,

  -- tiers & counters
  tier          text default 'free',               -- free | premium
  verified      boolean default false,
  upvote_count  int default 0,
  comment_count int default 0,
  view_count    int default 0,
  click_count   int default 0,

  -- provenance of the autofill, so we can debug bad scrapes
  autofill_source jsonb,

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists launch_products_week_idx
  on public.launch_products(launch_week, upvote_count desc);
create index if not exists launch_products_maker_idx  on public.launch_products(maker_id);
create index if not exists launch_products_status_idx on public.launch_products(status);
create index if not exists launch_products_cat_idx    on public.launch_products using gin(categories);

-- ─────────────────────────────────────────────────────────────
--  UPVOTES — one per (product, user). The counter on the product
--  is denormalised and kept in sync by the toggle RPC below.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_upvotes (
  product_id uuid not null references public.launch_products(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (product_id, user_id)
);
create index if not exists launch_upvotes_user_idx on public.launch_upvotes(user_id);

-- ─────────────────────────────────────────────────────────────
--  COMMENTS — flat thread plus one level of replies.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_comments (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.launch_products(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  parent_id  uuid references public.launch_comments(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);
create index if not exists launch_comments_product_idx on public.launch_comments(product_id, created_at);

-- ─────────────────────────────────────────────────────────────
--  AD SLOTS — the paid rail beside the feed. Priced per calendar
--  month; `month_key` is 'YYYY-MM'. Slot counts are the scarcity.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_ads (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid references public.profiles(id) on delete set null,
  placement  text not null,                   -- sidebar | feed
  month_key  text not null,                   -- 2026-08
  slot_index int  not null,                   -- 1..n within placement+month
  headline   text,
  body       text,
  cta_label  text,
  cta_url    text,
  image_url  text,
  active     boolean default false,           -- flipped true by the webhook
  click_count int default 0,
  created_at timestamptz default now(),
  unique (placement, month_key, slot_index)
);
create index if not exists launch_ads_live_idx on public.launch_ads(month_key, placement, active);

-- ─────────────────────────────────────────────────────────────
--  PAYMENTS — Dodo transactions for this product. Kept separate
--  from Saasgrave's `payments` so the two ledgers never collide.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete set null,
  kind            text not null,              -- ad_sidebar | ad_feed | premium
  reference_id    uuid,                       -- launch_ads.id or launch_products.id
  amount_cents    int,
  currency        text default 'usd',
  status          text default 'pending',     -- pending | paid | failed
  dodo_payment_id text,
  created_at      timestamptz default now()
);
create index if not exists launch_payments_user_idx on public.launch_payments(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
--  EVENTS — the traffic + friction telemetry the admin diagnosis
--  (and the Hermes watcher) reads. Deliberately tiny and additive:
--  one row per meaningful step, no PII beyond an anonymous session id.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_events (
  id           bigserial primary key,
  event        text not null,                 -- page_view | submit_start | autofill_* | publish | upvote | outbound_click …
  path         text,
  referrer     text,
  referrer_host text,
  session_id   text,
  user_id      uuid references public.profiles(id) on delete set null,
  product_slug text,
  meta         jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);
create index if not exists launch_events_created_idx  on public.launch_events(created_at desc);
create index if not exists launch_events_event_idx    on public.launch_events(event, created_at desc);
create index if not exists launch_events_session_idx  on public.launch_events(session_id, created_at);

-- ─────────────────────────────────────────────────────────────
--  NEWSLETTER
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_subscribers (
  email      text primary key,
  source     text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
--  TRIGGERS
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists launch_products_touch on public.launch_products;
create trigger launch_products_touch
  before update on public.launch_products
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table public.launch_products    enable row level security;
alter table public.launch_upvotes     enable row level security;
alter table public.launch_comments    enable row level security;
alter table public.launch_ads         enable row level security;
alter table public.launch_payments    enable row level security;
alter table public.launch_events      enable row level security;
alter table public.launch_subscribers enable row level security;

-- products: anyone reads a live launch; makers manage their own drafts
drop policy if exists "launch products read"   on public.launch_products;
drop policy if exists "launch products insert" on public.launch_products;
drop policy if exists "launch products update" on public.launch_products;
drop policy if exists "launch products delete" on public.launch_products;
create policy "launch products read"   on public.launch_products
  for select using (status = 'live' or auth.uid() = maker_id);
create policy "launch products insert" on public.launch_products
  for insert with check (auth.uid() = maker_id);
create policy "launch products update" on public.launch_products
  for update using (auth.uid() = maker_id);
create policy "launch products delete" on public.launch_products
  for delete using (auth.uid() = maker_id);

-- upvotes: public counts, one row per user, users own their vote
drop policy if exists "launch upvotes read"   on public.launch_upvotes;
drop policy if exists "launch upvotes insert" on public.launch_upvotes;
drop policy if exists "launch upvotes delete" on public.launch_upvotes;
create policy "launch upvotes read"   on public.launch_upvotes for select using (true);
create policy "launch upvotes insert" on public.launch_upvotes for insert with check (auth.uid() = user_id);
create policy "launch upvotes delete" on public.launch_upvotes for delete using (auth.uid() = user_id);

-- comments: public read, author writes
drop policy if exists "launch comments read"   on public.launch_comments;
drop policy if exists "launch comments insert" on public.launch_comments;
drop policy if exists "launch comments delete" on public.launch_comments;
create policy "launch comments read"   on public.launch_comments for select using (true);
create policy "launch comments insert" on public.launch_comments for insert with check (auth.uid() = author_id);
create policy "launch comments delete" on public.launch_comments for delete using (auth.uid() = author_id);

-- ads: public reads the rail; every write is server-side (service role)
drop policy if exists "launch ads read" on public.launch_ads;
create policy "launch ads read" on public.launch_ads for select using (true);

-- payments: a buyer sees their own; writes are server-side only
drop policy if exists "launch payments read own" on public.launch_payments;
create policy "launch payments read own" on public.launch_payments for select using (auth.uid() = user_id);

-- events: write-only from the browser, never readable by it. The admin
-- dashboard and the Hermes watcher read through the service role.
drop policy if exists "launch events insert" on public.launch_events;
create policy "launch events insert" on public.launch_events for insert with check (true);

-- subscribers: anyone can subscribe, nobody can read the list
drop policy if exists "launch subscribers insert" on public.launch_subscribers;
create policy "launch subscribers insert" on public.launch_subscribers for insert with check (true);

-- ─────────────────────────────────────────────────────────────
--  RPCs
-- ─────────────────────────────────────────────────────────────

-- Toggle an upvote and keep the denormalised counter honest, atomically.
create or replace function public.toggle_launch_upvote(p_product uuid)
returns table (count int, upvoted boolean)
language plpgsql security definer set search_path = public as $$
declare
  newcount int;
  now_up   boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.launch_upvotes
             where product_id = p_product and user_id = auth.uid()) then
    delete from public.launch_upvotes
      where product_id = p_product and user_id = auth.uid();
    update public.launch_products
      set upvote_count = greatest(0, upvote_count - 1)
      where id = p_product
      returning upvote_count into newcount;
    now_up := false;
  else
    insert into public.launch_upvotes (product_id, user_id)
      values (p_product, auth.uid())
      on conflict do nothing;
    update public.launch_products
      set upvote_count = upvote_count + 1
      where id = p_product
      returning upvote_count into newcount;
    now_up := true;
  end if;

  return query select coalesce(newcount, 0), now_up;
end;
$$;

-- How many *other people's* launches has this user supported? The submit
-- flow requires a few before you can publish, which is what keeps the board
-- a community rather than a dumping ground.
create or replace function public.launch_support_count(p_user uuid)
returns int language sql security definer set search_path = public as $$
  select count(*)::int
  from public.launch_upvotes u
  join public.launch_products p on p.id = u.product_id
  where u.user_id = p_user and p.maker_id <> p_user;
$$;

create or replace function public.increment_launch_view(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.launch_products set view_count = view_count + 1 where slug = p_slug;
$$;

create or replace function public.increment_launch_click(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.launch_products set click_count = click_count + 1 where slug = p_slug;
$$;

create or replace function public.increment_ad_click(p_ad uuid)
returns void language sql security definer set search_path = public as $$
  update public.launch_ads set click_count = click_count + 1 where id = p_ad;
$$;

-- Keep comment_count in step with the comments table.
create or replace function public.sync_launch_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.launch_products set comment_count = comment_count + 1
      where id = new.product_id;
  elsif tg_op = 'DELETE' then
    update public.launch_products set comment_count = greatest(0, comment_count - 1)
      where id = old.product_id;
  end if;
  return null;
end;
$$;

drop trigger if exists launch_comments_count on public.launch_comments;
create trigger launch_comments_count
  after insert or delete on public.launch_comments
  for each row execute function public.sync_launch_comment_count();

-- ─────────────────────────────────────────────────────────────
--  STORAGE — reuses the buckets Saasgrave already created, and
--  creates them if this is a fresh project.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true), ('logos','logos',true), ('screenshots','screenshots',true)
on conflict (id) do nothing;

drop policy if exists "storage public read" on storage.objects;
create policy "storage public read" on storage.objects
  for select using (bucket_id in ('avatars','logos','screenshots'));

drop policy if exists "storage user upload" on storage.objects;
create policy "storage user upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars','logos','screenshots')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage user update" on storage.objects;
create policy "storage user update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars','logos','screenshots')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage user delete" on storage.objects;
create policy "storage user delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars','logos','screenshots')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
