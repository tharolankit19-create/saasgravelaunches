-- ============================================================
--  SAASGRAVE LAUNCHES — schema for the weekly launchpad
--
--  This runs against the SAME Supabase project as Saasgrave. Launches is not
--  a separate product; it's a launchpad feature of Saasgrave that happens to
--  live on its own subdomain. One account, one `profiles` row, both surfaces.
--
--  ── SAFETY CONTRACT ────────────────────────────────────────
--  This file is STRICTLY ADDITIVE. It may only:
--    • create `launch_*` tables, indexes, policies and functions
--    • ADD nullable columns to `profiles`
--    • create shared plumbing (the signup trigger, storage policies) ONLY
--      when it is missing, so a fresh project still works
--
--  It must never DROP, REPLACE or ALTER anything Saasgrave owns — not
--  `startups`, `payments`, `offers`, `community_*`, `ad_slots`, not the
--  `handle_new_user` function, not the `on_auth_user_created` trigger, and
--  not the `storage.objects` policies. Those are live and carry real data.
--
--  Everything shared is guarded by an existence check rather than the usual
--  DROP-then-CREATE, because a DROP that succeeds and a CREATE that fails
--  would take Saasgrave's signups or uploads down with it.
--
--  Safe to run on the live project. Safe to re-run.
--  Paste into Supabase → SQL Editor → Run.
-- ============================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
--  PROFILES — shared with Saasgrave, and deliberately so.
--
--  Saasgrave created this table. We only add the two columns the maker
--  profile needs. `add column if not exists` cannot touch existing data, and
--  both columns are nullable, so every one of Saasgrave's existing rows stays
--  exactly as it is.
--
--  The split in what each surface *asks for* and *shows* is handled in the
--  apps, not here: Saasgrave collects and renders its founder fields,
--  Launches collects and renders its maker fields, off one row.
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
  featured      boolean default false,             -- editor's pick, never for sale
  featured_at   timestamptz,
  upvote_count  int default 0,
  comment_count int default 0,
  view_count    int default 0,
  click_count   int default 0,
  badge_clicks  int default 0,                     -- hits on the embeddable badge

  -- provenance of the autofill, so we can debug bad scrapes
  autofill_source jsonb,

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Columns added after the first release — repeated here so re-running this
-- file upgrades an older launchpad install in place.
alter table public.launch_products add column if not exists featured     boolean default false;
alter table public.launch_products add column if not exists featured_at  timestamptz;
alter table public.launch_products add column if not exists badge_clicks int default 0;

create index if not exists launch_products_week_idx
  on public.launch_products(launch_week, upvote_count desc);
create index if not exists launch_products_maker_idx    on public.launch_products(maker_id);
create index if not exists launch_products_status_idx   on public.launch_products(status);
create index if not exists launch_products_featured_idx on public.launch_products(featured);
create index if not exists launch_products_cat_idx      on public.launch_products using gin(categories);

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
--
--  Note this is `launch_ads`, NOT Saasgrave's `ad_slots`. Two separate
--  inventories that happen to share a database.
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
--  PAYMENTS — Dodo transactions for the launchpad. Deliberately
--  separate from Saasgrave's `payments` (108 rows and counting) so
--  the two ledgers can never collide or confuse a reconciliation.
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
--  NEWSLETTER — the launchpad's own list, separate from
--  Saasgrave's `newsletter_subscribers`.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_subscribers (
  email      text primary key,
  source     text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
--  DIRECTORY ORDERS — the no-login "pay and we do it" flow.
--
--  A buyer with no account pays through a hosted Dodo link and fills in the
--  handful of things we actually need. Each order gets a private token that is
--  the only key to its status page — the buyer watches progress there, the
--  admin edits it. Additive and fully self-contained: nothing here touches an
--  existing table, and it carries no auth of its own (RLS stays off; every read
--  and write goes through the service role, scoped by the opaque token).
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

-- ─────────────────────────────────────────────────────────────
--  ARTICLES — AI-written SEO blog posts (the Premium+ deliverable).
--  Hosted on our domain with dofollow links to the buyer's product. Additive.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  subtitle      text,
  body_md       text not null,
  product_name  text,
  product_url   text,
  product_slug  text,
  status        text not null default 'published',   -- published | draft
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists launch_articles_status_idx on public.launch_articles(status, created_at desc);
create index if not exists launch_articles_slug_idx on public.launch_articles(slug);

-- ─────────────────────────────────────────────────────────────
--  PLANET CLAIMS — the "conquer the solar system" pay-to-own board.
--
--  Each celestial body is a slot one SaaS can own. Bigger body = higher floor
--  price; to take a body someone else owns, you pay more than they did. No
--  login required; additive, RLS off, service-role only, opaque token per row.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_planet_claims (
  id              uuid primary key default gen_random_uuid(),
  planet_id       text not null,               -- fixed body key, e.g. 'jupiter'
  public_token    text unique not null,
  product_name    text,
  url             text not null,
  logo_url        text,
  tagline         text,
  amount_cents    int not null,
  status          text not null default 'pending',  -- pending | active
  contact_email   text,
  user_id         uuid references public.profiles(id) on delete set null,
  dodo_payment_id text,
  created_at      timestamptz default now(),
  activated_at    timestamptz
);
create index if not exists launch_planet_claims_planet_idx
  on public.launch_planet_claims(planet_id, status, amount_cents desc);
create index if not exists launch_planet_claims_token_idx
  on public.launch_planet_claims(public_token);

-- ─────────────────────────────────────────────────────────────
--  SHARED PLUMBING — created ONLY if missing.
--
--  On the live project all of this already exists and these blocks do
--  nothing. On a fresh project they bootstrap it. What they must never do is
--  replace a working `handle_new_user` or drop a live trigger: that function
--  is what turns a signup into a profile row, and Launches depends on it
--  exactly as much as Saasgrave does.
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ) then
    execute $fn$
      create function public.handle_new_user()
      returns trigger language plpgsql security definer set search_path = public as $body$
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
      $body$;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth' and c.relname = 'users'
      and t.tgname = 'on_auth_user_created' and not t.tgisinternal
  ) then
    execute $tg$
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute function public.handle_new_user();
    $tg$;
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'touch_updated_at'
  ) then
    execute $fn$
      create function public.touch_updated_at()
      returns trigger language plpgsql as $body$
      begin new.updated_at = now(); return new; end;
      $body$;
    $fn$;
  end if;
end
$$;

-- Our own table's trigger, reusing whichever `touch_updated_at` is there.
drop trigger if exists launch_products_touch on public.launch_products;
create trigger launch_products_touch
  before update on public.launch_products
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY — launch_* tables only.
--  `profiles` RLS is Saasgrave's and is left exactly as it is.
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
--  RPCs — all `launch_`-prefixed so they can't collide with
--  Saasgrave's `increment_view` / `toggle_post_like`.
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

create or replace function public.increment_launch_badge(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.launch_products set badge_clicks = badge_clicks + 1 where slug = p_slug;
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
--  STORAGE — Saasgrave already created these buckets and policies.
--  We reuse them as-is. Each statement is guarded so nothing live is
--  ever dropped; on a fresh project they get created.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true), ('logos','logos',true), ('screenshots','screenshots',true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects' and p.polname = 'storage public read'
  ) then
    execute $p$
      create policy "storage public read" on storage.objects
        for select using (bucket_id in ('avatars','logos','screenshots'));
    $p$;
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects' and p.polname = 'storage user upload'
  ) then
    execute $p$
      create policy "storage user upload" on storage.objects
        for insert to authenticated
        with check (
          bucket_id in ('avatars','logos','screenshots')
          and (storage.foldername(name))[1] = auth.uid()::text
        );
    $p$;
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects' and p.polname = 'storage user update'
  ) then
    execute $p$
      create policy "storage user update" on storage.objects
        for update to authenticated
        using (
          bucket_id in ('avatars','logos','screenshots')
          and (storage.foldername(name))[1] = auth.uid()::text
        );
    $p$;
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects' and p.polname = 'storage user delete'
  ) then
    execute $p$
      create policy "storage user delete" on storage.objects
        for delete to authenticated
        using (
          bucket_id in ('avatars','logos','screenshots')
          and (storage.foldername(name))[1] = auth.uid()::text
        );
    $p$;
  end if;
end
$$;

-- ============================================================
--  ADDITIONS — Premium subscription, weekly Featured, reputation
--  Same safety contract as everything above: additive only.
-- ============================================================

-- $9 Featured runs for one ISO week, so it needs an expiry rather than a flag.
alter table public.launch_products add column if not exists featured_until timestamptz;
alter table public.launch_products add column if not exists featured_week   text;

create index if not exists launch_products_featured_week_idx
  on public.launch_products(featured_week, featured_until);

-- ============================================================
--  BADGE VERIFICATION — the "verified member" backlink check.
--  A maker pastes our badge on their own site; we fetch that page and confirm
--  the dofollow link is really there, then mark the launch verified. Additive.
-- ============================================================
alter table public.launch_products add column if not exists badge_verified    boolean default false;
alter table public.launch_products add column if not exists badge_verified_at  timestamptz;
alter table public.launch_products add column if not exists badge_checked_at   timestamptz;

-- ============================================================
--  PRODUCT SOCIALS — the company's own X and LinkedIn pages.
--  Both optional; shown on the product page so visitors can follow the
--  company, not just the maker. Additive.
-- ============================================================
alter table public.launch_products add column if not exists x_url        text;
alter table public.launch_products add column if not exists linkedin_url text;

-- ─────────────────────────────────────────────────────────────
--  SUBSCRIPTIONS — the $29/month Premium tier.
--  One active row per user. The webhook is the source of truth for
--  `status`; nothing in the browser can grant it.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  status               text not null default 'pending',   -- pending | active | cancelled | expired
  dodo_subscription_id text,
  dodo_payment_id      text,
  current_period_end   timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create index if not exists launch_subs_user_idx on public.launch_subscriptions(user_id, status);

alter table public.launch_subscriptions enable row level security;

drop policy if exists "launch subs read own" on public.launch_subscriptions;
create policy "launch subs read own" on public.launch_subscriptions
  for select using (auth.uid() = user_id);

drop trigger if exists launch_subs_touch on public.launch_subscriptions;
create trigger launch_subs_touch
  before update on public.launch_subscriptions
  for each row execute function public.touch_updated_at();

-- Is this user on Premium right now? One place, so every gate agrees.
create or replace function public.launch_is_premium(p_user uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.launch_subscriptions
    where user_id = p_user
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$$;

-- ─────────────────────────────────────────────────────────────
--  REPUTATION — computed, never stored.
--
--  Storing a score means every upvote has to write to `profiles`, which is a
--  table Saasgrave also writes to. Computing it on read keeps the launchpad's
--  gamification entirely out of the shared row.
--
--  `streak` counts consecutive ISO weeks the maker launched in, ending at the
--  current or previous week — miss two weeks and it resets, which is what
--  makes it worth keeping.
-- ─────────────────────────────────────────────────────────────
create or replace function public.launch_maker_stats(p_user uuid)
returns table (
  launches         int,
  upvotes_received int,
  upvotes_given    int,
  comments_made    int,
  streak_weeks     int,
  reputation       int
)
language plpgsql security definer set search_path = public as $$
declare
  v_launches int;
  v_recv     int;
  v_given    int;
  v_comments int;
  v_streak   int := 0;
  v_cursor   date;
  v_week     text;
begin
  select count(*)::int, coalesce(sum(upvote_count), 0)::int
    into v_launches, v_recv
    from public.launch_products
    where maker_id = p_user and status = 'live';

  select count(*)::int into v_given
    from public.launch_upvotes u
    join public.launch_products p on p.id = u.product_id
    where u.user_id = p_user and p.maker_id <> p_user;

  select count(*)::int into v_comments
    from public.launch_comments
    where author_id = p_user;

  -- Walk back week by week from the current one. Allow the current week to be
  -- empty (it may not be over yet) without breaking the run.
  v_cursor := (date_trunc('week', now()))::date;
  for i in 0..200 loop
    v_week := to_char(v_cursor, 'IYYY') || '-W' || to_char(v_cursor, 'IW');
    if exists (
      select 1 from public.launch_products
      where maker_id = p_user and status = 'live' and launch_week = v_week
    ) then
      v_streak := v_streak + 1;
    elsif i > 0 then
      exit;
    end if;
    v_cursor := v_cursor - interval '7 days';
  end loop;

  return query select
    v_launches,
    v_recv,
    v_given,
    v_comments,
    v_streak,
    -- Weighted so that supporting other makers and getting real votes both
    -- count, and simply submitting a lot does not.
    (v_launches * 10 + v_recv * 3 + v_given * 2 + v_comments * 2 + v_streak * 15)::int;
end;
$$;
