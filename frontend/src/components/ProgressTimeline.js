import React from 'react'
import { formatDate } from '../utils/format'

const relative = (iso) => {
    if (!iso) return null
    const weeks = Math.round((new Date(iso) - Date.now()) / (7 * 24 * 3600 * 1000))
    if (weeks <= 0) return 'now'
    return weeks === 1 ? 'in ~1 week' : `in ~${weeks} weeks`
}

// Milestones on the way to the target, each with an estimated date.
const ProgressTimeline = ({ projection }) => {
    const unit = projection.metric.unit
    const basisText = projection.basis === 'trend'
        ? `Based on your trend over recent sessions (${projection.weeklyChange > 0 ? '+' : ''}${projection.weeklyChange} ${unit}/week).`
        : `Not enough history for a trend yet, so this assumes steady progress of about ${projection.weeklyChange} ${unit}/week. It will sharpen as you log more sessions.`

    return (
        <div className="timeline-card">
            <div className="timeline-summary">
                {projection.reached ? (
                    <p><strong>Target reached.</strong> Set a higher target to plan your next block.</p>
                ) : projection.etaDate ? (
                    <p>
                        Estimated to reach <strong>{projection.target} {unit}</strong> around{' '}
                        <strong>{formatDate(projection.etaDate)}</strong>
                        {projection.etaRange && projection.etaRange.early && projection.etaRange.late
                            && formatDate(projection.etaRange.early) !== formatDate(projection.etaRange.late) && (
                            <> (likely between {formatDate(projection.etaRange.early)} and {formatDate(projection.etaRange.late)})</>
                        )}.
                    </p>
                ) : (
                    <p>At the current rate, <strong>{projection.target} {unit}</strong> is more than two years away. Try a nearer target.</p>
                )}
                <p className="hint">{basisText}</p>
            </div>

            <ol className="timeline">
                <li className="timeline-item done">
                    <span className="timeline-dot" />
                    <div>
                        <strong>Now: {projection.current} {unit}</strong>
                        <span>Best logged: {projection.best} {unit}</span>
                    </div>
                </li>
                {projection.milestones.map((m) => (
                    <li key={m.label} className={projection.reached ? 'timeline-item done' : 'timeline-item'}>
                        <span className="timeline-dot" />
                        <div>
                            <strong>{m.label}: {m.value} {unit}</strong>
                            <span>{m.date ? `${formatDate(m.date)} · ${relative(m.date)}` : 'beyond 2 years'}</span>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    )
}

export default ProgressTimeline
