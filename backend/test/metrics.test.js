const test = require('node:test')
const assert = require('node:assert/strict')
const {
    estimate1RM,
    exerciseHistory,
    linearFit,
    projectProgress,
    startOfWeek,
    trainingSummary
} = require('../utils/metrics')

const DAY = 24 * 60 * 60 * 1000
const EX = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const OTHER = 'bbbbbbbbbbbbbbbbbbbbbbbb'

const workout = (id, date, entries) => ({ _id: id, date, entries })

test('estimate1RM uses Epley and treats a single as the 1RM', () => {
    assert.equal(estimate1RM(100, 1), 100)
    assert.equal(estimate1RM(100, 10), 100 * (1 + 10 / 30))
    assert.equal(estimate1RM(0, 5), 0)
})

test('exerciseHistory keeps one best point per session for that exercise only', () => {
    const workouts = [
        workout('w2', '2026-01-08', [{ exercise: EX, sets: [{ load: 100, reps: 5 }, { load: 105, reps: 3 }] }]),
        workout('w1', '2026-01-01', [
            { exercise: { _id: EX }, sets: [{ load: 90, reps: 5 }] },
            { exercise: OTHER, sets: [{ load: 500, reps: 5 }] }
        ]),
        workout('w3', '2026-01-10', [{ exercise: OTHER, sets: [{ load: 20, reps: 5 }] }])
    ]
    const history = exerciseHistory(workouts, EX, 'weight_reps')

    assert.deepEqual(history.map((p) => p.workoutId), ['w1', 'w2'])
    assert.equal(history[0].value, 105)       // 90 * (1 + 5/30)
    assert.equal(history[1].value, 116.67)    // max(116.67, 115.5)
    assert.equal(history[1].volume, 815)
})

test('exerciseHistory scores bodyweight, time and distance exercises', () => {
    const w = [workout('w', '2026-01-01', [{ exercise: EX, sets: [
        { reps: 8, durationSec: 30, distanceM: 2500 },
        { reps: 12, durationSec: 45, distanceM: 1000 }
    ] }])]
    assert.equal(exerciseHistory(w, EX, 'bodyweight_reps')[0].value, 12)
    assert.equal(exerciseHistory(w, EX, 'time')[0].value, 45)
    assert.equal(exerciseHistory(w, EX, 'distance_time')[0].value, 2.5)
})

test('linearFit recovers an exact line', () => {
    const fit = linearFit([0, 1, 2, 3], [10, 12, 14, 16])
    assert.equal(fit.slope, 2)
    assert.equal(fit.intercept, 10)
    assert.equal(fit.slopeSE, 0)
    assert.equal(linearFit([1, 1], [2, 3]), null)
})

test('projectProgress fits a trend and dates the target', () => {
    // +1 kg e1RM per week for 6 weeks
    const start = new Date('2026-01-01T00:00:00Z').getTime()
    const history = [0, 1, 2, 3, 4, 5].map((w) => ({
        date: new Date(start + w * 7 * DAY).toISOString(),
        value: 100 + w
    }))
    const p = projectProgress(history, 'weight_reps', { target: 115, now: history[5].date })

    assert.equal(p.basis, 'trend')
    assert.equal(p.current, 105)
    assert.equal(p.weeklyChange, 1)
    assert.equal(p.weeksToTarget, 10)
    assert.equal(p.etaDate, new Date(start + 15 * 7 * DAY).toISOString())
    assert.equal(p.milestones.length, 4)
    assert.equal(p.milestones[3].value, 115)
    assert.equal(p.reached, false)
    // forecast runs ~4 weeks past the 10-week ETA, every 2 weeks
    assert.equal(p.forecast.length, 8)
    assert.equal(p.forecast[7].value, 119)
    // perfect fit -> no uncertainty
    assert.equal(p.etaRange.early, p.etaDate)
})

test('projectProgress falls back to an assumed rate with little data', () => {
    const history = [{ date: '2026-01-01T00:00:00.000Z', value: 100 }]
    const p = projectProgress(history, 'weight_reps', { now: '2026-01-01T00:00:00.000Z' })

    assert.equal(p.basis, 'assumed')
    assert.equal(p.target, 110)          // default +10%
    assert.equal(p.weeklyChange, 1)      // 1% of 100 per week
    assert.equal(p.weeksToTarget, 10)
    assert.ok(new Date(p.etaRange.early) < new Date(p.etaDate))
    assert.ok(new Date(p.etaRange.late) > new Date(p.etaDate))
})

test('projectProgress falls back when the trend is going down', () => {
    const history = [110, 105, 100].map((v, i) => ({
        date: new Date(Date.UTC(2026, 0, 1 + i * 7)).toISOString(), value: v
    }))
    assert.equal(projectProgress(history, 'weight_reps').basis, 'assumed')
})

test('projectProgress reports a target that is already reached', () => {
    const history = [{ date: '2026-01-01T00:00:00.000Z', value: 120 }]
    const p = projectProgress(history, 'weight_reps', { target: 100 })
    assert.equal(p.reached, true)
    assert.equal(p.etaRange, null)
})

test('projectProgress gives no date for targets beyond two years', () => {
    const history = [{ date: '2026-01-01T00:00:00.000Z', value: 100 }]
    const p = projectProgress(history, 'weight_reps', { target: 1000 })
    assert.equal(p.etaDate, null)
})

test('projectProgress handles no history', () => {
    assert.equal(projectProgress([], 'time').basis, 'none')
})

test('startOfWeek returns Monday 00:00 UTC', () => {
    assert.equal(startOfWeek('2026-10-25T15:00:00Z').toISOString(), '2026-10-19T00:00:00.000Z') // Sunday
    assert.equal(startOfWeek('2026-10-26T01:00:00Z').toISOString(), '2026-10-26T00:00:00.000Z') // Monday
})

test('trainingSummary buckets weeks and counts the streak', () => {
    const now = '2026-10-28T12:00:00Z' // Wednesday
    const set = (load, reps) => ({ exercise: EX, sets: [{ load, reps }] })
    const workouts = [
        workout('a', '2026-10-27', [set(100, 5)]),
        workout('b', '2026-10-26', [set(50, 10)]),
        workout('c', '2026-10-20', [set(10, 10)]),
        workout('d', '2026-10-06', [set(10, 10)]) // gap week of 13th breaks the streak
    ]
    const s = trainingSummary(workouts, { now, weeks: 4 })

    assert.equal(s.weekly.length, 4)
    assert.equal(s.thisWeek.sessions, 2)
    assert.equal(s.thisWeek.volume, 1000)
    assert.equal(s.streakWeeks, 2)
    assert.deepEqual(s.weekly.map((w) => w.sessions), [1, 0, 1, 2])
})

test('trainingSummary streak still counts when this week has no session yet', () => {
    const s = trainingSummary(
        [workout('a', '2026-10-20', [{ exercise: EX, sets: [{ reps: 5 }] }])],
        { now: '2026-10-27T00:00:00Z' }
    )
    assert.equal(s.streakWeeks, 1)
    assert.equal(s.thisWeek.sessions, 0)
})
