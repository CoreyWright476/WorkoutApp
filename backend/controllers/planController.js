const Plan = require('../models/planModel')
const Exercise = require('../models/exerciseModel')
const { isValidId, pick } = require('../utils/validation')
const { generatePlan } = require('../utils/planGenerator')

const EDITABLE = ['name', 'goal', 'level', 'durationWeeks', 'startDate', 'days']
const POPULATE = { path: 'days.exercises.exercise', select: 'name metricType pattern muscleGroup equipment' }

// GET all plans
const getPlans = async (req, res) => {
    const plans = await Plan.find({}).sort({ createdAt: -1 }).populate(POPULATE)
    res.status(200).json(plans)
}

// GET a single plan
const getPlan = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such plan' })
    }

    const plan = await Plan.findById(id).populate(POPULATE)
    if (!plan) {
        return res.status(404).json({ error: 'No such plan' })
    }

    res.status(200).json(plan)
}

// CREATE a plan from a hand-built definition
const createPlan = async (req, res) => {
    try {
        const plan = await Plan.create(pick(req.body, EDITABLE))
        await plan.populate(POPULATE)
        res.status(200).json(plan)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// GENERATE (and save) a plan from goal / level / days per week / equipment
const generate = async (req, res) => {
    const exercises = await Exercise.find({})
    const definition = generatePlan(req.body, exercises)

    if (!definition.days.length) {
        return res.status(400).json({ error: 'No exercises match the selected equipment' })
    }

    try {
        const plan = await Plan.create(definition)
        await plan.populate(POPULATE)
        res.status(200).json(plan)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// UPDATE a plan
const updatePlan = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such plan' })
    }

    try {
        const plan = await Plan.findByIdAndUpdate(id, pick(req.body, EDITABLE), {
            new: true,
            runValidators: true
        }).populate(POPULATE)
        if (!plan) {
            return res.status(404).json({ error: 'No such plan' })
        }
        res.status(200).json(plan)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// DELETE a plan
const deletePlan = async (req, res) => {
    const { id } = req.params
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'No such plan' })
    }

    const plan = await Plan.findByIdAndDelete(id)
    if (!plan) {
        return res.status(404).json({ error: 'No such plan' })
    }

    res.status(200).json(plan)
}

module.exports = {
    getPlans,
    getPlan,
    createPlan,
    generate,
    updatePlan,
    deletePlan
}
