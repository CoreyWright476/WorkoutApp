const express = require('express')

const { getSummary, getExerciseProgress } = require('../controllers/metricsController')

const router = express.Router()

router.get('/summary', getSummary)
router.get('/exercise/:id', getExerciseProgress)

module.exports = router
