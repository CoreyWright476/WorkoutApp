// Pure metric helpers shared by the controllers. No database access here so
// everything can be unit tested in isolation.

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

// What we track for each metric type, and the weekly improvement we assume
// when there isn't enough history to fit a trend.
const METRIC_INFO = {
    weight_reps: { label: 'Estimated 1RM', unit: 'kg', assumedWeeklyRate: 0.01 },
    bodyweight_reps: { label: 'Best set', unit: 'reps', assumedWeeklyRate: 0.03 },
    time: { label: 'Longest hold', unit: 's', assumedWeeklyRate: 0.04 },
    distance_time: { label: 'Longest distance', unit: 'km', assumedWeeklyRate: 0.03 }
}

const round = (n, dp = 1) => {
    const f = 10 ** dp
    return Math.round(n * f) / f
}

// Epley formula. A single rep is the 1RM itself.
const estimate1RM = (load, reps) => {
    if (!load || !reps) return 0
    if (reps === 1) return load
    return load * (1 + reps / 30)
}

const setVolume = (set) => (set.load || 0) * (set.reps || 0)

// The single number used to measure performance for one set.
const setScore = (metricType, set) => {
    switch (metricType) {
        case 'weight_reps': return estimate1RM(set.load, set.reps)
        case 'bodyweight_reps': return set.reps || 0
        case 'time': return set.durationSec || 0
        case 'distance_time': return (set.distanceM || 0) / 1000
        default: return 0
    }
}

const bestScore = (metricType, sets) =>
    sets.reduce((best, set) => Math.max(best, setScore(metricType, set)), 0)

const summarizeSets = (sets) => sets.reduce((acc, set) => ({
    sets: acc.sets + 1,
    reps: acc.reps + (set.reps || 0),
    volume: acc.volume + setVolume(set),
    durationSec: acc.durationSec + (set.durationSec || 0),
    distanceM: acc.distanceM + (set.distanceM || 0)
}), { sets: 0, reps: 0, volume: 0, durationSec: 0, distanceM: 0 })

const summarizeWorkout = (workout) =>
    summarizeSets(workout.entries.flatMap((entry) => entry.sets))

const entryExerciseId = (entry) =>
    String(entry.exercise && entry.exercise._id ? entry.exercise._id : entry.exercise)

// One point per session for a given exercise: the best score that day plus
// session volume. Sorted oldest first.
const exerciseHistory = (workouts, exerciseId, metricType) => {
    const id = String(exerciseId)
    const points = []

    workouts.forEach((workout) => {
        const sets = workout.entries
            .filter((entry) => entryExerciseId(entry) === id)
            .flatMap((entry) => entry.sets)
        if (!sets.length) return

        const totals = summarizeSets(sets)
        points.push({
            workoutId: String(workout._id),
            date: new Date(workout.date).toISOString(),
            value: round(bestScore(metricType, sets), 2),
            volume: round(totals.volume, 1),
            sets: totals.sets,
            reps: totals.reps
        })
    })

    return points.sort((a, b) => new Date(a.date) - new Date(b.date))
}

// Ordinary least squares on (x, y). Returns slope, intercept and the
// standard error of the slope (null when it can't be computed).
const linearFit = (xs, ys) => {
    const n = xs.length
    const meanX = xs.reduce((a, b) => a + b, 0) / n
    const meanY = ys.reduce((a, b) => a + b, 0) / n
    let sxx = 0
    let sxy = 0
    for (let i = 0; i < n; i++) {
        sxx += (xs[i] - meanX) ** 2
        sxy += (xs[i] - meanX) * (ys[i] - meanY)
    }
    if (sxx === 0) return null

    const slope = sxy / sxx
    const intercept = meanY - slope * meanX
    let sse = 0
    for (let i = 0; i < n; i++) {
        sse += (ys[i] - (intercept + slope * xs[i])) ** 2
    }
    const slopeSE = n > 2 ? Math.sqrt(sse / (n - 2) / sxx) : null
    return { slope, intercept, slopeSE }
}

const MIN_POINTS_FOR_TREND = 3
const MIN_SPAN_DAYS_FOR_TREND = 7
const TREND_WINDOW_WEEKS = 12
const MAX_HORIZON_WEEKS = 104

// Projects when `target` will be reached from the session history.
//
// With at least 3 sessions spread over a week or more (within the last 12
// weeks) we fit a linear trend; otherwise, or if the trend is flat/negative,
// we fall back to a conservative assumed weekly improvement for the metric
// type. The early/late range comes from the slope's standard error, clamped
// to 0.5x-1.5x of the central slope so a noisy fit can't produce absurd dates.
const projectProgress = (history, metricType, options = {}) => {
    const info = METRIC_INFO[metricType] || METRIC_INFO.weight_reps
    const now = options.now ? new Date(options.now) : new Date()

    if (!history.length) {
        return { basis: 'none', metric: info, message: 'Log this exercise to see a projection' }
    }

    const last = history[history.length - 1]
    const lastDate = new Date(last.date)
    const windowStart = lastDate.getTime() - TREND_WINDOW_WEEKS * WEEK_MS
    const recent = history.filter((p) => new Date(p.date).getTime() >= windowStart)
    const xs = recent.map((p) => (new Date(p.date).getTime() - windowStart) / DAY_MS)
    const ys = recent.map((p) => p.value)
    const spanDays = xs.length ? xs[xs.length - 1] - xs[0] : 0

    let basis = 'assumed'
    let current = last.value
    let slopePerDay = (current * info.assumedWeeklyRate) / 7
    let earlySlope = slopePerDay * 1.5
    let lateSlope = slopePerDay * 0.5

    if (recent.length >= MIN_POINTS_FOR_TREND && spanDays >= MIN_SPAN_DAYS_FOR_TREND) {
        const fit = linearFit(xs, ys)
        if (fit && fit.slope > 0) {
            basis = 'trend'
            slopePerDay = fit.slope
            const lastX = xs[xs.length - 1]
            // Use the fitted value as "current" to smooth day-to-day noise,
            // but never report less than the best recent session.
            current = Math.max(fit.intercept + fit.slope * lastX, Math.max(...ys.slice(-3)) * 0.97)
            const se = fit.slopeSE || 0
            earlySlope = Math.min(fit.slope + se, fit.slope * 1.5)
            lateSlope = Math.max(fit.slope - se, fit.slope * 0.5)
        }
    }

    // Default target: 10% better than today.
    const target = options.target > 0 ? Number(options.target) : round(current * 1.1, 1)
    const horizonEnd = new Date(lastDate.getTime() + MAX_HORIZON_WEEKS * WEEK_MS)

    const dateFor = (value, slope) => {
        if (value <= current) return lastDate
        if (slope <= 0) return null
        const d = new Date(lastDate.getTime() + ((value - current) / slope) * DAY_MS)
        return d > horizonEnd ? null : d
    }
    const iso = (d) => (d ? d.toISOString() : null)

    const reached = last.value >= target
    const eta = reached ? lastDate : dateFor(target, slopePerDay)

    const milestones = [0.25, 0.5, 0.75, 1].map((fraction) => {
        const value = current + (target - current) * fraction
        return {
            label: fraction === 1 ? 'Target' : `${fraction * 100}% of the way`,
            value: round(value, 1),
            date: iso(reached ? lastDate : dateFor(value, slopePerDay))
        }
    })

    // Forecast a few weeks past the ETA (8-52 weeks), one point every 2 weeks.
    const etaWeeks = eta ? (eta - lastDate) / WEEK_MS : 24
    const horizonWeeks = Math.min(52, Math.max(8, Math.ceil((etaWeeks + 4) / 2) * 2))
    const forecastWeeks = Array.from({ length: horizonWeeks / 2 + 1 }, (_, i) => i * 2)
    const forecast = forecastWeeks.map((weeks) => ({
        date: new Date(lastDate.getTime() + weeks * WEEK_MS).toISOString(),
        value: round(current + slopePerDay * weeks * 7, 1),
        early: round(current + earlySlope * weeks * 7, 1),
        late: round(current + lateSlope * weeks * 7, 1)
    }))

    return {
        basis,
        metric: info,
        current: round(current, 1),
        best: round(Math.max(...history.map((p) => p.value)), 1),
        target: round(target, 1),
        weeklyChange: round(slopePerDay * 7, 2),
        reached,
        etaDate: iso(eta),
        etaRange: reached ? null : {
            early: iso(dateFor(target, earlySlope)),
            late: iso(dateFor(target, lateSlope))
        },
        weeksToTarget: eta ? round(Math.max(0, (eta - now) / WEEK_MS), 1) : null,
        milestones,
        forecast
    }
}

// Monday 00:00 UTC of the week containing `date`.
const startOfWeek = (date) => {
    const d = new Date(date)
    d.setUTCHours(0, 0, 0, 0)
    const day = (d.getUTCDay() + 6) % 7
    return new Date(d.getTime() - day * DAY_MS)
}

// Dashboard numbers: this week's totals, an N-week volume series and the
// number of consecutive weeks (ending this week or last) with a session.
const trainingSummary = (workouts, options = {}) => {
    const now = options.now ? new Date(options.now) : new Date()
    const weeks = options.weeks || 8
    const thisWeek = startOfWeek(now).getTime()

    const series = []
    for (let i = weeks - 1; i >= 0; i--) {
        series.push({ weekStart: new Date(thisWeek - i * WEEK_MS).toISOString(), sessions: 0, volume: 0, sets: 0 })
    }
    const firstWeek = new Date(series[0].weekStart).getTime()

    const activeWeeks = new Set()
    workouts.forEach((workout) => {
        const week = startOfWeek(workout.date).getTime()
        activeWeeks.add(week)
        if (week < firstWeek || week > thisWeek) return
        const bucket = series[Math.round((week - firstWeek) / WEEK_MS)]
        const totals = summarizeWorkout(workout)
        bucket.sessions += 1
        bucket.volume = round(bucket.volume + totals.volume, 1)
        bucket.sets += totals.sets
    })

    let streakWeeks = 0
    let cursor = activeWeeks.has(thisWeek) ? thisWeek : thisWeek - WEEK_MS
    while (activeWeeks.has(cursor)) {
        streakWeeks += 1
        cursor -= WEEK_MS
    }

    const current = series[series.length - 1]
    return {
        totalSessions: workouts.length,
        thisWeek: { sessions: current.sessions, volume: current.volume, sets: current.sets },
        streakWeeks,
        weekly: series
    }
}

module.exports = {
    METRIC_INFO,
    estimate1RM,
    setVolume,
    setScore,
    bestScore,
    summarizeSets,
    summarizeWorkout,
    exerciseHistory,
    linearFit,
    projectProgress,
    startOfWeek,
    trainingSummary
}
