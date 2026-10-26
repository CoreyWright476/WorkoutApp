import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useWorkoutsContext } from '../context/WorkoutsContext'
import { compactNumber } from '../utils/format'

//components
import WorkoutDetails from '../components/WorkoutDetails'
import VolumeChart from '../components/VolumeChart'

const StatTile = ({ label, value, sub }) => (
    <div className="stat-tile">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
    </div>
)

const Home = () => {
    const { workouts, error } = useWorkoutsContext()
    const [summary, setSummary] = useState(null)
    const [plans, setPlans] = useState([])

    // Re-fetch the summary whenever the workout list changes
    useEffect(() => {
        if (!workouts) return
        api.getSummary().then(setSummary).catch(() => setSummary(null))
    }, [workouts])

    useEffect(() => {
        api.getPlans().then(setPlans).catch(() => setPlans([]))
    }, [])

    // Next day of the most recent plan: rotate through its days in order.
    const plan = plans[0]
    let nextDay = null
    if (plan && workouts) {
        const done = workouts.filter((w) => w.plan === plan._id).length
        nextDay = plan.days[done % plan.days.length]
    }

  return (
    <div className="home">
        <div className='workouts'>
            {error && <div className="error">Couldn't reach the server: {error}</div>}
            {summary && (
                <>
                    <div className="stat-row">
                        <StatTile label="Sessions this week" value={summary.thisWeek.sessions} />
                        <StatTile label="Volume this week" value={`${compactNumber(summary.thisWeek.volume)} kg`} sub={`${summary.thisWeek.sets} sets`} />
                        <StatTile label="Weekly streak" value={summary.streakWeeks} sub={summary.streakWeeks === 1 ? 'week' : 'weeks'} />
                        <StatTile label="Total sessions" value={summary.totalSessions} />
                    </div>
                    <section className="card">
                        <h3>Weekly volume</h3>
                        <p className="muted">Total kg lifted (weight × reps) over the last 8 weeks</p>
                        <VolumeChart weeks={summary.weekly} />
                    </section>
                </>
            )}

            <h3>Recent workouts</h3>
            {workouts && !workouts.length && <p className="muted">No workouts yet. <Link to="/log">Log your first one</Link>.</p>}
            {workouts && workouts.slice(0, 20).map((workout) => (
                <WorkoutDetails key={workout._id} workout={workout} />
            ))}
        </div>
        <aside>
            <section className="card">
                <h3>Up next</h3>
                {nextDay ? (
                    <>
                        <p><strong>{nextDay.name}</strong> <span className="muted">from {plan.name}</span></p>
                        <ul className="plain-list">
                            {nextDay.exercises.filter((p) => p.exercise).map((p, i) => (
                                <li key={i}>{p.exercise.name} <span className="muted">{p.sets} × {p.reps || `${p.durationSec}s`}</span></li>
                            ))}
                        </ul>
                        <Link className="button" to={`/log?plan=${plan._id}&day=${nextDay._id}`}>Start workout</Link>
                    </>
                ) : (
                    <>
                        <p className="muted">No plan yet. Build one and your next session shows up here.</p>
                        <Link className="button" to="/plans">Create a plan</Link>
                    </>
                )}
            </section>
            <section className="card">
                <h3>Quick log</h3>
                <p className="muted">Log a session with the rep counter and demos.</p>
                <Link className="button secondary" to="/log">Log workout</Link>
            </section>
        </aside>
    </div>
  )
}

export default Home
