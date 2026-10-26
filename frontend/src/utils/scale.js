export const linearScale = ([d0, d1], [r0, r1]) => {
    const span = d1 - d0 || 1
    return (v) => r0 + ((v - d0) / span) * (r1 - r0)
}

// ~`count` round tick values covering [min, max].
export const niceTicks = (min, max, count = 4) => {
    if (max <= min) return [min]
    const raw = (max - min) / count
    const mag = 10 ** Math.floor(Math.log10(raw))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)
    const ticks = []
    for (let v = Math.floor(min / step) * step; v <= max + step * 1e-9; v += step) {
        ticks.push(+v.toFixed(10))
    }
    // Always end on a tick at or above max so marks stay inside the axis.
    if (ticks[ticks.length - 1] < max) ticks.push(+(ticks[ticks.length - 1] + step).toFixed(10))
    return ticks
}
