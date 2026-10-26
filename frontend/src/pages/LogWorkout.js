import React, { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { WorkoutForm } from '../components/WorkoutForm'

// /log, /log?plan=<id>&day=<dayId>, or navigated with state { exerciseId }
const LogWorkout = () => {
    const [params] = useSearchParams()
    const location = useLocation()
    const [plan, setPlan] = useState(null)
    const [error, setError] = useState(null)
    const planId = params.get('plan')
    const dayId = params.get('day')

    useEffect(() => {
        if (!planId) return
        api.getPlan(planId).then(setPlan).catch((e) => setError(e.message))
    }, [planId])

    const planDay = plan && plan.days.find((d) => d._id === dayId)

    return (
        <div className="page narrow-page">
            <h2>Log workout</h2>
            {error && <div className="error">{error}</div>}
            {planId && !plan && !error ? <p>Loading plan…</p> : (
                <WorkoutForm
                    plan={planDay ? plan : null}
                    planDay={planDay}
                    initialExerciseId={location.state && location.state.exerciseId}
                />
            )}
        </div>
    )
}

export default LogWorkout
