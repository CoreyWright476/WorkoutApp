// Counts reps from a stream of accelerometer magnitudes (m/s², gravity
// included). Each rep produces one oscillation; we count a rep each time the
// smoothed signal rises above `baseline + threshold` after having dropped
// below `baseline - threshold` (hysteresis), with a minimum gap between reps
// so jitter at the peak doesn't double-count.
export const createRepDetector = ({
    threshold = 1.2,
    minRepMs = 600,
    smoothing = 0.25,
    baselineRate = 0.02
} = {}) => {
    let smoothed = null
    let baseline = null
    let armed = false
    let lastRepAt = -Infinity
    let reps = 0

    return {
        // Feed one sample; returns true when a rep is counted.
        push(magnitude, timeMs) {
            if (smoothed === null) {
                smoothed = magnitude
                baseline = magnitude
                return false
            }
            smoothed += smoothing * (magnitude - smoothed)
            baseline += baselineRate * (smoothed - baseline)

            if (smoothed < baseline - threshold) {
                armed = true
            } else if (armed && smoothed > baseline + threshold && timeMs - lastRepAt >= minRepMs) {
                armed = false
                lastRepAt = timeMs
                reps += 1
                return true
            }
            return false
        },
        get reps() {
            return reps
        },
        reset() {
            smoothed = null
            baseline = null
            armed = false
            lastRepAt = -Infinity
            reps = 0
        }
    }
}
