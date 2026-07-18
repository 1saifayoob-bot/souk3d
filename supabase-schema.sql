-- Souk3D Supabase Schema
-- Run this in your Supabase SQL Editor at https://app.supabase.com

-- 1. Customers (create first — orders & custom_orders reference it)
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text,
  address jsonb,
  heritage text,
  preferred_language text default 'en',
  notes jsonb default '[]',
  manual_tags text[] default '{}',
  removed_auto_tags text[] default '{}',
  created_at timestamptz default now()
);

-- 2. Products
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  name_ar text,
  category text,
  country text,
  price decimal(10,2),
  compare_at_price decimal(10,2),
  cost decimal(10,2),
  stock integer default 0,
  status text default 'draft',
  featured boolean default false,
  images jsonb default '[]',
  description text,
  description_ar text,
  tags text[],
  external_links jsonb,
  meta_title text,
  meta_description text,
  created_at timestamptz default now()
);

-- 3. Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references customers(id),
  status text default 'new',
  items jsonb not null,
  subtotal decimal(10,2),
  shipping decimal(10,2),
  tax decimal(10,2),
  total decimal(10,2),
  shipping_address jsonb,
  tracking_number text,
  notes text,
  payment_status text default 'pending',
  created_at timestamptz default now()
);

-- 4. Custom Orders
create table custom_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  status text default 'new',
  request jsonb not null,
  messages jsonb default '[]',
  quote jsonb,
  mockups jsonb default '[]',
  created_at timestamptz default now()
);

-- 5. Discounts
create table discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  type text not null,
  value decimal(10,2),
  status text default 'active',
  conditions jsonb,
  usage_limit integer,
  usage_count integer default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- Enable Row Level Security on all tables
alter table customers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table custom_orders enable row level security;
alter table discounts enable row level security;

-- Allow authenticated users (admin) full access
create policy "Admin full access" on customers for all using (auth.role() = 'authenticated');
create policy "Admin full access" on products for all using (auth.role() = 'authenticated');
create policy "Admin full access" on orders for all using (auth.role() = 'authenticated');
create policy "Admin full access" on custom_orders for all using (auth.role() = 'authenticated');
create policy "Admin full access" on discounts for all using (auth.role() = 'authenticated');

-- Allow public read on products (storefront)
create policy "Public read products" on products for select using (status = 'active');

-- 6. Newsletter subscribers (Email & Marketing tab)
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text not null default 'subscribed',
  source text default 'site',
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz default now(),
  unsubscribed_at timestamptz
);
alter table newsletter_subscribers enable row level security;
-- No policies on purpose: only the service role (the /api endpoints) can read or write.
create index if not exists newsletter_subscribers_status_idx on newsletter_subscribers (status);

-- Make sure the WELCOME10 code advertised on the homepage actually works at checkout.
insert into discounts (code, name, type, value, status)
select 'WELCOME10', 'Newsletter welcome — 10% off', 'percent', 10, 'active'
where not exists (select 1 from discounts where code ilike 'WELCOME10');
