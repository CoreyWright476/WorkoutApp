import { niceTicks } from './scale'

test('ticks start at or below min and end at or above max', () => {
    const ticks = niceTicks(64.4, 122.4, 4)
    expect(ticks[0]).toBeLessThanOrEqual(64.4)
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(122.4)
    expect(niceTicks(0, 765, 3)).toEqual([0, 500, 1000])
})
