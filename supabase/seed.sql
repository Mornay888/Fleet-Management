-- ============================================================
-- FuelTrack Pro — Seed Data
-- Run AFTER schema.sql
-- This inserts your initial company, vehicle, driver, tank,
-- vendor, and activity types.
-- ============================================================

-- NOTE: Replace 'YOUR-AUTH-USER-UUID' below with the UUID of
-- the first user you create in Supabase Auth → Users.
-- You can find it after signing up in the app, or create one
-- manually in the Supabase dashboard under Authentication → Users.

-- ============================================================
-- 1. COMPANY
-- ============================================================
insert into companies (id, name, industry, status)
values (
  'a1000000-0000-0000-0000-000000000001',
  'My Farm Operations',
  'Agriculture',
  'active'
)
on conflict (id) do nothing;

-- ============================================================
-- 2. VENDOR — Sasol
-- ============================================================
insert into vendors (id, company_id, name, status)
values (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Sasol',
  'active'
)
on conflict (id) do nothing;

-- ============================================================
-- 3. TANK — Tank 1 on Farm 11
-- ============================================================
insert into tanks (id, company_id, name, location, capacity_litres, current_level_litres, low_level_alert_pct)
values (
  'c1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Tank 1',
  'Farm 11',
  1000.00,
  0.00,      -- Set this to actual current stock (litres in the tank right now)
  25.00      -- Alert when below 25% (250 L)
)
on conflict (id) do nothing;

-- ============================================================
-- 4. VEHICLE — Toyota Hilux
-- ============================================================
insert into vehicles (id, company_id, registration, make, model, vehicle_type, current_odometer_km, status)
values (
  'd1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'CC 87 DD GP',
  'Toyota',
  'Hilux',
  'Light vehicle',
  12000.00,
  'active'
)
on conflict (id) do nothing;

-- ============================================================
-- 5. DRIVER — Dawie Fourie
-- ============================================================
insert into drivers (id, company_id, full_name, gender, date_of_birth, status)
values (
  'e1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Dawie Fourie',
  'female',
  '1967-01-01',  -- Approximate: 57 years old as of 2024
  'active'
)
on conflict (id) do nothing;

-- ============================================================
-- 6. ACTIVITY TYPES
-- ============================================================
insert into activity_types (id, company_id, name, is_active)
values
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Cattle movement', true),
  ('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Private use',     true),
  ('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Transport',       true)
on conflict (id) do nothing;

-- ============================================================
-- 7. LINK YOUR FIRST USER TO THIS COMPANY
-- ============================================================
-- After you sign up via the app, run this query in the SQL editor
-- to assign yourself to the company as admin:
--
--   update profiles
--   set company_id = 'a1000000-0000-0000-0000-000000000001',
--       role = 'admin',
--       full_name = 'Your Name'
--   where id = auth.uid();
--
-- Or you can do it by replacing the UUID and running:
--
--   update profiles
--   set company_id = 'a1000000-0000-0000-0000-000000000001',
--       role = 'admin'
--   where id = 'PASTE-YOUR-USER-UUID-HERE';
-- ============================================================
