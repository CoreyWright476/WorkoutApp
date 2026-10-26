// End-to-end API tests against an in-memory MongoDB. The MongoDB binary is
// downloaded on first run; if that isn't possible (offline CI, sandbox) the
// suite is skipped with the reason printed.
process.env.NODE_ENV = 'test'

const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const request = require('supertest')
const app = require('../app')
const Workout = require('../models/workoutModel')
const { seedExercises, migrateLegacyWorkouts } = require('../utils/seed')

let mongo
let skipReason = null

test.before(async () => {
    try {
        const { MongoMemoryServer } = require('mongodb-memory-server')
        mongo = await MongoMemoryServer.create()
        await mongoose.connect(mongo.getUri())
        await seedExercises()
    } catch (error) {
        skipReason = `in-memory MongoDB unavailable: ${error.message.split('\n')[0]}`
    }
})

test.after(async () => {
    await mongoose.disconnect()
    if (mongo) await mongo.stop()
})

const apiTest = (name, fn) => test(name, async (t) => {
    if (skipReason) return t.skip(skipReason)
    await fn()
})

const exerciseNamed = async (name) => {
    const res = await request(app).get('/api/exercises')
    return res.body.find((ex) => ex.name === name)
}

apiTest('seeds the exercise library once', async () => {
    const before = (await request(app).get('/api/exercises')).body.length
    assert.ok(before > 20)
    assert.equal(await seedExercises(), 0)
})

apiTest('creates a workout and returns it with a summary', async () => {
    const squat = await exerciseNamed('Back Squat')
    const res = await request(app).post('/api/workouts').send({
        title: 'Leg day',
        date: '2026-01-01',
        entries: [{ exercise: squat._id, sets: [{ load: 100, reps: 5 }, { load: 100, reps: 5 }] }]
    })
    assert.equal(res.status, 200)
    assert.equal(res.body.entries[0].exercise.name, 'Back Squat')
    assert.equal(res.body.summary.volume, 1000)
})

apiTest('rejects workouts with no entries or unknown exercises', async () => {
    let res = await request(app).post('/api/workouts').send({ title: 'Empty', entries: [] })
    assert.equal(res.status, 400)
    res = await request(app).post('/api/workouts').send({
        title: 'Bad', entries: [{ exercise: new mongoose.Types.ObjectId(), sets: [{ reps: 1 }] }]
    })
    assert.equal(res.status, 400)
})

apiTest('update returns the new document and validates', async () => {
    const pushup = await exerciseNamed('Push-up')
    const created = await request(app).post('/api/workouts').send({
        title: 'AM', entries: [{ exercise: pushup._id, sets: [{ reps: 10 }] }]
    })
    let res = await request(app).patch(`/api/workouts/${created.body._id}`).send({ title: 'Morning' })
    assert.equal(res.body.title, 'Morning')
    res = await request(app).patch(`/api/workouts/${created.body._id}`).send({ entries: [] })
    assert.equal(res.status, 400)
})

apiTest('progress endpoint returns history and projection', async () => {
    const bench = await exerciseNamed('Bench Press')
    for (let w = 0; w < 4; w++) {
        await request(app).post('/api/workouts').send({
            title: 'Push',
            date: new Date(Date.UTC(2026, 0, 1 + w * 7)),
            entries: [{ exercise: bench._id, sets: [{ load: 60 + w * 2.5, reps: 5 }] }]
        })
    }
    const res = await request(app).get(`/api/metrics/exercise/${bench._id}?target=90`)
    assert.equal(res.status, 200)
    assert.equal(res.body.history.length, 4)
    assert.equal(res.body.projection.basis, 'trend')
    assert.equal(res.body.projection.target, 90)
    assert.ok(res.body.projection.etaDate)
})

apiTest('summary endpoint reports totals', async () => {
    const res = await request(app).get('/api/metrics/summary')
    assert.equal(res.status, 200)
    assert.equal(res.body.weekly.length, 8)
    assert.ok(res.body.totalSessions >= 1)
})

apiTest('generates and saves a plan', async () => {
    const res = await request(app).post('/api/plans/generate').send({ goal: 'hypertrophy', daysPerWeek: 3 })
    assert.equal(res.status, 200)
    assert.equal(res.body.days.length, 3)
    assert.ok(res.body.days[0].exercises[0].exercise.name)
    const list = await request(app).get('/api/plans')
    assert.equal(list.body.length, 1)
})

apiTest('custom exercises can be created, but built-ins cannot be deleted', async () => {
    const created = await request(app).post('/api/exercises').send({ name: 'Sled Push', metricType: 'distance_time', pattern: 'cardio' })
    assert.equal(created.status, 200)
    const dupe = await request(app).post('/api/exercises').send({ name: 'Sled Push' })
    assert.equal(dupe.status, 400)
    const squat = await exerciseNamed('Back Squat')
    assert.equal((await request(app).delete(`/api/exercises/${squat._id}`)).status, 400)
    assert.equal((await request(app).delete(`/api/exercises/${created.body._id}`)).status, 200)
})

apiTest('migrates legacy flat workouts', async () => {
    await Workout.collection.insertOne({ title: 'bench press', load: 80, reps: 8, createdAt: new Date('2025-06-01') })
    await Workout.collection.insertOne({ title: 'Zercher Squat', load: 60, reps: 5, createdAt: new Date('2025-06-02') })
    assert.equal(await migrateLegacyWorkouts(), 2)

    const res = await request(app).get('/api/workouts')
    const bench = res.body.find((w) => w.title === 'bench press')
    assert.equal(bench.entries[0].exercise.name, 'Bench Press')
    assert.deepEqual(bench.entries[0].sets, [{ reps: 8, load: 80 }])
    const zercher = res.body.find((w) => w.title === 'Zercher Squat')
    assert.equal(zercher.entries[0].exercise.name, 'Zercher Squat')
    assert.equal(await migrateLegacyWorkouts(), 0)
})
