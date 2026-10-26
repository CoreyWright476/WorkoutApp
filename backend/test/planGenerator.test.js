const test = require('node:test')
const assert = require('node:assert/strict')
const { generatePlan } = require('../utils/planGenerator')
const library = require('../data/exercises')

const exercises = library.map((ex, i) => ({ ...ex, _id: `id${i}` }))
const byId = Object.fromEntries(exercises.map((ex) => [ex._id, ex]))

test('generates one day per training day with the goal rep scheme', () => {
    const plan = generatePlan({ goal: 'strength', level: 'intermediate', daysPerWeek: 4 }, exercises)

    assert.equal(plan.days.length, 4)
    assert.equal(plan.name, 'Strength 4-Day Plan')
    const lifts = plan.days.flatMap((d) => d.exercises).filter((e) => e.reps)
    assert.ok(lifts.length > 0)
    lifts.forEach((e) => {
        assert.equal(e.sets, 5)
        assert.equal(e.reps, 5)
        assert.equal(e.restSec, 180)
    })
})

test('level adjusts sets and holds use durations', () => {
    const plan = generatePlan({ goal: 'hypertrophy', level: 'beginner', daysPerWeek: 2 }, exercises)
    const all = plan.days.flatMap((d) => d.exercises)

    all.filter((e) => e.reps).forEach((e) => assert.equal(e.sets, 3))
    const holds = all.filter((e) => byId[e.exercise].pattern === 'core_hold')
    assert.ok(holds.length > 0)
    holds.forEach((e) => {
        assert.equal(e.durationSec, 30)
        assert.equal(e.reps, undefined)
    })
})

test('no exercise repeats within a day and repeats rotate across days', () => {
    const plan = generatePlan({ daysPerWeek: 6 }, exercises)
    plan.days.forEach((day) => {
        const ids = day.exercises.map((e) => e.exercise)
        assert.equal(new Set(ids).size, ids.length)
    })
    const pushA = plan.days[0].exercises.map((e) => e.exercise)
    const pushB = plan.days[3].exercises.map((e) => e.exercise)
    assert.notDeepEqual(pushA, pushB)
})

test('bodyweight equipment only uses bodyweight-friendly exercises', () => {
    const plan = generatePlan({ equipment: 'bodyweight', daysPerWeek: 3 }, exercises)
    plan.days.flatMap((d) => d.exercises).forEach((e) => {
        assert.ok(['none', 'pull-up bar', 'jump rope'].includes(byId[e.exercise].equipment))
    })
})

test('clamps out-of-range inputs', () => {
    const plan = generatePlan({ daysPerWeek: 12, durationWeeks: 0, goal: 'nope', level: 'x' }, exercises)
    assert.equal(plan.days.length, 6)
    assert.equal(plan.durationWeeks, 8)
    assert.equal(plan.goal, 'general')
    assert.equal(plan.level, 'beginner')
})
