-- ============================================================
-- FuelTrack Pro — Supabase Schema
-- Run this entire file in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Companies (your customers)
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  industry text,
  address text,
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active','trial','suspended')),
  created_at timestamptz default now()
);

-- Users (people who log into a company)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  full_name text not null,
  role text not null default 'operator' check (role in ('super_admin','admin','site_manager','operator')),
  phone text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now()
);

-- Vendors (diesel suppliers)
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  vat_number text,
  payment_terms text default '30 days',
  status text not null default 'active' check (status in ('active','inactive','on_hold')),
  created_at timestamptz default now()
);

-- Tanks
create table if not exists tanks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  location text,
  capacity_litres numeric(10,2) not null,
  current_level_litres numeric(10,2) not null default 0,
  low_level_alert_pct numeric(5,2) not null default 25,
  status text not null default 'active' check (status in ('active','inactive','maintenance')),
  created_at timestamptz default now(),
  constraint current_level_non_negative check (current_level_litres >= 0),
  constraint current_level_max check (current_level_litres <= capacity_litres)
);

-- Purchase Orders
create table if not exists purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  vendor_id uuid not null references vendors(id),
  tank_id uuid references tanks(id),
  po_number text not null,
  order_date date not null default current_date,
  expected_delivery_date date,
  quantity_ordered_litres numeric(10,2) not null,
  quantity_received_litres numeric(10,2) default 0,
  price_per_litre numeric(8,4),
  reference_number text,
  status text not null default 'pending' check (status in ('pending','in_transit','received','overdue','cancelled')),
  notes text,
  created_by uuid references profiles(id),
  received_at timestamptz,
  created_at timestamptz default now()
);

-- Vehicles
create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  registration text not null,
  fleet_number text,
  make text,
  model text,
  year integer,
  vehicle_type text,
  tank_capacity_litres numeric(8,2),
  current_odometer_km numeric(10,2) default 0,
  status text not null default 'active' check (status in ('active','service','inactive')),
  created_at timestamptz default now()
);

-- Drivers
create table if not exists drivers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  gender text check (gender in ('male','female','other','prefer_not_to_say')),
  date_of_birth date,
  id_number text,
  licence_number text,
  licence_code text,
  licence_expiry date,
  phone text,
  email text,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz default now()
);

-- Activity types (per company)
create table if not exists activity_types (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Fuel Issues (diesel issued to a vehicle from a tank)
create table if not exists fuel_issues (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id),
  driver_id uuid not null references drivers(id),
  tank_id uuid not null references tanks(id),
  issued_at timestamptz not null default now(),
  litres_issued numeric(8,2) not null,
  odometer_reading_km numeric(10,2),
  hours_meter numeric(10,2),
  notes text,
  posted_by uuid references profiles(id),
  created_at timestamptz default now(),
  constraint litres_positive check (litres_issued > 0)
);

-- Daily Activity Log
create table if not exists daily_activities (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id),
  driver_id uuid not null references drivers(id),
  activity_type_id uuid references activity_types(id),
  activity_date date not null default current_date,
  shift text check (shift in ('day','night')),
  hours_worked numeric(6,2),
  km_travelled numeric(8,2),
  start_odometer_km numeric(10,2),
  end_odometer_km numeric(10,2),
  task_description text,
  notes text,
  posted_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Automatically deduct litres from tank when fuel is issued
create or replace function deduct_fuel_from_tank()
returns trigger as $$
begin
  update tanks
  set current_level_litres = current_level_litres - NEW.litres_issued
  where id = NEW.tank_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_deduct_fuel
after insert on fuel_issues
for each row execute function deduct_fuel_from_tank();

-- Automatically add litres to tank when PO is received
create or replace function add_fuel_to_tank_on_po_receive()
returns trigger as $$
begin
  if NEW.status = 'received' and OLD.status != 'received' and NEW.tank_id is not null then
    update tanks
    set current_level_litres = current_level_litres + NEW.quantity_received_litres
    where id = NEW.tank_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_add_fuel_on_receive
after update on purchase_orders
for each row execute function add_fuel_to_tank_on_po_receive();

-- Auto-create profile when user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email), 'operator');
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table companies enable row level security;
alter table profiles enable row level security;
alter table vendors enable row level security;
alter table tanks enable row level security;
alter table purchase_orders enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table activity_types enable row level security;
alter table fuel_issues enable row level security;
alter table daily_activities enable row level security;

-- Helper function: get current user's company_id
create or replace function my_company_id()
returns uuid as $$
  select company_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper function: get current user's role
create or replace function my_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Companies: super_admin sees all; others see only their company
create policy "companies_select" on companies for select
  using (id = my_company_id() or my_role() = 'super_admin');
create policy "companies_insert" on companies for insert
  with check (my_role() = 'super_admin');
create policy "companies_update" on companies for update
  using (my_role() = 'super_admin');

-- Profiles: users see profiles in their company
create policy "profiles_select" on profiles for select
  using (company_id = my_company_id() or my_role() = 'super_admin');
create policy "profiles_update" on profiles for update
  using (id = auth.uid() or my_role() in ('super_admin','admin'));

-- Vendors
create policy "vendors_all" on vendors for all
  using (company_id = my_company_id() or my_role() = 'super_admin');

-- Tanks
create policy "tanks_all" on tanks for all
  using (company_id = my_company_id() or my_role() = 'super_admin');

-- Purchase Orders
create policy "po_all" on purchase_orders for all
  using (company_id = my_company_id() or my_role() = 'super_admin');

-- Vehicles
create policy "vehicles_all" on vehicles for all
  using (company_id = my_company_id() or my_role() = 'super_admin');

-- Drivers
create policy "drivers_all" on drivers for all
  using (company_id = my_company_id() or my_role() = 'super_admin');

-- Activity Types
create policy "activity_types_all" on activity_types for all
  using (company_id = my_company_id() or my_role() = 'super_admin');

-- Fuel Issues
create policy "fuel_issues_all" on fuel_issues for all
  using (company_id = my_company_id() or my_role() = 'super_admin');

-- Daily Activities
create policy "daily_activities_all" on daily_activities for all
  using (company_id = my_company_id() or my_role() = 'super_admin');

-- ============================================================
-- VIEWS (for reporting)
-- ============================================================

create or replace view v_tank_status as
select
  t.id,
  t.company_id,
  t.name,
  t.location,
  t.capacity_litres,
  t.current_level_litres,
  round((t.current_level_litres / nullif(t.capacity_litres,0)) * 100, 1) as level_pct,
  t.low_level_alert_pct,
  case
    when round((t.current_level_litres / nullif(t.capacity_litres,0)) * 100, 1) <= t.low_level_alert_pct then 'low'
    when round((t.current_level_litres / nullif(t.capacity_litres,0)) * 100, 1) <= (t.low_level_alert_pct + 15) then 'monitor'
    else 'healthy'
  end as level_status,
  t.status
from tanks t;

create or replace view v_fuel_issues_detail as
select
  fi.id,
  fi.company_id,
  fi.issued_at,
  fi.litres_issued,
  fi.odometer_reading_km,
  fi.hours_meter,
  fi.notes,
  v.registration as vehicle_registration,
  v.make || ' ' || v.model as vehicle_name,
  d.full_name as driver_name,
  tk.name as tank_name,
  p.full_name as posted_by_name
from fuel_issues fi
left join vehicles v on v.id = fi.vehicle_id
left join drivers d on d.id = fi.driver_id
left join tanks tk on tk.id = fi.tank_id
left join profiles p on p.id = fi.posted_by;

create or replace view v_daily_activities_detail as
select
  da.id,
  da.company_id,
  da.activity_date,
  da.shift,
  da.hours_worked,
  da.km_travelled,
  da.start_odometer_km,
  da.end_odometer_km,
  da.task_description,
  da.notes,
  v.registration as vehicle_registration,
  v.make || ' ' || v.model as vehicle_name,
  d.full_name as driver_name,
  at2.name as activity_type_name,
  p.full_name as posted_by_name
from daily_activities da
left join vehicles v on v.id = da.vehicle_id
left join drivers d on d.id = da.driver_id
left join activity_types at2 on at2.id = da.activity_type_id
left join profiles p on p.id = da.posted_by;
