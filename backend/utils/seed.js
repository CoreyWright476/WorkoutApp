const Exercise = require('../models/exerciseModel')
const Workout = require('../models/workoutModel')
const defaultExercises = require('../data/exercises')

// Insert any library exercises that are missing. Existing ones are left
// untouched so user edits (e.g. a custom demo video) are kept.
const seedExercises = async () => {
    const ops = defaultExercises.map((exercise) => ({
        updateOne: {
            filter: { name: exercise.name },
            update: { $setOnInsert: exercise },
            upsert: true
        }
    }))
    const result = await Exercise.bulkWrite(ops)
    return result.upsertedCount
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The first version of the app stored one flat { title, load, reps } document
// per workout. Convert those into the session/entries format, matching the
// title to a library exercise or creating a custom one.
const migrateLegacyWorkouts = async () => {
    const legacy = await Workout.collection.find({ entries: { $exists: false } }).toArray()

    for (const doc of legacy) {
        const name = (doc.title || 'Exercise').trim()
        let exercise = await Exercise.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
        if (!exercise) {
            exercise = await Exercise.create({ name, custom: true })
        }

        await Workout.collection.updateOne({ _id: doc._id }, {
            $set: {
                title: name,
                date: doc.createdAt || new Date(),
                notes: '',
                entries: [{ exercise: exercise._id, sets: [{ reps: doc.reps, load: doc.load }] }]
            },
            $unset: { reps: '', load: '' }
        })
    }
    return legacy.length
}

module.exports = { seedExercises, migrateLegacyWorkouts }
