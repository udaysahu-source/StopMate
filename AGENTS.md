# Bus Tracker: project context

Read this file at the start of every session. It is the short, always-true summary of the project. The full build brief is in `docs/antigravity-prompt.md`, and the UI to match is `design/reference.html`.

## What this is

A mobile-first PWA that shows college students where their college bus is, live. A registered driver starts and stops GPS sharing from their phone. Everyone else can only watch.

- Owner: Uday, second-year B.Tech CSE student, SSIPMT, Raipur. Built first for himself and his friends, then scaled if people like it.
- v1 scope: **one bus only**. It starts at Saddu, passes Shankar Nagar, and ends at the college. After Shankar Nagar there will later be several buses serving different stops, but those stop locations are not known yet.
- Data collection and testing for now uses only Uday's own bus. Testing is on an Android phone.

## Roles and access rules

Enforced in the database and on the server. Hiding a button is not security.

- **Student** (anyone, no sign in): read routes, stops, buses and the live position of buses with an active trip. Nothing else.
- **Driver** (signed in, status `approved`, assigned to a bus): start and end a trip on their own bus, post GPS positions for their own active trip.
- **Admin** (Uday for now): create, approve and remove drivers, assign buses, end any trip.
- Pending or removed drivers see a clear message and cannot start trips.
- Derive user, role and bus from `auth.uid()` on the server. Never trust ids or roles sent by the client.
- The Supabase service role key lives only in server code.

## Stack

Next.js (App Router, TypeScript), Tailwind, Figtree font, Supabase (Postgres, Auth, Realtime), MapLibre GL JS with OpenFreeMap (no API key), Vercel. Free tier and open source where possible. No UI kit, no Google Maps, no Mapbox.

## Design

Light, friendly, rounded, like Rapido or Zomato live tracking. Match `design/reference.html`.

- Colors: bg `#EEF1F5`, card `#FFFFFF`, ink `#111827`, secondary `#566072`, line `#E3E7ED`, soft `#F5F7FA`, yellow `#FFC400` (hover `#E6AE00`), blue `#2563EB` (light `#E8EFFE`), green `#12803D` on `#E4F5EA`, orange `#B8430A` on `#FFEADB`, red `#C62828`.
- Radii: cards 28px, bottom sheet 24px top corners, buttons 20px, pills fully rounded.
- Type: Figtree 400 to 800. ETA number is 52px at 800 weight. Labels are 12px uppercase with letter spacing.
- Map: traveled route grey, route ahead blue, bus is a yellow circle with a rotating heading arrow, the user's stop is a blue dot with a halo labelled "Your stop".
- Tap targets at least 44px, visible keyboard focus, respect `prefers-reduced-motion`.

## Key behavior

- Driver phone sends GPS about every 5 seconds through the `post_position` database function. Screen Wake Lock is on during a trip. Web pages cannot track reliably in the background, so the driver keeps the screen on.
- The server ends a trip automatically when a position is within about 100 m of the college stop and the trip is more than 3 minutes old.
- Students see "Bus offline" if the last position is older than 2 minutes, and "Bus stopped" when there is no active trip.
- ETA v1 snaps the bus to the route's road path (`routes.path`), then divides the remaining distance by a smoothed speed with a floor, plus a fixed dwell per stop. Keep the ETA function pure and unit tested. Details in `docs/SYSTEM_DESIGN.md`.
- Docs for this project live in `docs/`: PRD.md, PRODUCT.md, ARCHITECTURE.md, SYSTEM_DESIGN.md, antigravity-prompt.md.
- "Alert me 5 min before" is an in-app banner and vibration while the page is open. Web Push is later.

## Data model (summary)

`routes` (with a `path` GeoJSON line), `stops` (ordered, one flagged `is_college`), `buses`, `profiles` (role, status, bus), `trips` (one active per bus), `bus_positions` (one latest row per bus, deleted when the trip ends). RLS is on everywhere. Writes to trips and positions go only through the security definer functions `start_trip`, `post_position` and `end_trip`. Full SQL is in `docs/antigravity-prompt.md`.

## Conventions

- TypeScript strict, no `any` in app code.
- Server code uses the server Supabase client. Browser code uses the anon key only.
- Keep components small and named after the screen parts: `Map`, `BusMarker`, `EtaCard`, `StopChips`, `StopTimeline`, `AlertSwitch`, `TripButton`.
- Wrap `localStorage` access in try/catch.
- Do not add features that are not requested (chat, payments, multi-route UI, history). Ask first.
- Do not invent stop locations. Placeholders must be marked `TODO: replace with real coordinates`.

## Environment variables

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only). Never commit `.env.local`.

## Build phases and status

Update the status column as you finish each phase.

| # | Phase | Status |
|---|---|---|
| 1 | Project, design system, static student and driver screens | done |
| 2 | Supabase migrations, RLS, functions, seed, SQL access tests | done |
| 3 | Auth and roles, admin page, create and approve drivers | in progress |
| 4 | Driver trip flow: start, end, GPS, wake lock, auto-end | in progress |
| 5 | Student live view: Realtime, map, ETA, timeline, offline states | in progress |
| 6 | PWA and polish | not started |

## Decisions made

- Light and friendly UI. The first dark terminal-style design was rejected.
- Student screen and driver screen first. The admin screen stays minimal.
- Drivers use email and password in v1, because phone codes need a paid SMS provider.
- Only registered, approved drivers can start or stop GPS. Normal users cannot reach any driver control.

## Open questions

- Real coordinates for Saddu, Shankar Nagar, the other stops and the college.
- Is the admin only Uday for now?
- Is a driver tied to exactly one bus, or can one driver cover another bus?
- Do drivers need background tracking? If yes, wrap the app with Capacitor later.
