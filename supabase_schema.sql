-- ════════════════════════════════════════════════════════════════
-- KIKO OPS — Supabase Schema
-- Run this in Supabase SQL editor: supabase.com → SQL editor
-- ════════════════════════════════════════════════════════════════

-- Profiles (extends auth.users)
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  role        text check (role in ('admin','area_manager','store_manager','staff')),
  store_id    int,
  region      text,
  email       text,
  created_at  timestamptz default now()
);

-- Sales actuals (daily/monthly from Oracle)
create table sales_actuals (
  id          bigserial primary key,
  store_id    int not null,
  year        int not null,
  month       int not null,
  date        date,
  net_sales   numeric,
  gross_profit numeric,
  units       int,
  transactions int,
  created_at  timestamptz default now()
);

-- Sales targets
create table sales_targets (
  id          bigserial primary key,
  store_id    int not null,
  year        int not null,
  month       int not null,
  target      numeric not null,
  upt_target  numeric default 2.5,
  created_at  timestamptz default now()
);

-- Best sellers (uploaded from Oracle)
create table best_sellers (
  id          bigserial primary key,
  store_id    int,
  report_date date,
  year        int,
  month       int,
  sku         text,
  description text,
  category    text,
  lifecycle   text,
  is_collection boolean default false,
  units       int,
  sales_net   numeric,
  cost        numeric,
  created_at  timestamptz default now()
);

-- SOH (auto-synced from Gmail daily)
create table soh_data (
  id           bigserial primary key,
  store_id     int,
  report_date  date not null,
  sku          text,
  description  text,
  category     text,
  qty          int default 0,
  retail_value numeric,
  cost_value   numeric,
  created_at   timestamptz default now()
);
create index idx_soh_date on soh_data(report_date desc);
create index idx_soh_store on soh_data(store_id);

-- Checklist state
create table checklist (
  id          bigserial primary key,
  store_id    int not null,
  date        date not null,
  checked_by  text,
  items       jsonb default '{}',
  notes       text,
  pct_done    int default 0,
  submitted_at timestamptz,
  created_at  timestamptz default now(),
  unique(store_id, date)
);

-- Schedule
create table schedule (
  id          bigserial primary key,
  store_id    int not null,
  date        date not null,
  employee_name text,
  role        text,
  shift_start time,
  shift_end   time,
  is_opener   boolean default false,
  created_at  timestamptz default now()
);

-- KPI entries
create table kpi_entries (
  id          bigserial primary key,
  store_id    int not null,
  date        date not null,
  upt         numeric,
  conversion  numeric,
  avg_basket  numeric,
  footfall    int,
  notes       text,
  entered_by  text,
  created_at  timestamptz default now()
);

-- Orders / POs
create table orders (
  id          bigserial primary key,
  store_id    int,
  po_number   text,
  status      text default 'pending',
  order_date  date,
  expected_date date,
  supplier    text,
  total_value numeric,
  notes       text,
  created_at  timestamptz default now()
);

-- Gmail sync log
create table sync_log (
  id          bigserial primary key,
  sync_type   text,
  status      text,
  rows_inserted int,
  email_date  date,
  error       text,
  synced_at   timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────

alter table profiles       enable row level security;
alter table sales_actuals  enable row level security;
alter table sales_targets  enable row level security;
alter table best_sellers   enable row level security;
alter table soh_data       enable row level security;
alter table checklist      enable row level security;
alter table schedule       enable row level security;
alter table kpi_entries    enable row level security;
alter table orders         enable row level security;

-- Profiles: users see their own, admins see all
create policy "own profile" on profiles for select using (auth.uid() = id);
create policy "admin all profiles" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Sales: admin/area_manager = all; store_manager = own store
create policy "sales read" on sales_actuals for select using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and (
      p.role in ('admin','area_manager') or p.store_id = store_id
    )
  )
);

-- SOH: same pattern
create policy "soh read" on soh_data for select using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and (
      p.role in ('admin','area_manager') or p.store_id = store_id
    )
  )
);

-- Checklist: store_manager/staff write own store
create policy "checklist read" on checklist for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and (p.role in ('admin','area_manager') or p.store_id = store_id))
);
create policy "checklist write" on checklist for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and (p.role in ('admin','area_manager','store_manager') and p.store_id = store_id))
);
create policy "checklist update" on checklist for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and (p.role in ('admin','area_manager','store_manager') and p.store_id = store_id))
);

-- Targets and best_sellers: authenticated users can read
create policy "targets read" on sales_targets for select using (auth.uid() is not null);
create policy "bs read" on best_sellers for select using (auth.uid() is not null);

