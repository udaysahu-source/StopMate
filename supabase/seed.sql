-- Supabase Seed Data for StopMate
-- Route: Saddu line (Saddu petrol pump -> Science centre -> Ashoka Ratan ->
-- Turning point shankar nagar -> Marine drive -> p.w.bridge -> Dronacharya -> SSIPMT College)

-- 1. Insert Route with Real Raipur Road Coordinates
insert into routes (id, name, path)
values (
  'a1111111-1111-1111-1111-111111111111',
  'Saddu line',
  '{
    "type": "LineString",
    "coordinates": [
      [81.7006, 21.2788],
      [81.6910, 21.2775],
      [81.6824, 21.2770],
      [81.6780, 21.2710],
      [81.6720, 21.2630],
      [81.6680, 21.2542],
      [81.6678, 21.2526],
      [81.6640, 21.2460],
      [81.6590, 21.2390],
      [81.6500, 21.2340],
      [81.6414, 21.2291],
      [81.6465, 21.2245],
      [81.6550, 21.2050],
      [81.6620, 21.1800],
      [81.6660, 21.1550],
      [81.6677, 21.1345]
    ]
  }'::jsonb
) on conflict (id) do nothing;

-- 2. Insert Bus '01'
insert into buses (id, code, name, route_id)
values (
  'b1111111-1111-1111-1111-111111111111',
  '01',
  'Saddu line',
  'a1111111-1111-1111-1111-111111111111'
) on conflict (code) do nothing;

-- 3. Insert The 8 Official Stops
insert into stops (route_id, name, short_name, seq, lat, lng, is_college)
values
  -- 1. Saddu petrol pump
  ('a1111111-1111-1111-1111-111111111111', 'Saddu petrol pump', 'Saddu', 1, 21.2788, 81.7006, false),
  -- 2. Science centre
  ('a1111111-1111-1111-1111-111111111111', 'Science centre', 'Science Ctr', 2, 21.2770, 81.6824, false),
  -- 3. Ashoka Ratan
  ('a1111111-1111-1111-1111-111111111111', 'Ashoka Ratan', 'Ashoka Ratan', 3, 21.2542, 81.6680, false),
  -- 4. Turning point shankar nagar
  ('a1111111-1111-1111-1111-111111111111', 'Turning point shankar nagar', 'Turning Pt', 4, 21.2526, 81.6678, false),
  -- 5. Marine drive
  ('a1111111-1111-1111-1111-111111111111', 'Marine drive', 'Marine Drive', 5, 21.2390, 81.6590, false),
  -- 6. p.w.bridge
  ('a1111111-1111-1111-1111-111111111111', 'p.w.bridge', 'PW Bridge', 6, 21.2291, 81.6414, false),
  -- 7. Dronacharya
  ('a1111111-1111-1111-1111-111111111111', 'Dronacharya', 'Dronacharya', 7, 21.2245, 81.6465, false),
  -- 8. SSIPMT College
  ('a1111111-1111-1111-1111-111111111111', 'SSIPMT College', 'College', 8, 21.1345, 81.6677, true)
on conflict (route_id, seq) do nothing;
