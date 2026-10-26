const Exercise = require('../models/exerciseModel')
const Workout = require('../models/workoutModel')
const Plan = require('../models/planModel')
const { isValidId, pick } = require('../utils/validation')

const EDITABLE = ['name', 'muscleGroup', 'equipment', 'metricType', 'pattern', 'instructions', 'demoUrl']

// GET all exercises
const getExercises = async (req, res) => {
    const exercises = await Exercise.find({}).sort({ name: 1 })
    res.status(200).json(exercises)
}

// GET a single exercise
const getExercise = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such exercise' })
    }

    const exercise = await Exercise.findById(id)
    if (!exercise) {
        return res.status(404).json({ error: 'No such exercise' })
    }

    res.status(200).json(exercise)
}

// CREATE a custom exercise
const createExercise = async (req, res) => {
    try {
        const exercise = await Exercise.create({ ...pick(req.body, EDITABLE), custom: true })
        res.status(200).json(exercise)
    } catch (error) {
        const message = error.code === 11000 ? 'An exercise with that name already exists' : error.message
        res.status(400).json({ error: message })
    }
}

// UPDATE an exercise (e.g. attach a demo video)
const updateExercise = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such exercise' })
    }

    try {
        const exercise = await Exercise.findByIdAndUpdate(id, pick(req.body, EDITABLE), {
            new: true,
            runValidators: true
        })
        if (!exercise) {
            return res.status(404).json({ error: 'No such exercise' })
        }
        res.status(200).json(exercise)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// DELETE a custom exercise that isn't used anywhere
const deleteExercise = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such exercise' })
    }

    const exercise = await Exercise.findById(id)
    if (!exercise) {
        return res.status(404).json({ error: 'No such exercise' })
    }
    if (!exercise.custom) {
        return res.status(400).json({ error: 'Built-in exercises cannot be deleted' })
    }

    const [inWorkouts, inPlans] = await Promise.all([
        Workout.exists({ 'entries.exercise': id }),
        Plan.exists({ 'days.exercises.exercise': id })
    ])
    if (inWorkouts || inPlans) {
        return res.status(400).json({ error: 'This exercise is used in a workout or plan' })
    }

    await exercise.deleteOne()
    res.status(200).json(exercise)
}

module.exports = {
    getExercises,
    getExercise,
    createExercise,
    updateExercise,
    deleteExercise
}
