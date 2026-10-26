const mongoose = require('mongoose')

const Schema = mongoose.Schema

const setSchema = new Schema({
    reps: { type: Number, min: 0 },
    load: { type: Number, min: 0 },         // kg
    durationSec: { type: Number, min: 0 },
    distanceM: { type: Number, min: 0 },
    rpe: { type: Number, min: 1, max: 10 }
}, { _id: false })

const entrySchema = new Schema({
    exercise: {
        type: Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
    },
    sets: {
        type: [setSchema],
        validate: {
            validator: (sets) => sets.length > 0,
            message: 'Each exercise needs at least one set'
        }
    }
}, { _id: false })

// A workout is one training session made up of one or more exercises.
const workoutSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    plan: {
        type: Schema.Types.ObjectId,
        ref: 'Plan'
    },
    planDay: {
        type: String
    },
    notes: {
        type: String,
        default: ''
    },
    entries: {
        type: [entrySchema],
        validate: {
            validator: (entries) => entries.length > 0,
            message: 'A workout needs at least one exercise'
        }
    }
}, { timestamps: true })

module.exports = mongoose.model('Workout', workoutSchema)
