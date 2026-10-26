import { createRepDetector } from './repDetector'

// Simulate `reps` oscillations of a given amplitude around 9.81 m/s² at 50Hz.
const simulate = (detector, { reps, periodMs = 1500, amplitude = 4, noise = 0 }) => {
    const step = 20
    let counted = 0
    for (let t = 0; t <= reps * periodMs; t += step) {
        const jitter = noise ? (Math.sin(t * 1.7) * noise) : 0
        const value = 9.81 - amplitude * Math.sin((2 * Math.PI * t) / periodMs) + jitter
        if (detector.push(value, t)) counted += 1
    }
    return counted
}

test('counts one rep per oscillation', () => {
    const detector = createRepDetector()
    expect(simulate(detector, { reps: 10 })).toBe(10)
    expect(detector.reps).toBe(10)
})

test('ignores small movements below the threshold', () => {
    expect(simulate(createRepDetector(), { reps: 10, amplitude: 0.5 })).toBe(0)
})

test('high-frequency noise does not double count', () => {
    expect(simulate(createRepDetector(), { reps: 8, amplitude: 4, noise: 1 })).toBe(8)
})

test('reset clears the count', () => {
    const detector = createRepDetector()
    simulate(detector, { reps: 3 })
    detector.reset()
    expect(detector.reps).toBe(0)
})
