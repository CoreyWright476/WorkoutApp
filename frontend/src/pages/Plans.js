import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useWorkoutsContext } from '../context/WorkoutsContext'
import ExercisePicker from '../components/ExercisePicker'
import { formatDate } from '../utils/format'

const GOALS = { strength: 'Strength', hypertrophy: 'Muscle growth', endurance: 'Endurance', general: 'General fitness' }
const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
const EQUIPMENT = { full_gym: 'Full gym', dumbbells: 'Dumbbells & kettlebells', bodyweight: 'Bodyweight only' }

const currentWeek = (plan) => {
    const weeks = Math.floor((Date.now() - new Date(plan.startDate)) / (7 * 24 * 3600 * 1000)) + 1
    return Math.max(1, weeks)
}

const GeneratorForm = ({ onCreated }) => {
    const [form, setForm] = useState({ goal: 'hypertrophy', level: 'beginner', daysPerWeek: 3, durationWeeks: 8, equipment: 'full_gym' })
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        try {
            onCreated(await api.generatePlan(form))
            setError(null)
        } catch (err) {
            setError(err.message)
        }
        setBusy(false)
    }

    return (
        <form className="create card" onSubmit={submit}>
            <h3>Generate a plan</h3>
            <p className="muted">Pick a goal and schedule and we'll build a split from the exercise library.</p>
            <label>Goal
                <select value={form.goal} onChange={set('goal')}>
                    {Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </label>
            <label>Experience
                <select value={form.level} onChange={set('level')}>
                    {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </label>
            <label>Equipment
                <select value={form.equipment} onChange={set('equipment')}>
                    {Object.entries(EQUIPMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </label>
            <div className="form-row">
                <label>Days / week
                    <select value={form.daysPerWeek} onChange={set('daysPerWeek')}>
                        {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                </label>
                <label>Weeks
                    <input type="number" min="1" max="52" value={form.durationWeeks} onChange={set('durationWeeks')} />
                </label>
            </div>
            <button disabled={busy}>{busy ? 'Building…' : 'Generate plan'}</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}

const emptyItem = () => ({ exercise: '', sets: 3, reps: 10, durationSec: 30, restSec: 90 })

const BuilderForm = ({ onCreated }) => {
    const { exercises } = useWorkoutsContext()
    const [name, setName] = useState('')
    const [goal, setGoal] = useState('general')
    const [durationWeeks, setDurationWeeks] = useState(8)
    const [days, setDays] = useState([{ name: 'Day 1', exercises: [emptyItem()] }])
    const [error, setError] = useState(null)

    if (!exercises) return null
    const byId = Object.fromEntries(exercises.map((ex) => [ex._id, ex]))
    const timed = (id) => byId[id] && ['time', 'distance_time'].includes(byId[id].metricType)

    const updateDay = (i, fn) => setDays(days.map((d, j) => j === i ? fn(d) : d))
    const updateItem = (i, k, field, value) => updateDay(i, (d) => ({
        ...d, exercises: d.exercises.map((x, j) => j === k ? { ...x, [field]: value } : x)
    }))

    const submit = async (e) => {
        e.preventDefault()
        const payload = days.map((d) => ({
            name: d.name.trim() || 'Day',
            exercises: d.exercises.filter((x) => x.exercise).map((x) => ({
                exercise: x.exercise,
                sets: Number(x.sets) || 1,
                restSec: Number(x.restSec) || 0,
                ...(timed(x.exercise) ? { durationSec: Number(x.durationSec) || 30 } : { reps: Number(x.reps) || 1 })
            }))
        })).filter((d) => d.exercises.length)
        if (!payload.length) return setError('Add at least one exercise')
        try {
            onCreated(await api.createPlan({ name: name.trim() || 'My plan', goal, durationWeeks: Number(durationWeeks) || 8, days: payload }))
            setError(null)
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <form className="create card" onSubmit={submit}>
            <h3>Build your own</h3>
            <label>Plan name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer strength" /></label>
            <div className="form-row">
                <label>Goal
                    <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                        {Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </label>
                <label>Weeks<input type="number" min="1" max="52" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} /></label>
            </div>

            {days.map((day, i) => (
                <fieldset key={i} className="day-builder">
                    <legend>
                        <input value={day.name} aria-label={`Day ${i + 1} name`} onChange={(e) => updateDay(i, (d) => ({ ...d, name: e.target.value }))} />
                    </legend>
                    {day.exercises.map((item, k) => (
                        <div key={k} className="builder-row">
                            <ExercisePicker exercises={exercises} value={item.exercise} onChange={(v) => updateItem(i, k, 'exercise', v)} />
                            <label>Sets<input type="number" min="1" value={item.sets} onChange={(e) => updateItem(i, k, 'sets', e.target.value)} /></label>
                            {timed(item.exercise)
                                ? <label>Secs<input type="number" min="1" value={item.durationSec} onChange={(e) => updateItem(i, k, 'durationSec', e.target.value)} /></label>
                                : <label>Reps<input type="number" min="1" value={item.reps} onChange={(e) => updateItem(i, k, 'reps', e.target.value)} /></label>}
                            <label>Rest<input type="number" min="0" value={item.restSec} onChange={(e) => updateItem(i, k, 'restSec', e.target.value)} /></label>
                        </div>
                    ))}
                    <button type="button" className="link-button" onClick={() => updateDay(i, (d) => ({ ...d, exercises: [...d.exercises, emptyItem()] }))}>+ Exercise</button>
                    {days.length > 1 && (
                        <button type="button" className="link-button danger" onClick={() => setDays(days.filter((_, j) => j !== i))}>Remove day</button>
                    )}
                </fieldset>
            ))}
            <button type="button" className="link-button" onClick={() => setDays([...days, { name: `Day ${days.length + 1}`, exercises: [emptyItem()] }])}>+ Add day</button>
            <button>Save plan</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}

const PlanCard = ({ plan, onDelete }) => {
    const week = currentWeek(plan)
    return (
        <article className="plan-card">
            <div className="page-head">
                <div>
                    <h3>{plan.name}</h3>
                    <p className="muted">
                        {GOALS[plan.goal]} · {LEVELS[plan.level]} · {plan.days.length} days/week · started {formatDate(plan.startDate)}
                    </p>
                </div>
                <button type="button" className="link-button danger" onClick={() => onDelete(plan)}>Delete</button>
            </div>
            <div className="plan-progress" aria-label={`Week ${Math.min(week, plan.durationWeeks)} of ${plan.durationWeeks}`}>
                <div style={{ width: `${Math.min(100, (week / plan.durationWeeks) * 100)}%` }} />
            </div>
            <p className="muted">{week > plan.durationWeeks ? 'Plan complete' : `Week ${week} of ${plan.durationWeeks}`}</p>
            <div className="plan-days">
                {plan.days.map((day) => (
                    <div key={day._id} className="plan-day">
                        <h4>{day.name}</h4>
                        <ul className="plain-list">
                            {day.exercises.map((p, i) => p.exercise && (
                                <li key={i}>
                                    <Link to={`/exercises/${p.exercise._id}`}>{p.exercise.name}</Link>
                                    <span className="muted"> {p.sets} × {p.reps ? p.reps : `${p.durationSec}s`}</span>
                                </li>
                            ))}
                        </ul>
                        <Link className="button small" to={`/log?plan=${plan._id}&day=${day._id}`}>Start</Link>
                    </div>
                ))}
            </div>
        </article>
    )
}

const Plans = () => {
    const [plans, setPlans] = useState(null)
    const [mode, setMode] = useState('generate')
    const [error, setError] = useState(null)

    useEffect(() => {
        api.getPlans().then(setPlans).catch((e) => setError(e.message))
    }, [])

    const handleCreated = (plan) => setPlans([plan, ...(plans || [])])
    const handleDelete = async (plan) => {
        if (!window.confirm(`Delete "${plan.name}"?`)) return
        try {
            await api.deletePlan(plan._id)
            setPlans(plans.filter((p) => p._id !== plan._id))
        } catch (e) {
            setError(e.message)
        }
    }

    return (
        <div className="home">
            <div>
                <h2>Workout plans</h2>
                {error && <div className="error">{error}</div>}
                {plans && !plans.length && <p className="muted">No plans yet. Generate one or build your own.</p>}
                {plans && plans.map((plan) => <PlanCard key={plan._id} plan={plan} onDelete={handleDelete} />)}
            </div>
            <aside>
                <div className="segmented" role="tablist">
                    <button type="button" role="tab" aria-selected={mode === 'generate'} className={mode === 'generate' ? 'active' : ''} onClick={() => setMode('generate')}>Generate</button>
                    <button type="button" role="tab" aria-selected={mode === 'build'} className={mode === 'build' ? 'active' : ''} onClick={() => setMode('build')}>Build</button>
                </div>
                {mode === 'generate' ? <GeneratorForm onCreated={handleCreated} /> : <BuilderForm onCreated={handleCreated} />}
            </aside>
        </div>
    )
}

export default Plans
