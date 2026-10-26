# WorkoutApp

A MERN workout tracker that records sessions by metric, builds training plans,
shows exercise demonstrations, counts reps, and estimates when you'll hit your goals.

## Features

- **Metric-based tracking.** Each exercise is measured by its own metric type:
  weight × reps (progress = estimated 1RM, Epley), bodyweight reps (best set),
  timed holds (longest hold) or distance (longest distance). The dashboard shows
  sessions, volume and sets this week, a weekly streak, and an 8-week volume chart.
- **Workout plans.** Generate a plan from goal (strength / muscle growth /
  endurance / general), experience, equipment and 2–6 days per week, or build
  one day by day. Start any plan day to open a pre-filled workout log with
  the planned sets, reps and rest.
- **Demonstration clips.** Every exercise has an animated stick-figure demo of
  its movement pattern, plus step-by-step cues. You can attach your own clip
  (YouTube link or .mp4/.webm URL) from the exercise page, and there's a
  "Find video clips" link for each exercise.
- **Rep counter.** Count by tapping the dial or pressing Space (↓ removes a rep).
  It also has a tempo metronome and optional automatic counting from phone motion
  (accelerometer). Logging a set fills the next empty set and starts a rest timer.
- **Progress estimate timeline.** For each exercise: a chart of your history plus
  a projected trend with a likely range, and a timeline of milestones (25/50/75/100%
  of the way to your target) with estimated dates. With 3+ sessions over at least a
  week, the projection fits a linear trend to the last 12 weeks; otherwise it assumes
  a conservative weekly improvement and says so.

## Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB
   connection string and port (the frontend proxies to port 4000).
2. Start the API:
   ```
   cd backend
   npm install
   npm run dev
   ```
   On first start the exercise library is seeded, and any workouts saved in the
   old `{ title, load, reps }` format are migrated to the new session format.
3. Start the frontend in another terminal:
   ```
   cd frontend
   npm install
   npm start
   ```

## Tests

- `cd backend && npm test`: unit tests for the metrics, projection and plan
  generator, plus API tests against an in-memory MongoDB (`mongodb-memory-server`
  downloads a MongoDB binary on first run; the API tests are skipped if it can't).
- `cd frontend && npm test`: rep detection and chart scale tests.

## API

| Method | Path | |
|---|---|---|
| GET/POST | `/api/workouts` | list / create sessions (`entries: [{ exercise, sets: [{ reps, load, durationSec, distanceM }] }]`) |
| GET/PATCH/DELETE | `/api/workouts/:id` | |
| GET/POST | `/api/exercises` | library / create custom exercise |
| GET/PATCH/DELETE | `/api/exercises/:id` | PATCH `demoUrl` to attach a video; only unused custom exercises can be deleted |
| GET/POST | `/api/plans` | list / create a hand-built plan |
| POST | `/api/plans/generate` | `{ goal, level, daysPerWeek, durationWeeks, equipment }` |
| GET/PATCH/DELETE | `/api/plans/:id` | |
| GET | `/api/metrics/summary` | weekly totals and streak |
| GET | `/api/metrics/exercise/:id?target=` | history and progress projection |
