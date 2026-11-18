-- Supabase Migration: Bus Tracker (StopMate)
-- Schema, Row Level Security, and Security Definer Functions

create type app_role as enum ('admin', 'driver');

create table routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path jsonb -- GeoJSON LineString of the real road path
);

create table stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  name text not null,
  short_name text not null,
  seq int not null,
  lat double precision not null,
  lng double precision not null,
  is_college boolean not null default false,
  unique (route_id, seq)
);

create table buses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,            -- e.g. '01'
  name text not null,                   -- e.g. 'Saddu line'
  route_id uuid not null references routes(id)
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role app_role not null,
  status text not null default 'pending' check (status in ('pending','approved','removed')),
  bus_id uuid references buses(id),
  created_at timestamptz not null default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references buses(id),
  driver_id uuid not null references profiles(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('driver','arrived','admin','timeout'))
);

create unique index one_active_trip_per_bus on trips (bus_id) where ended_at is null;

-- one row per bus holding the latest position; deleted when the trip ends
create table bus_positions (
  bus_id uuid primary key references buses(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  heading real,
  speed_kmh real,
  updated_at timestamptz not null default now()
);

-- Row Level Security (RLS) on all tables
alter table routes enable row level security;
alter table stops enable row level security;
alter table buses enable row level security;
alter table profiles enable row level security;
alter table trips enable row level security;
alter table bus_positions enable row level security;

-- Helper to check if current user is admin
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- RLS Policies
-- routes, stops, buses: public read for all
create policy "Allow public read on routes" on routes for select using (true);
create policy "Allow public read on stops" on stops for select using (true);
create policy "Allow public read on buses" on buses for select using (true);

-- trips & bus_positions: public read only. NO direct insert/update/delete policies!
create policy "Allow public read on trips" on trips for select using (true);
create policy "Allow public read on bus_positions" on bus_positions for select using (true);

-- profiles: user can view own profile; admin can view and update all
create policy "Users can read own profile" on profiles
  for select using (id = auth.uid());

create policy "Admins can read all profiles" on profiles
  for select using (is_admin());

create policy "Admins can update profiles" on profiles
  for update using (is_admin());

-- Haversine distance helper function (meters)
create or replace function haversine_distance(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371000 * 2 * asin(
    sqrt(
      power(sin(radians((lat2 - lat1) / 2)), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians((lng2 - lng1) / 2)), 2)
    )
  );
$$;

-- Security Definer Functions
-- 1. start_trip(): Only approved driver assigned to bus can start trip
create or replace function start_trip()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver_id uuid;
  v_bus_id uuid;
  v_status text;
  v_trip_id uuid;
  v_started_at timestamptz;
begin
  v_driver_id := auth.uid();
  if v_driver_id is null then
    raise exception 'Authentication required';
  end if;

  -- Validate driver role, approval status, and assigned bus
  select bus_id, status into v_bus_id, v_status
  from public.profiles
  where id = v_driver_id and role = 'driver';

  if not found then
    raise exception 'User is not registered as a driver';
  end if;

  if v_status != 'approved' then
    raise exception 'Driver account is not approved';
  end if;

  if v_bus_id is null then
    raise exception 'No bus assigned to driver';
  end if;

  -- Assert no active trip exists for this bus
  if exists (
    select 1 from public.trips
    where bus_id = v_bus_id and ended_at is null
  ) then
    raise exception 'An active trip is already in progress for this bus';
  end if;

  -- Insert new trip
  insert into public.trips (bus_id, driver_id, started_at)
  values (v_bus_id, v_driver_id, now())
  returning id, started_at into v_trip_id, v_started_at;

  return jsonb_build_object(
    'trip_id', v_trip_id,
    'bus_id', v_bus_id,
    'started_at', v_started_at
  );
end;
$$;

-- 2. post_position(lat, lng, heading, speed_kmh): Updates position and checks auto-arrival
create or replace function post_position(
  lat double precision,
  lng double precision,
  heading real default null,
  speed_kmh real default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver_id uuid;
  v_bus_id uuid;
  v_trip_id uuid;
  v_started_at timestamptz;
  v_last_updated timestamptz;
  v_college_lat double precision;
  v_college_lng double precision;
  v_dist_to_college double precision;
begin
  v_driver_id := auth.uid();
  if v_driver_id is null then
    raise exception 'Authentication required';
  end if;

  -- Validate coordinates
  if lat < -90 or lat > 90 or lng < -180 or lng > 180 then
    raise exception 'Invalid GPS coordinates';
  end if;

  -- Find active trip started by this driver
  select id, bus_id, started_at into v_trip_id, v_bus_id, v_started_at
  from public.trips
  where driver_id = v_driver_id and ended_at is null;

  if not found then
    raise exception 'No active trip found for this driver';
  end if;

  -- Enforce 2-second rate limit to prevent spam
  select updated_at into v_last_updated
  from public.bus_positions
  where bus_id = v_bus_id;

  if v_last_updated is not null and now() - v_last_updated < interval '2 seconds' then
    return jsonb_build_object('status', 'ignored_rate_limit');
  end if;

  -- Upsert bus position
  insert into public.bus_positions (bus_id, trip_id, lat, lng, heading, speed_kmh, updated_at)
  values (v_bus_id, v_trip_id, lat, lng, heading, speed_kmh, now())
  on conflict (bus_id) do update set
    trip_id = excluded.trip_id,
    lat = excluded.lat,
    lng = excluded.lng,
    heading = excluded.heading,
    speed_kmh = excluded.speed_kmh,
    updated_at = excluded.updated_at;

  -- Auto-arrival check: if within ~100m of college and trip > 3 minutes old
  select s.lat, s.lng into v_college_lat, v_college_lng
  from public.stops s
  join public.buses b on b.route_id = s.route_id
  where b.id = v_bus_id and s.is_college = true
  limit 1;

  if v_college_lat is not null then
    v_dist_to_college := public.haversine_distance(lat, lng, v_college_lat, v_college_lng);

    if v_dist_to_college <= 100 and (now() - v_started_at) > interval '3 minutes' then
      -- End trip automatically
      update public.trips
      set ended_at = now(), end_reason = 'arrived'
      where id = v_trip_id;

      -- Remove latest position
      delete from public.bus_positions where bus_id = v_bus_id;

      return jsonb_build_object('status', 'arrived');
    end if;
  end if;

  return jsonb_build_object('status', 'ok');
end;
$$;

-- 3. end_trip(): Manually closes driver's active trip
create or replace function end_trip()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver_id uuid;
  v_trip_id uuid;
  v_bus_id uuid;
  v_ended_at timestamptz;
begin
  v_driver_id := auth.uid();
  if v_driver_id is null then
    raise exception 'Authentication required';
  end if;

  select id, bus_id into v_trip_id, v_bus_id
  from public.trips
  where driver_id = v_driver_id and ended_at is null;

  if not found then
    raise exception 'No active trip found to end';
  end if;

  v_ended_at := now();

  update public.trips
  set ended_at = v_ended_at, end_reason = 'driver'
  where id = v_trip_id;

  delete from public.bus_positions where bus_id = v_bus_id;

  return jsonb_build_object(
    'trip_id', v_trip_id,
    'ended_at', v_ended_at,
    'end_reason', 'driver'
  );
end;
$$;

-- Restrict function execution: revoke from anon/public, grant only to authenticated
revoke execute on function start_trip from public, anon;
grant execute on function start_trip to authenticated;

revoke execute on function post_position from public, anon;
grant execute on function post_position to authenticated;

revoke execute on function end_trip from public, anon;
grant execute on function end_trip to authenticated;
