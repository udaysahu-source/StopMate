# StopMate 🚌

> **Live Mobile College Bus Tracker for Raipur Students**
>
> Built for students commuting between Saddu, Shankar Nagar, and SSIPMT College in Raipur. Students get real-time GPS tracking and ETA calculations without logging in, while authenticated drivers broadcast coordinates with active wake-lock support.

---

## 🌟 Highlights

- **Mobile-First Experience**: Clean, ergonomic layout designed like modern transit apps (Rapido / Zomato).
- **Zero-Login for Students**: Open and immediately see live bus movement, ETA, speed, and stop timeline.
- **Accurate Route & Stops**: Curated 8-stop corridor in Raipur:
  1. `Saddu petrol pump`
  2. `Science centre`
  3. `Ashoka Ratan`
  4. `Turning point shankar nagar`
  5. `Marine drive`
  6. `p.w.bridge`
  7. `Dronacharya`
  8. `SSIPMT College` (destination)
- **MapLibre GL & OpenFreeMap**: Lightweight, vector map rendering with zero API key dependencies.
- **Pure ETA Calculation**: Snaps GPS fixes to the route polyline, applies smoothed speed with a 15 km/h floor, and accounts for 30s dwell per stop.
- **Secure Driver Console**: Requires approved driver role (`/driver`), includes Screen Wake Lock API to prevent phone sleep during trips, and features auto-arrival detection (<120m from college).
- **Admin Panel**: Minimal portal (`/admin`) for assigning buses, approving drivers, and ending active trips.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Figtree typography
- **Maps**: [MapLibre GL JS](https://maplibre.org/) + [OpenFreeMap](https://openfreemap.org/)
- **Database / Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, RPC Functions)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/udaysahu-source/StopMate.git
cd StopMate
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server only
```

### 3. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) on your mobile browser or toggle responsive mode in DevTools.

---

## 🔒 Security & Access Model

- **Students**: Anonymous read-only access to routes, stops, and active bus positions.
- **Drivers**: Authenticated users with `status = 'approved'` and an assigned bus. Can start trips, post GPS coordinates via secure endpoints, and end trips.
- **Server Enforcement**: All writes are validated server-side and executed through PostgreSQL `SECURITY DEFINER` functions (`start_trip`, `post_position`, `end_trip`).

---

## 📦 Database Migrations

SQL migrations and seed data are located in `supabase/`:
- `supabase/migrations/20261104000000_init.sql`: Tables, RLS policies, and RPC functions.
- `supabase/seed.sql`: Seed data containing Raipur Bus 01, stops, and route path coordinates.
- `tests/sql_access_test.sql`: Database access and permission tests.

---

## 🚢 Deployment (Vercel)

1. Import the repository `https://github.com/udaysahu-source/StopMate` on Vercel.
2. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Click **Deploy**.

---

## 📄 License

MIT © [Uday Sahu](https://github.com/udaysahu-source)
