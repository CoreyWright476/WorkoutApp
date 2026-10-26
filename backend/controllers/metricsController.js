const Workout = require('../models/workoutModel')
const Exercise = require('../models/exerciseModel')
const { isValidId } = require('../utils/validation')
const { exerciseHistory, projectProgress, trainingSummary } = require('../utils/metrics')

// GET dashboard summary: this week, streak and weekly volume
const getSummary = async (req, res) => {
    const workouts = await Workout.find({}, 'date entries')
    res.status(200).json(trainingSummary(workouts))
}

// GET history and progress projection for one exercise
// Optional query: ?target=<value in the exercise's metric unit>
const getExerciseProgress = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such exercise' })
    }

    const exercise = await Exercise.findById(id)
    if (!exercise) {
        return res.status(404).json({ error: 'No such exercise' })
    }

    const target = parseFloat(req.query.target)
    const workouts = await Workout.find({ 'entries.exercise': id }, 'date entries')
    const history = exerciseHistory(workouts, id, exercise.metricType)
    const projection = projectProgress(history, exercise.metricType, {
        target: Number.isFinite(target) ? target : undefined
    })

    res.status(200).json({ exercise, history, projection })
}

module.exports = { getSummary, getExerciseProgress }
