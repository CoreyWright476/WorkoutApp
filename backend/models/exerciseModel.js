const mongoose = require('mongoose')

const Schema = mongoose.Schema

// How an exercise is measured. Drives which set fields are shown/required
// and which metric is used for progress tracking.
const METRIC_TYPES = ['weight_reps', 'bodyweight_reps', 'time', 'distance_time']

// Movement patterns map to the built-in animated demonstration clips.
const MOVEMENT_PATTERNS = [
    'squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push',
    'horizontal_pull', 'vertical_pull', 'curl', 'core_hold', 'cardio'
]

const exerciseSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    muscleGroup: {
        type: String,
        default: 'full body'
    },
    equipment: {
        type: String,
        default: 'none'
    },
    metricType: {
        type: String,
        enum: METRIC_TYPES,
        default: 'weight_reps'
    },
    pattern: {
        type: String,
        enum: MOVEMENT_PATTERNS,
        default: 'squat'
    },
    instructions: {
        type: [String],
        default: []
    },
    // Optional link to a real video clip (YouTube URL or direct .mp4/.webm)
    demoUrl: {
        type: String,
        default: ''
    },
    custom: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('Exercise', exerciseSchema)
module.exports.METRIC_TYPES = METRIC_TYPES
module.exports.MOVEMENT_PATTERNS = MOVEMENT_PATTERNS
