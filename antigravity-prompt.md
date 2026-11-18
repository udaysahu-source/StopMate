# Antigravity prompt: College Bus Tracker

Paste everything below into Antigravity. Put `bus-tracker.html` in the project at `design/reference.html` first, so it can open it.

---

You are building **Bus Tracker**, a mobile-first web app (PWA) that shows college students where their college bus is, live. A registered driver starts and stops GPS sharing from their phone. Normal users can only watch.

Before writing any code, read `design/reference.html`. It is a working prototype of the exact UI and behavior I want. Match its look, layout, wording and states. The prototype uses fake data and a client-side demo login. Your job is to make it real.

First produce an implementation plan and wait for my OK. Then build phase by phase (see "Build order") and stop after each phase so I can test it on my Android phone.

## 1. Product

- v1 is for one college bus only: it starts at **Saddu**, passes **Shankar Nagar**, and ends at the **college** in Raipur. Other bus stops are unknown right now, so stops are data in the database, not hard-coded. Seed placeholder stops and tell me where to put the real coordinates.
- Later, after Shankar Nagar there will be several buses serving different stops. Design the schema so more routes and buses can be added without a rewrite, but do not build multi-route UI yet.
- Students: no sign in. Open the link, pick "My stop", see the live bus, ETA and stop timeline, optionally get an alert before the bus arrives.
- Drivers: sign in, press **Start trip**. Their phone shares GPS until they press **End trip** or the bus reaches the college, which ends the trip automatically.
- Admin (me for now): adds and approves drivers, assigns each driver to a bus, can end any trip.

## 2. Access rules (most important)

These must be enforced by the database and server, never only by hiding buttons.

| Role | Can | Cannot |
|---|---|---|
| Student (anyone, anonymous) | Read routes, stops, buses, and the live position of buses that have an active trip | Write anything. See any driver page data |
| Driver (signed in, status `approved`) | Start and end a trip on their own assigned bus. Post GPS positions for their own active trip | Control another bus. Create or approve drivers |
| Admin | Create, approve, remove drivers. Assign buses. End any trip | |

- Drivers with status `pending` or `removed` can sign in but get a clear screen saying their account is waiting for approval or was removed. They cannot start trips.
- `/driver` must show the sign-in form to anyone who is not an approved driver. `/admin` must be inaccessible to anyone who is not an admin.
- The Supabase service role key is used only in server code (route handlers or server actions). It must never reach the browser.
- Never trust a bus id, driver id or role sent from the client. Derive them from `auth.uid()` on the server.

## 3. Tech stack (all free tier, open source where possible)

- Next.js (App Router) with TypeScript, deployed on Vercel.
- Tailwind CSS. Font: Figtree via `next/font/google`.
- Supabase: Postgres, Auth, Realtime.
- Map: **MapLibre GL JS** with the free **OpenFreeMap** style (no API key). Use a light style that matches the prototype. Do not use Google Maps or Mapbox.
- PWA: web manifest, icons, installable on Android. A basic service worker is enough for v1.
- Keep dependencies small. No UI kit; build the components from the prototype.

## 4. Design system (copy from the prototype)

Light, friendly, rounded. Think Rapido or Zomato live tracking.

- Colors: background `#EEF1F5`, card `#FFFFFF`, ink `#111827`, secondary text `#566072`, line `#E3E7ED`, soft `#F5F7FA`. Brand yellow `#FFC400` (hover `#E6AE00`). Blue `#2563EB` for the route ahead and "your stop" (light `#E8EFFE`). Green `#12803D` on `#E4F5EA` for live and on time. Orange `#B8430A` on `#FFEADB` for warnings. Red `#C62828` for End trip.
- Phone-style cards with 28px radius. Bottom sheet with 24px top radius over the map. Pills fully rounded. Buttons 20px radius, Start trip is a large yellow button.
- Type: Figtree 400 to 800. The ETA number is 52px 800 weight. Labels are 12px uppercase with letter spacing.
- Map: light, with the traveled route in grey and the route ahead in blue. The bus is a yellow circle with a bus icon and a small dark arrow that rotates with the GPS heading. The user's stop is a blue dot with a pulsing halo and the label "Your stop". The map follows the bus smoothly.
- Student screen order: map, status pill (Live and speed), bus name and On time chip, big ETA with arrival clock time, My stop chips, "Alert me 5 min before" switch, stop timeline, "Updated N sec ago" line.
- Driver screen: sign in form, then Bus name, GPS strength pill, status card (Trip live with a timer), one big Start or End trip button, speed, next stop, minutes to college, route progress bar, sign out. Sign out is blocked while a trip is live.
- Respect `prefers-reduced-motion`, keep visible keyboard focus, and keep all tap targets at least 44px.

## 5. Data model (Supabase SQL migrations)

Create these in `supabase/migrations/`.

```sql
create type app_role as enum ('admin', 'driver');

create table routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path jsonb                            -- GeoJSON LineString of the real road path; used for the map line and ETA
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
```

Row Level Security, enabled on every table:
- `routes`, `stops`, `buses`: `select` for `anon` and `authenticated`. No other policies.
- `bus_positions`: `select` for `anon` and `authenticated`. **No insert, update or delete policies.**
- `trips`: `select` for `anon` and `authenticated`. No write policies.
- `profiles`: a user can `select` their own row. Admins can `select` and `update` all rows through an `is_admin()` security definer helper. No self-service role or status updates.

All writes to trips and positions go through three `security definer` functions with `set search_path = ''`. Revoke execute from `anon` and `public`, grant only to `authenticated`:
- `start_trip()`: requires the caller to be a profile with role `driver`, status `approved`, and an assigned `bus_id`. Fails if the bus already has an active trip. Inserts the trip and returns it.
- `post_position(lat, lng, heading, speed_kmh)`: requires an active trip started by `auth.uid()`. Validates the coordinates, upserts `bus_positions`, and ignores updates sent less than 2 seconds apart. If the position is within about 100 m of the stop with `is_college = true` and the trip is more than 3 minutes old, it ends the trip with reason `arrived`, deletes the `bus_positions` row, and returns `{ status: 'arrived' }`. Otherwise it returns `{ status: 'ok' }`.
- `end_trip()`: ends the caller's active trip with reason `driver` and deletes the position row.
- Admin end-trip is a server action that uses the service role after checking the admin session.

Enable Supabase Realtime on `bus_positions` and `trips`. Add a seed file with one route, one bus (`01`, "Saddu line"), and placeholder stops: Saddu, Shankar Nagar, college. Use obviously fake coordinates near Raipur and mark them `TODO: replace with real coordinates`.

## 6. Auth

- Students: none.
- Drivers and admin: Supabase Auth with **email and password** for v1, because phone OTP needs a paid SMS provider. The admin creates driver accounts from the admin page through a server route using the service role key, then sets the status to `approved`. Drivers can change their password after first login.
- Leave a clear note in the README on how to switch to phone OTP later.
- Add rate limiting or lockout on the driver sign in. Supabase Auth already limits attempts; show a friendly message when it triggers.

## 7. Live tracking behavior

Driver phone:
- On Start trip, ask for location permission with a clear explanation. If denied, show how to enable it and do not start the trip.
- Use `navigator.geolocation.watchPosition` with high accuracy. Send a position about every 5 seconds through `post_position`. Include heading and speed when the browser provides them.
- Request a **Screen Wake Lock** while the trip is live and show a note: "Keep this screen on while driving." A web page cannot track GPS reliably in the background, so state this limitation in the README and suggest wrapping the app with Capacitor later if drivers need background tracking.
- If the network drops, queue only the latest position and resend when back online. Show GPS strength and a "No connection" state.
- On `{ status: 'arrived' }` from the server, show "Reached College" and stop the GPS watch.

Student phone:
- Load routes, stops and the bus's active trip, then subscribe to Realtime changes on `bus_positions` and `trips`.
- If there is no active trip, show "Bus stopped" with the last known trip end time. If the last position is older than 2 minutes, show "Bus offline".
- ETA v1: snap the bus position to `routes.path`, take the remaining distance along the path to the chosen stop, and divide by a smoothed recent speed with a minimum speed floor so the number never explodes at red lights. Add a fixed 30 second dwell per stop. Keep the ETA function pure and unit tested so it can be improved later. The algorithm is in `docs/SYSTEM_DESIGN.md` section 6. Until a real path exists, seed a rough placeholder path through the placeholder stops and mark it `TODO: replace with the real road path` (record it from the first real trip, or generate it once with OpenRouteService or OSRM).
- "Alert me 5 min before": in v1 show an in-app banner and a vibration while the page is open. Do not build Web Push yet; leave a TODO and note it in the README.
- Remember the selected stop in `localStorage` with try/catch.
- Animate the bus marker smoothly between updates and rotate it by heading.

## 8. Routes and structure

```
app/
  page.tsx                 student screen
  driver/page.tsx          driver sign in and controls
  admin/page.tsx           drivers list, approve, assign bus, end trip
  api/admin/drivers/route.ts   create driver (service role, admin only)
components/                Map, BusMarker, EtaCard, StopChips, StopTimeline, AlertSwitch, TripButton, ...
lib/                       supabase clients (browser and server), eta.ts, geo.ts (haversine), types
supabase/migrations/       schema, RLS, functions
supabase/seed.sql
design/reference.html      the prototype (read only)
```

The admin page can be simple: a table of drivers with status, bus, approve and remove buttons, a form to add a driver, and a list of active trips with an End trip button. It uses the same design system.

## 9. Build order

Stop after each phase, tell me what to run, and wait.

1. **Project and design system:** Next.js, Tailwind, Figtree, the tokens above, and the static student and driver screens with fake data, matching the prototype. Deploys to Vercel.
2. **Supabase:** migrations, RLS, functions and seed. Include a short SQL test script that proves: an anonymous user cannot insert into `trips` or `bus_positions`, a student account cannot call `start_trip`, a pending driver cannot call `start_trip`, and one driver cannot post a position for another driver's bus.
3. **Auth and roles:** driver sign in, pending and removed screens, admin page, create and approve drivers.
4. **Driver trip flow:** Start and End trip, GPS watch, wake lock, auto-end near the college.
5. **Student live view:** Realtime subscription, MapLibre map, smooth bus marker, ETA, stop timeline, alert banner, offline states.
6. **PWA and polish:** manifest, icons, install prompt, empty and error states, accessibility pass.

## 10. Done means

- On my Android phone I can sign in as an approved driver, press Start trip, and a second phone (not signed in) sees the bus move within about 5 seconds.
- A second phone cannot reach any driver control. Calling the driver functions with an anonymous or student session fails.
- The trip ends by itself when the phone reaches the college stop.
- Everything is TypeScript with no `any` in app code, and `README.md` explains setup, env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), how to add real stop coordinates, how to create the first admin, and how to test on a phone.

## 11. Do not

- Do not store or expose the service role key in client code.
- Do not hide controls and call that security. Every rule above must also hold at the database level.
- Do not add features that are not listed (chat, payments, multiple routes UI, history screens). I will ask for them later.
- Do not invent bus stop locations. Use clearly marked placeholders.
