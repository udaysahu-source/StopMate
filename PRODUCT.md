# Bus Tracker: Product Design

Version 0.1 · 4 Nov 2026. The visual style and tokens are in `AGENTS.md` and `design/reference.html`. This document covers how the product behaves: journeys, screens, states, wording and edge cases.

## 1. Principles

1. **One glance answer.** The student screen answers "how many minutes?" first and everything else second.
2. **Say what is true.** Never show an old position as if it were live. Offline, stopped and ended are different states with different words.
3. **The driver gets one button.** No settings, no menus while driving.
4. **Students never see driver controls.** Not disabled, not hidden behind a tab they can open. They are simply not there.
5. **Quiet by default.** Alerts happen only if the student turns them on.

## 2. Information architecture

```
/            Student: live bus, my stop, ETA, timeline, alert
/driver      Driver: sign in, then trip controls
/admin       Admin: drivers, buses, active trips
```

The student page does not link to `/driver`. Drivers get the link from the admin.

## 3. Journeys

### 3.1 Student, morning
1. Opens the saved link or the installed app.
2. Sees the map and "6 min" for the saved stop, and the arrival clock time.
3. Turns on "Alert me 5 min before" the first time, then leaves the page open.
4. A banner and a vibration say the bus is about 5 minutes away. Student walks to the stop.
5. Timeline shows "Here now" when the bus is at the stop.

### 3.2 Driver, a trip
1. Opens `/driver`, signs in once. The session persists.
2. Sees "Ready to start" and the large **Start trip** button.
3. Presses it. The phone asks for location permission the first time. A note says "Keep this screen on while driving."
4. Card turns green, "Trip live", with a timer. The button becomes **End trip**.
5. At the college the trip ends automatically. Card shows "Reached College". Location sharing is off.

### 3.3 Admin, onboarding a driver
1. Opens `/admin`, taps Add driver, enters name, email, a temporary password, picks the bus.
2. Driver appears as pending, admin taps Approve.
3. Admin sends the driver the link and the temporary password.
4. Driver signs in, is asked to change the password.

## 4. Screen states

### Student

| State | Trigger | Big text | Sub text | Map |
|---|---|---|---|---|
| Live, upcoming | Trip active, bus before my stop | "6 min" | "Arrives 8:42 AM at Shankar Nagar" | Bus moves, route ahead in blue |
| Arriving | Under 1 minute | "Arriving" | "Bus 01 is almost at your stop" | Same |
| At stop | Bus dwelling at my stop | "At your stop" | "Bus 01 is boarding at Shankar Nagar now" | Same |
| Passed | Bus already left my stop | "Passed your stop" | "Pick another stop or wait for the next trip" | Same |
| Offline | Last position older than 2 minutes | "Bus offline" | "Last seen 8:31 AM" | Marker greyed at last position |
| Not running | No active trip | "Bus stopped" | "No trip right now" | Bus hidden, route and stops shown |
| Finished | Trip ended by arrival | "Reached College" | "Bus 01 finished its trip" | Bus at college |
| Loading | First load | Skeleton card | | Map placeholder |
| No connection | Browser offline | "No connection" | "Showing the last update" | Last known |

### Driver

| State | What the driver sees | Button |
|---|---|---|
| Signed out | Sign in form | Sign in |
| Pending | "Your account is waiting for admin approval." | None |
| Removed | "This account was removed. Contact the admin." | None |
| Ready | "Ready to start", bus name | Start trip |
| Asking permission | Short explanation of why location is needed | Allow location |
| Permission denied | Steps to enable location in the browser | Try again |
| Live | "Trip live", timer, speed, next stop, minutes to college | End trip |
| Weak GPS | "GPS weak" pill turns orange | End trip |
| No connection | "No connection. Updates will resume." | End trip |
| Arrived | "Reached College. Sharing is off." | Start new trip |

## 5. Wording

Short, plain, no jargon. Examples:

- Alert switch: **Alert me 5 min before**, helper "In the app this is a phone notification."
- Denied sign in: **This number is not registered as a driver. Ask the admin to add you.** (Becomes email wording in v1.)
- Sign out blocked: **End your trip before signing out.**
- Offline: **Bus offline. Last seen 8:31 AM.**
- Prefer "bus" and "stop" over "vehicle" and "node". Times in 12 hour format with AM and PM, matching the prototype.

## 6. Alerts

- v1: while the page is open, show a banner and vibrate once when ETA to the chosen stop falls to 5 minutes or less. Fire once per trip per stop.
- The alert does not repeat if the ETA goes up and down. It resets when the student changes stop or a new trip starts.
- v2: Web Push so alerts arrive when the page is closed.

## 7. Edge cases

| Case | Behavior |
|---|---|
| Driver starts the trip from the middle of the route | Stops already passed show as passed. ETA uses the bus position on the route |
| Driver ends the trip early | Students see "Bus stopped". Position row is deleted |
| Driver's phone dies mid trip | After 2 minutes students see "Bus offline". After 10 minutes the server ends the trip with reason `timeout` |
| Two drivers try to start the same bus | Second attempt is rejected. Message: "This bus already has a trip running." |
| Student changes stop during a live trip | Timeline and ETA update immediately |
| Bus stuck in traffic | ETA grows. Show "Delayed" once the ETA is 5 or more minutes later than the first estimate for that stop |
| GPS jumps or an inaccurate fix | Ignore fixes with accuracy worse than 50 m, smooth the marker |
| Student opens the app at night | "Bus stopped. No trip right now." with the usual schedule if the admin set one (v2) |
| Driver account removed during a trip | Trip is ended by the server on the next update, driver sees "Removed" |

## 8. Privacy notes shown in the app

- Driver screen: "Your location is shared with students only while a trip is live."
- Student screen: "We do not collect your location."

## 9. Analytics (privacy light)

Count only, no personal data: page opens per day, trips started, trips completed, average update age, ETA error (predicted minus actual arrival per stop). These feed the success metrics in PRD.md.

## 10. Roadmap

| Version | Adds |
|---|---|
| v1 | Everything in PRD.md P0 and P1 |
| v1.1 | Trip reminders for drivers, simple schedule display |
| v2 | More routes and buses, Web Push, trip history for the admin |
| Later | Boarding check-ins, capacity, Capacitor app for background tracking |
