// Builds a training plan from the exercise library based on goal, level,
// training days per week and available equipment.

const SPLITS = {
    2: [
        { name: 'Full Body A', patterns: ['squat', 'horizontal_push', 'horizontal_pull', 'hinge', 'core_hold'] },
        { name: 'Full Body B', patterns: ['hinge', 'vertical_push', 'vertical_pull', 'lunge', 'core_hold'] }
    ],
    3: [
        { name: 'Full Body A', patterns: ['squat', 'horizontal_push', 'horizontal_pull', 'core_hold'] },
        { name: 'Full Body B', patterns: ['hinge', 'vertical_push', 'vertical_pull', 'curl'] },
        { name: 'Full Body C', patterns: ['lunge', 'horizontal_push', 'horizontal_pull', 'cardio'] }
    ],
    4: [
        { name: 'Upper A', patterns: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'curl'] },
        { name: 'Lower A', patterns: ['squat', 'hinge', 'lunge', 'core_hold'] },
        { name: 'Upper B', patterns: ['vertical_push', 'vertical_pull', 'horizontal_push', 'curl'] },
        { name: 'Lower B', patterns: ['hinge', 'squat', 'lunge', 'cardio'] }
    ],
    5: [
        { name: 'Push', patterns: ['horizontal_push', 'vertical_push', 'horizontal_push', 'core_hold'] },
        { name: 'Pull', patterns: ['vertical_pull', 'horizontal_pull', 'curl', 'curl'] },
        { name: 'Legs', patterns: ['squat', 'hinge', 'lunge', 'core_hold'] },
        { name: 'Upper', patterns: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull'] },
        { name: 'Lower + Conditioning', patterns: ['hinge', 'lunge', 'squat', 'cardio'] }
    ],
    6: [
        { name: 'Push A', patterns: ['horizontal_push', 'vertical_push', 'horizontal_push', 'core_hold'] },
        { name: 'Pull A', patterns: ['vertical_pull', 'horizontal_pull', 'curl'] },
        { name: 'Legs A', patterns: ['squat', 'hinge', 'lunge'] },
        { name: 'Push B', patterns: ['vertical_push', 'horizontal_push', 'vertical_push', 'core_hold'] },
        { name: 'Pull B', patterns: ['horizontal_pull', 'vertical_pull', 'curl'] },
        { name: 'Legs B', patterns: ['hinge', 'squat', 'lunge', 'cardio'] }
    ]
}

// Sets x reps and rest for each goal.
const SCHEMES = {
    strength: { sets: 5, reps: 5, restSec: 180 },
    hypertrophy: { sets: 4, reps: 10, restSec: 90 },
    endurance: { sets: 3, reps: 15, restSec: 45 },
    general: { sets: 3, reps: 10, restSec: 75 }
}

const LEVEL_SET_ADJUST = { beginner: -1, intermediate: 0, advanced: 1 }
const HOLD_SECONDS = { beginner: 30, intermediate: 45, advanced: 60 }
const CARDIO_SECONDS = { beginner: 600, intermediate: 900, advanced: 1200 }

const EQUIPMENT_SETS = {
    bodyweight: ['none', 'pull-up bar', 'jump rope'],
    dumbbells: ['none', 'pull-up bar', 'jump rope', 'dumbbell', 'kettlebell'],
    full_gym: null // anything
}

const generatePlan = (options, exercises) => {
    const goal = SCHEMES[options.goal] ? options.goal : 'general'
    const level = HOLD_SECONDS[options.level] ? options.level : 'beginner'
    const daysPerWeek = Math.min(6, Math.max(2, parseInt(options.daysPerWeek, 10) || 3))
    const durationWeeks = Math.min(52, Math.max(1, parseInt(options.durationWeeks, 10) || 8))
    const allowed = EQUIPMENT_SETS[options.equipment] || null

    const pool = exercises.filter((ex) => !allowed || allowed.includes(ex.equipment))
    const byPattern = {}
    pool.forEach((ex) => {
        (byPattern[ex.pattern] = byPattern[ex.pattern] || []).push(ex)
    })
    // Rotate through the options for a pattern so repeats get variety.
    const cursor = {}
    const pick = (pattern) => {
        const options = byPattern[pattern]
        if (!options || !options.length) return null
        const i = cursor[pattern] || 0
        cursor[pattern] = i + 1
        return options[i % options.length]
    }

    const scheme = SCHEMES[goal]
    const sets = Math.max(2, scheme.sets + LEVEL_SET_ADJUST[level])

    const days = SPLITS[daysPerWeek].map((template) => {
        const used = new Set()
        const planned = []
        template.patterns.forEach((pattern) => {
            const ex = pick(pattern)
            if (!ex || used.has(String(ex._id))) return
            used.add(String(ex._id))

            if (ex.metricType === 'time' || ex.metricType === 'distance_time') {
                const cardio = ex.pattern === 'cardio'
                planned.push({
                    exercise: ex._id,
                    sets: cardio ? 1 : Math.min(sets, 3),
                    durationSec: cardio ? CARDIO_SECONDS[level] : HOLD_SECONDS[level],
                    restSec: cardio ? 0 : 60
                })
            } else {
                planned.push({ exercise: ex._id, sets, reps: scheme.reps, restSec: scheme.restSec })
            }
        })
        return { name: template.name, exercises: planned }
    }).filter((day) => day.exercises.length)

    const goalName = goal.charAt(0).toUpperCase() + goal.slice(1)
    return {
        name: options.name || `${goalName} ${daysPerWeek}-Day Plan`,
        goal,
        level,
        durationWeeks,
        startDate: options.startDate || new Date(),
        days
    }
}

module.exports = { generatePlan, SPLITS, SCHEMES }
