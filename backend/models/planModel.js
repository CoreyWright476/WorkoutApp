const mongoose = require('mongoose')

const Schema = mongoose.Schema

const GOALS = ['strength', 'hypertrophy', 'endurance', 'general']
const LEVELS = ['beginner', 'intermediate', 'advanced']

const plannedExerciseSchema = new Schema({
    exercise: {
        type: Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
    },
    sets: { type: Number, min: 1, default: 3 },
    reps: { type: Number, min: 1 },
    durationSec: { type: Number, min: 1 },
    targetLoad: { type: Number, min: 0 },
    restSec: { type: Number, min: 0, default: 90 }
}, { _id: false })

const planDaySchema = new Schema({
    name: { type: String, required: true },
    exercises: {
        type: [plannedExerciseSchema],
        default: []
    }
})

const planSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    goal: {
        type: String,
        enum: GOALS,
        default: 'general'
    },
    level: {
        type: String,
        enum: LEVELS,
        default: 'beginner'
    },
    durationWeeks: {
        type: Number,
        min: 1,
        max: 52,
        default: 8
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    days: {
        type: [planDaySchema],
        validate: {
            validator: (days) => days.length > 0,
            message: 'A plan needs at least one training day'
        }
    }
}, { timestamps: true })

module.exports = mongoose.model('Plan', planSchema)
module.exports.GOALS = GOALS
module.exports.LEVELS = LEVELS
