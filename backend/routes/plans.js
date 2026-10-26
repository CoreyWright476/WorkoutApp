const express = require('express')

const {
    getPlans,
    getPlan,
    createPlan,
    generate,
    updatePlan,
    deletePlan
} = require('../controllers/planController')

const router = express.Router()

router.get('/', getPlans)
router.get('/:id', getPlan)
router.post('/', createPlan)
router.post('/generate', generate)
router.patch('/:id', updatePlan)
router.delete('/:id', deletePlan)

module.exports = router
