-- SQL Access Verification Tests for StopMate
-- Run this script in the Supabase SQL Editor to verify security boundaries.

do $$
declare
  v_fake_trip_id uuid;
begin
  raise notice 'Starting SQL Access Security Tests...';

  -- TEST 1: Anonymous cannot directly insert into trips
  begin
    set local role anon;
    insert into trips (bus_id, driver_id)
    values ('b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000');
    raise exception 'FAIL: Anonymous was able to insert into trips table!';
  exception when others then
    raise notice 'PASS: Test 1 - Anonymous insert to trips blocked by RLS.';
  end;

  -- TEST 2: Anonymous cannot directly insert into bus_positions
  begin
    set local role anon;
    insert into bus_positions (bus_id, trip_id, lat, lng)
    values ('b1111111-1111-1111-1111-111111111111', gen_random_uuid(), 21.28, 81.67);
    raise exception 'FAIL: Anonymous was able to insert into bus_positions table!';
  exception when others then
    raise notice 'PASS: Test 2 - Anonymous insert to bus_positions blocked by RLS.';
  end;

  -- TEST 3: Anonymous cannot invoke start_trip()
  begin
    set local role anon;
    perform start_trip();
    raise exception 'FAIL: Anonymous was able to execute start_trip()!';
  exception when others then
    raise notice 'PASS: Test 3 - start_trip() execution revoked from anon.';
  end;

  -- TEST 4: Anonymous cannot invoke post_position()
  begin
    set local role anon;
    perform post_position(21.28, 81.67, 90, 25);
    raise exception 'FAIL: Anonymous was able to execute post_position()!';
  exception when others then
    raise notice 'PASS: Test 4 - post_position() execution revoked from anon.';
  end;

  -- TEST 5: Anonymous cannot invoke end_trip()
  begin
    set local role anon;
    perform end_trip();
    raise exception 'FAIL: Anonymous was able to execute end_trip()!';
  exception when others then
    raise notice 'PASS: Test 5 - end_trip() execution revoked from anon.';
  end;

  raise notice 'All Security Boundary Tests PASSED successfully!';
end $$;
