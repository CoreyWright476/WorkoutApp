import React, { useState } from 'react'
import { useWidth } from '../hooks/useWidth'
import { linearScale, niceTicks } from '../utils/scale'
import { formatDate, formatShortDate } from '../utils/format'

const HEIGHT = 260
const M = { top: 16, right: 56, bottom: 28, left: 44 }

// Actual history (solid) plus the projected trend (dashed) with its
// early/late range as a light band, and the target as a reference line.
const ProgressChart = ({ history, projection }) => {
    const [ref, width] = useWidth()
    const [hover, setHover] = useState(null)

    if (!history.length) return null
    const unit = projection.metric.unit
    const forecast = projection.forecast || []

    const points = [
        ...history.map((p) => ({ t: new Date(p.date).getTime(), value: p.value, kind: 'actual', date: p.date })),
        ...forecast.slice(1).map((p) => ({ t: new Date(p.date).getTime(), value: p.value, early: p.early, late: p.late, kind: 'projected', date: p.date }))
    ]
    const allValues = [
        ...points.map((p) => p.value),
        ...forecast.flatMap((p) => [p.early, p.late]),
        projection.target || 0
    ]
    const minT = points[0].t
    const maxT = Math.max(...points.map((p) => p.t), minT + 1)
    const yTicks = niceTicks(Math.max(0, Math.min(...allValues) * 0.92), Math.max(...allValues) * 1.02, 4)
    const yMin = yTicks[0]
    const yMax = yTicks[yTicks.length - 1]

    const x = linearScale([minT, maxT], [M.left, width - M.right])
    const y = linearScale([yMin, yMax], [HEIGHT - M.bottom, M.top])
    const xTicks = niceTicks(minT, maxT, Math.max(2, Math.floor(width / 140))).filter((t) => t >= minT && t <= maxT)

    const path = (pts, key = 'value') =>
        pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p[key]).toFixed(1)}`).join('')

    const fc = forecast.map((p) => ({ t: new Date(p.date).getTime(), value: p.value, early: p.early, late: p.late }))
    const band = fc.length
        ? `${path(fc, 'early')}L${[...fc].reverse().map((p) => `${x(p.t).toFixed(1)},${y(p.late).toFixed(1)}`).join('L')}Z`
        : ''
    const actual = points.filter((p) => p.kind === 'actual')
    const last = actual[actual.length - 1]

    const onMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const px = e.clientX - rect.left
        let best = null
        points.forEach((p) => {
            const d = Math.abs(x(p.t) - px)
            if (!best || d < best.d) best = { d, p }
        })
        setHover(best && best.p)
    }

    const tooltipLeft = hover ? Math.min(Math.max(x(hover.t) + 12, 0), width - 180) : 0

    return (
        <figure className="chart" ref={ref}>
            <div className="chart-legend" aria-hidden="true">
                <span><i className="key key-actual" />Logged</span>
                {fc.length > 0 && <span><i className="key key-projected" />Projected (shaded: likely range)</span>}
                {projection.target && <span><i className="key key-target" />Target</span>}
            </div>
            <div className="chart-plot">
                <svg width={width} height={HEIGHT} role="img"
                    aria-label={`${projection.metric.label} over time with projection`}
                    onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
                    {yTicks.map((v) => (
                        <g key={v}>
                            <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} className="grid" />
                            <text x={M.left - 8} y={y(v)} className="tick" textAnchor="end" dominantBaseline="middle">{v}</text>
                        </g>
                    ))}
                    {xTicks.map((t) => (
                        <text key={t} x={x(t)} y={HEIGHT - 8} className="tick" textAnchor="middle">{formatShortDate(t)}</text>
                    ))}

                    {band && <path d={band} className="band" />}
                    {fc.length > 1 && <path d={path(fc)} className="line-projected" />}

                    {projection.target && (
                        <g>
                            <line x1={M.left} x2={width - M.right} y1={y(projection.target)} y2={y(projection.target)} className="target-line" />
                            <text x={width - M.right + 6} y={y(projection.target)} className="tick" dominantBaseline="middle">
                                {projection.target}{unit === 'kg' ? 'kg' : ''}
                            </text>
                        </g>
                    )}

                    <path d={path(actual)} className="line-actual" />
                    {actual.length <= 40 && actual.map((p) => (
                        <circle key={p.t} cx={x(p.t)} cy={y(p.value)} r="4" className="dot-actual" />
                    ))}
                    <text x={x(last.t)} y={y(last.value) - 12} className="end-label" textAnchor="middle">
                        {last.value}
                    </text>

                    {hover && (
                        <g>
                            <line x1={x(hover.t)} x2={x(hover.t)} y1={M.top} y2={HEIGHT - M.bottom} className="crosshair" />
                            <circle cx={x(hover.t)} cy={y(hover.value)} r="5"
                                className={hover.kind === 'actual' ? 'dot-actual' : 'dot-projected'} />
                        </g>
                    )}
                </svg>
                {hover && (
                    <div className="tooltip" style={{ left: tooltipLeft }}>
                        <div className="tooltip-date">{formatDate(hover.date)}</div>
                        <div className="tooltip-row">
                            <i className={hover.kind === 'actual' ? 'key key-actual' : 'key key-projected'} />
                            <strong>{hover.value} {unit}</strong>
                            <span>{hover.kind === 'actual' ? 'logged' : 'projected'}</span>
                        </div>
                        {hover.kind === 'projected' && hover.late !== hover.early && (
                            <div className="tooltip-sub">range {hover.late}–{hover.early} {unit}</div>
                        )}
                    </div>
                )}
            </div>
            <details className="table-view">
                <summary>View as table</summary>
                <table>
                    <thead><tr><th>Date</th><th>{projection.metric.label} ({unit})</th><th>Type</th></tr></thead>
                    <tbody>
                        {points.map((p) => (
                            <tr key={`${p.kind}${p.t}`}>
                                <td>{formatDate(p.date)}</td>
                                <td>{p.value}{p.kind === 'projected' ? ` (${p.late}–${p.early})` : ''}</td>
                                <td>{p.kind}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    )
}

export default ProgressChart
