export const METRIC_TYPES = {
    weight_reps: { label: 'Weight & reps', fields: ['load', 'reps'] },
    bodyweight_reps: { label: 'Bodyweight reps', fields: ['reps'] },
    time: { label: 'Timed hold', fields: ['durationSec'] },
    distance_time: { label: 'Distance & time', fields: ['distanceM', 'durationSec'] }
}

export const FIELD_LABELS = {
    load: 'kg',
    reps: 'Reps',
    durationSec: 'Seconds',
    distanceM: 'Metres'
}

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
    value ? new Date(value).toLocaleDateString(undefined, options) : '—'

export const formatShortDate = (value) => formatDate(value, { day: 'numeric', month: 'short' })

export const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return m ? `${m}m${s ? ` ${s}s` : ''}` : `${s}s`
}

export const compactNumber = (n) => {
    if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`
    if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}K`
    return `${Math.round(n)}`
}

export const formatSet = (set, metricType) => {
    switch (metricType) {
        case 'bodyweight_reps': return `${set.reps || 0} reps`
        case 'time': return formatDuration(set.durationSec)
        case 'distance_time': {
            const km = ((set.distanceM || 0) / 1000).toFixed(2)
            return set.durationSec ? `${km} km in ${formatDuration(set.durationSec)}` : `${km} km`
        }
        default: return `${set.load || 0} kg × ${set.reps || 0}`
    }
}

// A <input type="date"> value for today in local time.
export const todayInput = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 10)
}
