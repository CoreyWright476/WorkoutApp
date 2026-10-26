import React, { useState } from 'react'
import { useWidth } from '../hooks/useWidth'
import { linearScale, niceTicks } from '../utils/scale'
import { compactNumber, formatShortDate } from '../utils/format'

const HEIGHT = 200
const M = { top: 20, right: 12, bottom: 28, left: 40 }

// Weekly training volume (kg lifted) as columns, one per week.
const VolumeChart = ({ weeks }) => {
    const [ref, width] = useWidth()
    const [hover, setHover] = useState(null)

    const max = Math.max(...weeks.map((w) => w.volume), 1)
    const ticks = niceTicks(0, max, 3)
    const y = linearScale([0, ticks[ticks.length - 1] || max], [HEIGHT - M.bottom, M.top])
    const slot = (width - M.left - M.right) / weeks.length
    const barW = Math.min(24, slot * 0.6)
    const r = 4
    // Label every Nth week so labels never collide; the last week is always labelled.
    const labelEvery = Math.ceil(weeks.length / Math.max(2, Math.floor(width / 70)))

    const column = (cx, top) => {
        const base = HEIGHT - M.bottom
        const h = base - top
        if (h <= 0) return ''
        const rr = Math.min(r, h, barW / 2)
        const l = cx - barW / 2
        const rt = cx + barW / 2
        return `M${l},${base}V${top + rr}Q${l},${top} ${l + rr},${top}H${rt - rr}Q${rt},${top} ${rt},${top + rr}V${base}Z`
    }

    return (
        <figure className="chart" ref={ref}>
            <div className="chart-plot">
                <svg width={width} height={HEIGHT} role="img" aria-label="Weekly training volume">
                    {ticks.map((v) => (
                        <g key={v}>
                            <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} className="grid" />
                            <text x={M.left - 8} y={y(v)} className="tick" textAnchor="end" dominantBaseline="middle">{compactNumber(v)}</text>
                        </g>
                    ))}
                    {weeks.map((w, i) => {
                        const cx = M.left + slot * (i + 0.5)
                        const isLast = i === weeks.length - 1
                        return (
                            <g key={w.weekStart}
                                tabIndex={0}
                                onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}
                                onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                                <rect x={cx - slot / 2} y={M.top} width={slot} height={HEIGHT - M.top - M.bottom} fill="transparent" />
                                <path d={column(cx, y(w.volume))} className={hover === i ? 'bar hover' : 'bar'} />
                                {(isLast || (i % labelEvery === 0 && weeks.length - 1 - i >= labelEvery)) && (
                                    <text x={cx} y={HEIGHT - 8} className="tick" textAnchor="middle">
                                        {isLast ? 'This wk' : formatShortDate(w.weekStart)}
                                    </text>
                                )}
                                {isLast && w.volume > 0 && (
                                    <text x={cx} y={y(w.volume) - 6} className="end-label" textAnchor="middle">{compactNumber(w.volume)}</text>
                                )}
                            </g>
                        )
                    })}
                </svg>
                {hover !== null && (
                    <div className="tooltip" style={{ left: Math.min(M.left + slot * (hover + 0.5) + 12, width - 160) }}>
                        <div className="tooltip-date">Week of {formatShortDate(weeks[hover].weekStart)}</div>
                        <div className="tooltip-row"><strong>{compactNumber(weeks[hover].volume)} kg</strong><span>volume</span></div>
                        <div className="tooltip-sub">{weeks[hover].sessions} sessions · {weeks[hover].sets} sets</div>
                    </div>
                )}
            </div>
            <details className="table-view">
                <summary>View as table</summary>
                <table>
                    <thead><tr><th>Week of</th><th>Volume (kg)</th><th>Sessions</th><th>Sets</th></tr></thead>
                    <tbody>
                        {weeks.map((w) => (
                            <tr key={w.weekStart}><td>{formatShortDate(w.weekStart)}</td><td>{w.volume}</td><td>{w.sessions}</td><td>{w.sets}</td></tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    )
}

export default VolumeChart
