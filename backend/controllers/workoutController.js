const Workout = require('../models/workoutModel')
const Exercise = require('../models/exerciseModel')
const { isValidId, pick } = require('../utils/validation')
const { summarizeWorkout } = require('../utils/metrics')

const EDITABLE = ['title', 'date', 'plan', 'planDay', 'notes', 'entries']
const POPULATE = { path: 'entries.exercise', select: 'name metricType pattern muscleGroup' }

// Attach session totals (volume, sets, reps...) to the response.
const withSummary = (workout) => ({ ...workout.toObject(), summary: summarizeWorkout(workout) })

// Every entry must point at an existing exercise.
const checkEntries = async (entries) => {
    if (!Array.isArray(entries) || !entries.length) {
        return 'A workout needs at least one exercise'
    }
    const ids = entries.map((entry) => entry && entry.exercise)
    if (!ids.every(isValidId)) {
        return 'Unknown exercise'
    }
    const found = await Exercise.countDocuments({ _id: { $in: [...new Set(ids.map(String))] } })
    if (found !== new Set(ids.map(String)).size) {
        return 'Unknown exercise'
    }
    return null
}

// GET all workouts
const getWorkouts = async (req, res) => {
    const workouts = await Workout.find({}).sort({ date: -1, createdAt: -1 }).populate(POPULATE)
    res.status(200).json(workouts.map(withSummary))
}

// GET a single workout
const getWorkout = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such workout' })
    }

    const workout = await Workout.findById(id).populate(POPULATE)
    if (!workout) {
        return res.status(404).json({ error: 'No such workout' })
    }

    res.status(200).json(withSummary(workout))
}

// CREATE new workout
const createWorkout = async (req, res) => {
    const data = pick(req.body, EDITABLE)

    const entryError = await checkEntries(data.entries)
    if (entryError) {
        return res.status(400).json({ error: entryError })
    }

    try {
        const workout = await Workout.create(data)
        await workout.populate(POPULATE)
        res.status(200).json(withSummary(workout))
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// DELETE a workout
const deleteWorkout = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such workout' })
    }

    const workout = await Workout.findOneAndDelete({ _id: id })
    if (!workout) {
        return res.status(404).json({ error: 'No such workout' })
    }

    res.status(200).json(workout)
}

// UPDATE a workout
const updateWorkout = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such workout' })
    }

    const data = pick(req.body, EDITABLE)
    if (data.entries !== undefined) {
        const entryError = await checkEntries(data.entries)
        if (entryError) {
            return res.status(400).json({ error: entryError })
        }
    }

    try {
        const workout = await Workout.findOneAndUpdate({ _id: id }, data, {
            new: true,
            runValidators: true
        }).populate(POPULATE)
        if (!workout) {
            return res.status(404).json({ error: 'No such workout' })
        }
        res.status(200).json(withSummary(workout))
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

module.exports = {
    createWorkout,
    getWorkouts,
    getWorkout,
    deleteWorkout,
    updateWorkout
}
