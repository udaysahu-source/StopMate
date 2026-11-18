# Bus Tracker: Product Requirements Document (PRD)

Version 0.1 · 4 Nov 2026 · Owner: Uday · Status: draft for review

Items marked **(assumption)** come from my reading of the project and should be confirmed with real riders.

## 1. Problem

College students who ride the college bus have no live way to know where it is. They wait at the stop without knowing if the bus has passed, is late, or is coming. **(assumption)** Today they ask friends or the driver by phone or message.

## 2. Goals

1. A student can open one link and see where the bus is and when it reaches their stop.
2. A registered driver can start and stop GPS sharing with one button, with no technical steps.
3. Only registered, approved drivers can control tracking. Nobody else can start, stop or fake a position.
4. Run at zero cost for one bus and a few hundred riders.

## 3. Non-goals for v1

- More than one route in the UI. The data model allows it, the screens do not.
- Chat, payments, ticketing, attendance, boarding scans, trip history, ratings.
- Native Android or iOS apps. v1 is a web app that can be installed as a PWA.
- Background tracking when the driver's screen is off.
- Push notifications. v1 alerts work only while the page is open.

## 4. Users

| User | Description | Main need |
|---|---|---|
| Student | Rides the college bus from Saddu or a stop after Shankar Nagar. Uses an Android phone. **(assumption)** | Know when to leave for the stop |
| Driver | Drives the bus. Not necessarily comfortable with apps. | Start and end sharing with minimum effort |
| Admin | Uday for now | Add and approve drivers, fix problems |

## 5. User stories

**Student**
- As a student, I open the link and immediately see the bus on a map and a clear "N min" for my stop.
- As a student, I pick my stop once and the app remembers it.
- As a student, I get an alert 5 minutes before the bus reaches my stop.
- As a student, I can tell the difference between "bus is late", "bus is offline" and "bus is not running".

**Driver**
- As a driver, I sign in once and press Start trip. Students can then see my bus.
- As a driver, my trip ends by itself when I reach the college, so I do not forget.
- As a driver, I cannot be impersonated. Nobody else can post my bus's location.

**Admin**
- As an admin, I add a driver, approve them and assign a bus.
- As an admin, I can remove a driver and end a trip that was left running.

## 6. Functional requirements

Priority: P0 must ship in v1, P1 should ship in v1, P2 later.

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Student screen is public and needs no sign in | P0 |
| FR-2 | Student sees the live bus position on a map, updated at least every 10 seconds while a trip is live | P0 |
| FR-3 | Student selects "My stop"; the choice is remembered on that device | P0 |
| FR-4 | Student sees ETA in minutes and arrival clock time for their stop | P0 |
| FR-5 | Student sees an ordered stop timeline with passed, next and here-now states | P0 |
| FR-6 | Student sees clear states: live, bus stopped, bus offline, trip ended, passed your stop | P0 |
| FR-7 | Student can turn on an in-app alert 5 minutes before arrival | P1 |
| FR-8 | Driver signs in with email and password | P0 |
| FR-9 | Only a driver with status `approved` and an assigned bus can start a trip | P0 |
| FR-10 | Driver starts and ends a trip with one large button | P0 |
| FR-11 | Driver's phone shares GPS about every 5 seconds during a trip only | P0 |
| FR-12 | The trip ends automatically near the college stop | P0 |
| FR-13 | Driver cannot sign out while a trip is live | P1 |
| FR-14 | Pending and removed drivers see a clear message and cannot start trips | P0 |
| FR-15 | Only one active trip per bus | P0 |
| FR-16 | Admin can create a driver, approve, remove, and assign a bus | P0 |
| FR-17 | Admin can end any active trip | P1 |
| FR-18 | App is installable as a PWA on Android | P1 |
| FR-19 | Web Push notifications | P2 |
| FR-20 | Multiple routes and buses in the UI | P2 |

## 7. Non-functional requirements

- **Security:** all access rules enforced in the database and server. No service key in the browser. See ARCHITECTURE.md.
- **Performance:** student screen shows content within 3 seconds on a mid-range Android phone on 4G. Position updates reach students within about 5 to 10 seconds of the driver's phone sending them.
- **Reliability:** if updates stop for 2 minutes, students see "Bus offline" instead of a stale position.
- **Privacy:** the driver's location is stored only during a trip, as one latest row, and deleted when the trip ends. No student location is collected.
- **Cost:** stays within free tiers for one bus and a few hundred viewers. See SYSTEM_DESIGN.md for the limits to watch.
- **Accessibility:** tap targets at least 44px, keyboard focus visible, text contrast at least WCAG AA, reduced motion respected.
- **Compatibility:** current Chrome on Android first. Safari on iPhone should work for students.

## 8. Success metrics (proposed targets, adjust after the first week)

| Metric | Target |
|---|---|
| Riders from the first bus who open the app in a week | 50% or more |
| ETA within 3 minutes of actual arrival | 80% of predictions |
| Trips where the driver started sharing | 90% of scheduled trips |
| Position updates older than 30 seconds during a live trip | under 5% of the time |
| Unauthorized trip or position writes that succeed | 0 |

## 9. Release plan

| Stage | Scope | Exit check |
|---|---|---|
| v0: own test | Uday's phone as the driver, a friend's phone as the student, one real trip | Bus moves live on the second phone |
| v1: friends on the bus | All P0 and P1 requirements, real driver account | A full week of real trips with feedback |
| v2: more buses | Multiple routes in the UI, Web Push, history | Decided after v1 feedback |

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Driver's phone screen turns off and GPS stops | Bus appears offline | Wake Lock, a clear "keep screen on" note, later a Capacitor wrapper |
| Driver forgets to start the trip | No tracking | Admin can start-reminder messages; consider a reminder in v2 |
| Inaccurate ETA at the start | Riders lose trust | Use road path, smoothed speed, show "about" wording, tune after real trips |
| Realtime limits on the free tier | Updates lag with many viewers | Throttle updates, polling fallback, see SYSTEM_DESIGN.md |
| Driver adoption | Product is useless without trips | Talk to the real driver early; keep the driver flow to one button |
| Phone GPS accuracy in dense areas | Jumpy marker | Ignore updates with poor accuracy, smooth the marker |

## 11. Open questions

1. Real coordinates and names for Saddu, Shankar Nagar, later stops and the college.
2. Is Uday the only admin?
3. Is a driver tied to one bus, or can drivers swap buses?
4. Will the driver agree to use their own phone? Is a spare phone or mount available?
5. What time do trips normally run, and is there an evening return trip?

## 12. Acceptance criteria

- **Given** an approved driver, **when** they press Start trip and allow location, **then** a student on another phone sees the bus move within 10 seconds.
- **Given** a signed-out visitor or a student, **when** they try to start a trip by any means, **then** the request is rejected by the server.
- **Given** a pending driver, **when** they sign in, **then** they see "waiting for approval" and no Start trip button.
- **Given** a live trip, **when** the bus reaches the college stop, **then** the trip ends automatically and the driver sees "Reached College".
- **Given** a live trip, **when** no position arrives for 2 minutes, **then** students see "Bus offline".
